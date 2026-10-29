// No browser or third-party dependencies: exercise the page's actual inline script.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const source = readFileSync(`${__dirname}/index.html`, 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];

function setup(fetch, frozenClock = false) {
    let clock = 123;
    const messages = [];
    const input = { value: '' };
    const chatBox = { appendChild: node => messages.push(node), scrollHeight: 100 };
    const document = {
        getElementById: id => id === 'chatBox' ? chatBox : id === 'userInput' ? input : messages.find(m => m.id === id),
        createElement: () => {
            const node = { innerText: '', innerHTML: '', remove: () => messages.splice(messages.indexOf(node), 1) };
            return node;
        },
    };
    const context = vm.createContext({ document, fetch, console: { error() {} }, Date: { now: () => frozenClock ? 123 : clock++ } });
    vm.runInContext(source, context);
    return { messages, input, run: script => vm.runInContext(script, context) };
}
const result = overrides => ({ symptoms: ['光线干扰'], solutions: ['改善环境'], products: [], detected_budget: null, ...overrides });
const response = data => async () => ({ ok: true, json: async () => data });
async function send(page, text = '遮光眼罩') {
    page.input.value = text;
    await page.run('sendMessage()');
}

test('same-millisecond messages have distinct IDs', () => {
    const page = setup(response(result()), true);
    const a = page.run("addMessage('one', 'user-message')");
    const b = page.run("addMessage('two', 'ai-message')");
    assert.notEqual(a, b);
});
test('success preserves user text and removes only its loading message', async () => {
    const page = setup(response(result()));
    await send(page, '<img src=x onerror=alert(1)>');
    assert.equal(page.messages.length, 2);
    assert.equal(page.messages[0].innerText, '<img src=x onerror=alert(1)>');
    assert.equal(page.messages[0].innerHTML, '');
    assert.match(page.messages[1].innerHTML, /分析结果/);
});
test('server error cannot masquerade as successful analysis', async () => {
    const page = setup(async () => ({ ok: false, status: 500, json: async () => result() }));
    await send(page);
    assert.match(page.messages.at(-1).innerText, /暂时不可用/);
    assert.equal(page.messages.length, 2);
});
for (const data of [null, {}, result({ symptoms: null }), result({ solutions: 'bad' }), result({ products: {} })]) {
    test(`malformed payload ${JSON.stringify(data)} keeps visible error`, async () => {
        const page = setup(response(data));
        await send(page);
        assert.equal(page.messages.length, 2);
        assert.match(page.messages.at(-1).innerText, /暂时不可用/);
    });
}
test('network and JSON failures leave an error message', async () => {
    for (const fetch of [async () => { throw Error('offline'); }, async () => ({ ok: true, json: async () => { throw Error('invalid JSON'); } })]) {
        const page = setup(fetch);
        await send(page);
        assert.match(page.messages.at(-1).innerText, /暂时不可用/);
    }
});
test('all API values are rendered as escaped text', async () => {
    const attack = '<img src=x onerror="alert(1)">&\'';
    const page = setup(response(result({
        symptoms: [attack], solutions: [attack], detected_budget: attack,
        products: [{ name: attack, price: attack, rating: attack, review_count: attack, recommendation_reason: attack, pros: [attack] }],
    })));
    await send(page);
    const html = page.messages.at(-1).innerHTML;
    assert.ok(!html.includes('<img'));
    assert.ok(!html.includes(attack));
    assert.equal((html.match(/&lt;img/g) || []).length, 9);
});
test('zero budget is displayed', async () => {
    const page = setup(response(result({ detected_budget: 0 })));
    await send(page);
    assert.match(page.messages.at(-1).innerHTML, /¥0以内/);
});
test('blank input makes no request or message', async () => {
    const page = setup(() => { throw Error('must not fetch'); });
    await send(page, '   ');
    assert.equal(page.messages.length, 0);
});
test('IME confirmation does not send while composing', () => {
    const page = setup(response(result()));
    page.input.value = '遮光';
    page.run("handleKeyPress({ key: 'Enter', isComposing: true })");
    assert.equal(page.messages.length, 0);
});
test('overlapping requests clean up their own loading messages', async () => {
    const pending = [];
    const page = setup(() => new Promise(resolve => pending.push(resolve)), true);
    page.input.value = 'first';
    const first = page.run('sendMessage()');
    page.input.value = 'second';
    const second = page.run('sendMessage()');
    pending[1]({ ok: true, json: async () => result({ symptoms: ['second'] }) });
    await second;
    pending[0]({ ok: true, json: async () => result({ symptoms: ['first'] }) });
    await first;
    assert.deepEqual(page.messages.filter(m => m.className.includes('user-message')).map(m => m.innerText), ['first', 'second']);
    assert.equal(page.messages.length, 4);
    assert.ok(page.messages.filter(m => m.className.includes('ai-message')).every(m => m.innerHTML.includes('分析结果')));
});

test('a malformed product keeps a visible error instead of losing the reply', async () => {
    const page = setup(response(result({ products: [{ name: 'broken', pros: null }] })));
    await send(page);
    assert.equal(page.messages.length, 2);
    assert.match(page.messages.at(-1).innerText, /暂时不可用/);
});
