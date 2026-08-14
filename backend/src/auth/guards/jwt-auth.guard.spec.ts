import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let superCanActivate: jest.SpyInstance;

  const handler = jest.fn();
  const controllerClass = jest.fn();
  const context = {
    getHandler: () => handler,
    getClass: () => controllerClass,
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    reflector = { getAllAndOverride: jest.fn() };
    // Spy on the AuthGuard('jwt') mixin JwtAuthGuard extends.
    superCanActivate = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard, { provide: Reflector, useValue: reflector }],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  afterEach(() => {
    superCanActivate.mockRestore();
  });

  it('short-circuits @Public() routes without invoking passport', () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    expect(guard.canActivate(context)).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
      handler,
      controllerClass,
    ]);
    expect(superCanActivate).not.toHaveBeenCalled();
  });

  it('delegates to the JWT passport guard for protected routes', () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    expect(guard.canActivate(context)).toBe(true);
    expect(superCanActivate).toHaveBeenCalledWith(context);
  });
});
