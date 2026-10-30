import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('authenticated users cannot self-grant subscription benefits', async () => {
  const controller = await read('AI运动健康/backend/src/modules/users/users.controller.ts');
  const method = controller.match(/@Put\('subscription'\)([\s\S]*?)@Delete\('account'\)/)?.[1] ?? '';
  assert.match(method, /ForbiddenException/);
  assert.doesNotMatch(method, /usersService\.updateSubscription/);
});

test('production compose requires JWT secrets', async () => {
  const compose = await read('AI运动健康/docker-compose.yml');
  assert.match(compose, /JWT_SECRET: \$\{JWT_SECRET:\?JWT_SECRET is required\}/);
  assert.match(compose, /JWT_REFRESH_SECRET: \$\{JWT_REFRESH_SECRET:\?JWT_REFRESH_SECRET is required\}/);
  assert.doesNotMatch(compose, /your-super-secret-(?:jwt|refresh)-key/);
});

test('outfit assistant JWT key comes from required settings', async () => {
  const config = await read('AI情绪运动教练/ai-outfit-assistant/backend/app/core/config.py');
  const security = await read('AI情绪运动教练/ai-outfit-assistant/backend/app/core/security.py');
  assert.match(config, /^\s*SECRET_KEY: str\s*$/m);
  assert.match(security, /settings\.SECRET_KEY/);
  assert.doesNotMatch(security, /CHANGE_THIS_TO_A_SECURE_SECRET_KEY/);
});
