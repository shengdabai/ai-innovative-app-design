import { CanActivate, ExecutionContext, INestApplication, Provider, Type, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtAuthGuard, JwtOptionalGuard } from '../guards/jwt-auth.guard';

export const TEST_USER_ID = 'user-1';

/**
 * Builds a Nest HTTP app around one controller for request-level tests.
 * The JWT guards (required and optional) are replaced by a guard that attaches
 * a fixed user, and the global ValidationPipe uses the same options as main.ts
 * so query values go through the same pipe chain as in production.
 */
export async function createControllerTestApp(
  controller: Type<unknown>,
  providers: Provider[],
): Promise<INestApplication> {
  const fakeAuthGuard: CanActivate = {
    canActivate(context: ExecutionContext) {
      context.switchToHttp().getRequest().user = { id: TEST_USER_ID, email: 'user@example.com' };
      return true;
    },
  };

  const moduleRef = await Test.createTestingModule({
    controllers: [controller],
    providers,
  })
    .overrideGuard(JwtAuthGuard)
    .useValue(fakeAuthGuard)
    .overrideGuard(JwtOptionalGuard)
    .useValue(fakeAuthGuard)
    .compile();

  const app = moduleRef.createNestApplication({ logger: false });
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
