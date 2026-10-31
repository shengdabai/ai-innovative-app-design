import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ModuleMetadata,
  Provider,
  Type,
  ValidationPipe,
} from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { JwtAuthGuard, JwtOptionalGuard } from '../guards/jwt-auth.guard';

export const TEST_USER_ID = 'user-1';

/**
 * Builds a Nest HTTP app around one controller for request-level tests.
 * See createTestApp for what is replaced and what mirrors main.ts.
 */
export async function createControllerTestApp(
  controller: Type<unknown>,
  providers: Provider[],
): Promise<INestApplication> {
  return createTestApp({ controllers: [controller], providers });
}

/**
 * Builds a Nest HTTP app from module metadata for request-level tests, for
 * example `{ imports: [SomeModule] }` when a test needs the module's own
 * configuration (such as its MulterModule options). `override` can replace
 * providers on the testing module builder before it compiles.
 * The JWT guards (required and optional) are replaced by a guard that attaches
 * a fixed user. The query parser and the global ValidationPipe use the same
 * settings as main.ts, so query values are parsed and go through the same pipe
 * chain as in production.
 */
export async function createTestApp(
  metadata: ModuleMetadata,
  override: (builder: TestingModuleBuilder) => TestingModuleBuilder = (builder) => builder,
): Promise<INestApplication> {
  const fakeAuthGuard: CanActivate = {
    canActivate(context: ExecutionContext) {
      context.switchToHttp().getRequest().user = { id: TEST_USER_ID, email: 'user@example.com' };
      return true;
    },
  };

  const moduleRef = await override(Test.createTestingModule(metadata))
    .overrideGuard(JwtAuthGuard)
    .useValue(fakeAuthGuard)
    .overrideGuard(JwtOptionalGuard)
    .useValue(fakeAuthGuard)
    .compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  app.set('query parser', 'extended');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  await app.init();
  return app;
}
