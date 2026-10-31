// PrismaService is replaced so the test needs neither a generated Prisma client
// nor a database; only the /health/simple route is exercised.
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class PrismaService {} }));

import { execFile } from 'child_process';
import { readFileSync } from 'fs';
import { AddressInfo } from 'net';
import { resolve } from 'path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DiskHealthIndicator, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import * as request from 'supertest';
import { PrismaService } from '../prisma/prisma.service';
import { HealthController } from './health.controller';

// Same default as API_PREFIX in main.ts.
const DEFAULT_API_PREFIX = 'api/v1';

async function createHealthApp(prefix: string): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [
      { provide: HealthCheckService, useValue: {} },
      { provide: MemoryHealthIndicator, useValue: {} },
      { provide: DiskHealthIndicator, useValue: {} },
      { provide: PrismaService, useValue: {} },
    ],
  }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  app.setGlobalPrefix(prefix);
  await app.listen(0);
  return app;
}

/** The shell-form CMD of the Dockerfile HEALTHCHECK, with line continuations joined. */
function dockerHealthcheckCommand(): string {
  const dockerfile = readFileSync(resolve(__dirname, '../../../Dockerfile'), 'utf8');
  const match = dockerfile.replace(/\\\r?\n/g, ' ').match(/^HEALTHCHECK\s.*?\sCMD\s+(.+)$/m);
  if (!match) {
    throw new Error('Dockerfile has no HEALTHCHECK ... CMD instruction');
  }
  return match[1].trim();
}

/** Runs the command the way Docker runs a shell-form CMD and resolves with its exit code. */
function runHealthcheck(port: number, apiPrefix?: string): Promise<number> {
  const env: NodeJS.ProcessEnv = { ...process.env, PORT: String(port) };
  delete env.API_PREFIX;
  if (apiPrefix !== undefined) {
    env.API_PREFIX = apiPrefix;
  }
  return new Promise((done) => {
    execFile('/bin/sh', ['-c', dockerHealthcheckCommand()], { env, timeout: 10_000 }, (error) => {
      done(error ? (typeof error.code === 'number' ? error.code : 1) : 0);
    });
  });
}

describe('Health routes under the global prefix', () => {
  let app: INestApplication;
  let port: number;

  beforeAll(async () => {
    app = await createHealthApp(DEFAULT_API_PREFIX);
    port = (app.getHttpServer().address() as AddressInfo).port;
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves GET /api/v1/health/simple', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health/simple').expect(200);
    expect(res.body).toEqual({ status: 'ok', timestamp: expect.any(String) });
  });

  it('does not serve the unprefixed GET /health/simple', async () => {
    await request(app.getHttpServer()).get('/health/simple').expect(404);
  });

  it('the Dockerfile HEALTHCHECK command exits 0 against the default prefix', async () => {
    await expect(runHealthcheck(port)).resolves.toBe(0);
  });
});

describe('Dockerfile HEALTHCHECK with a custom API_PREFIX', () => {
  let app: INestApplication;
  let port: number;

  beforeAll(async () => {
    app = await createHealthApp('custom/v2');
    port = (app.getHttpServer().address() as AddressInfo).port;
  });

  afterAll(async () => {
    await app.close();
  });

  it('exits 0 when API_PREFIX matches the app prefix', async () => {
    await expect(runHealthcheck(port, 'custom/v2')).resolves.toBe(0);
  });

  it('exits 1 when the probed path is not served', async () => {
    await expect(runHealthcheck(port)).resolves.toBe(1);
  });
});
