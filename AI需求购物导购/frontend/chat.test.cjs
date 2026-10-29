// No browser or third-party dependencies: exercise the page's actual inline script.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const source = readFileSync(`${__dirname}/index.html`, 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];

function setup(fetch, frozenClock = false) {
    let clock = 123;
    let timerSequence = 0;
    const timers = new Map();
    const logs = [];
    const messages = [];
    const input = { value: '' };
    const inputError = { hidden: true, innerText: '' };
    const chatBox = { appendChild: node => messages.push(node), scrollHeight: 100 };
    const document = {
        getElementById: id => id === 'chatBox' ? chatBox : id === 'userInput' ? input : id === 'inputError' ? inputError : messages.find(m => m.id === id),
        createElement: () => {
            const node = { innerText: '', innerHTML: '', attributes: {},
                setAttribute(name, value) { this.attributes[name] = value; },
                remove: () => messages.splice(messages.indexOf(node), 1) };
            return node;
        },
    };
    const context = vm.createContext({ document, fetch, AbortController,
        setTimeout(callback, delay) { const id = ++timerSequence; timers.set(id, { callback, delay }); return id; },
        clearTimeout(id) { timers.delete(id); },
        console: { error: (...args) => logs.push(args.join(' ')) },
        Date: { now: () => frozenClock ? 123 : clock++ } });
    vm.runInContext(source, context);
    return { messages, input, inputError, timers, logs, run: script => vm.runInContext(script, context) };
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
test('success preserves user text and replaces its loading message', async () => {
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

test('out-of-order replies remain beside their corresponding questions', async () => {
    const pending = [];
    const page = setup(() => new Promise(resolve => pending.push(resolve)));
    page.input.value = 'first';
    const first = page.run('sendMessage()');
    const firstReply = page.messages[1];
    page.input.value = 'second';
    const second = page.run('sendMessage()');
    const secondReply = page.messages[3];
    pending[1]({ ok: true, json: async () => result({ symptoms: ['second'] }) });
    await second;
    pending[0]({ ok: true, json: async () => result({ symptoms: ['first'] }) });
    await first;
    assert.equal(page.messages[1], firstReply);
    assert.equal(page.messages[3], secondReply);
    assert.match(firstReply.innerHTML, /first/);
    assert.match(secondReply.innerHTML, /second/);
});

test('a stalled request is aborted after 15 seconds and leaves a visible timeout', async () => {
    let signal;
    const page = setup((url, options) => {
        signal = options.signal;
        return new Promise((resolve, reject) => {
            signal?.addEventListener('abort', () => reject(new Error('aborted')));
        });
    });
    page.input.value = '遮光';
    const sending = page.run('sendMessage()');
    assert.equal(page.timers.size, 1);
    const timer = [...page.timers.values()][0];
    assert.equal(timer.delay, 15000);
    timer.callback();
    await sending;
    assert.equal(signal.aborted, true);
    assert.match(page.messages[1].innerText, /超时/);
    assert.equal(page.timers.size, 0);
});

test('the deadline also covers a stalled response body', async () => {
    let bodyStarted;
    const started = new Promise(resolve => { bodyStarted = resolve; });
    const page = setup(async (url, { signal }) => ({ ok: true, json: () => new Promise((resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new Error('aborted')));
        bodyStarted();
    }) }));
    page.input.value = '眼罩';
    const sending = page.run('sendMessage()');
    await started;
    assert.equal(page.timers.size, 1);
    [...page.timers.values()][0].callback();
    await sending;
    assert.match(page.messages[1].innerText, /超时/);
    assert.equal(page.timers.size, 0);
});

test('completion clears timers and exposes the final busy state on success and failure', async () => {
    for (const fetch of [response(result()), async () => { throw Error('offline'); }]) {
        const page = setup(fetch);
        await send(page);
        assert.equal(page.timers.size, 0);
        assert.equal(page.messages[1].attributes['aria-busy'], 'false');
    }
});

test('errors do not copy upstream error text into the UI or console', async () => {
    const privateMarker = 'synthetic-private-input';
    const page = setup(async () => { throw Error(privateMarker); });
    await send(page);
    assert.ok(!page.logs.join(' ').includes(privateMarker));
    assert.ok(!page.messages[1].innerText.includes(privateMarker));
});

test('a timed-out request cannot change another pending response', async () => {
    const pending = [];
    const page = setup((url, { signal }) => new Promise((resolve, reject) => {
        pending.push(resolve);
        signal?.addEventListener('abort', () => reject(Error('aborted')));
    }));
    page.input.value = 'first';
    const first = page.run('sendMessage()');
    page.input.value = 'second';
    const second = page.run('sendMessage()');
    assert.equal(page.timers.size, 2);
    [...page.timers.values()][0].callback();
    await first;
    assert.match(page.messages[1].innerText, /超时/);
    assert.equal(page.messages[3].innerText, '正在分析您的需求...');
    pending[1]({ ok: true, json: async () => result({ symptoms: ['second'] }) });
    await second;
    assert.match(page.messages[3].innerHTML, /second/);
    assert.equal(page.timers.size, 0);
});

test('oversized input is kept for editing and makes no request', async () => {
    const page = setup(() => { throw Error('must not fetch'); });
    const text = '光'.repeat(2001);
    await send(page, text);
    assert.equal(page.messages.length, 0);
    assert.equal(page.input.value, text);
    assert.equal(page.inputError.hidden, false);
    assert.match(page.inputError.innerText, /2000/);
    assert.equal(page.timers.size, 0);
});

test('the maximum input length is accepted and clears an earlier validation error', async () => {
    const page = setup(response(result()));
    await send(page, '光'.repeat(2001));
    await send(page, '光'.repeat(2000));
    assert.equal(page.messages.length, 2);
    assert.equal(page.inputError.hidden, true);
    assert.match(page.messages[1].innerHTML, /分析结果/);
});

test('HTTP validation errors explain the input problem without exposing the response body', async () => {
    const page = setup(async () => ({ ok: false, status: 422, json() { throw Error('must not read error body'); } }));
    await send(page);
    assert.match(page.messages[1].innerText, /需求格式不正确/);
    assert.equal(page.timers.size, 0);
});

test('action and product text colors meet the 4.5:1 body-text contrast requirement', () => {
    const css = readFileSync(`${__dirname}/index.html`, 'utf8').match(/<style>([\s\S]*?)<\/style>/)[1];
    const tokens = Object.fromEntries([...css.matchAll(/(--[\w-]+):\s*(#[\da-f]{6})/gi)].map(m => [m[1], m[2]]));
    const value = (selector, property) => {
        const rule = css.slice(css.indexOf(`${selector} {`)).split('}')[0];
        const raw = rule.match(new RegExp(`(?:^|[;{])\\s*${property}:\\s*([^;]+)`))[1].trim();
        return raw.startsWith('var(') ? tokens[raw.slice(4, -1)] : raw;
    };
    const luminance = color => {
        if (color === 'white') color = '#ffffff';
        const channels = color.slice(1).match(/../g).map(hex => {
            const s = parseInt(hex, 16) / 255;
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const pairs = [
        ['.user-message', value('.user-message', 'color'), value('.user-message', 'background-color')],
        ['button', value('button', 'color'), value('button', 'background-color')],
        ['button:hover', value('button', 'color'), value('button:hover', 'background-color')],
        ...['.product-price', '.product-reason', '.product-pros'].map(s => [s, value(s, 'color'), value('.product-card', 'background')]),
    ];
    for (const [selector, fg, bg] of pairs) {
        const a = luminance(fg), b = luminance(bg);
        const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        assert.ok(ratio >= 4.5, `${selector}: ${ratio.toFixed(2)}:1`);
    }
});
