import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { authGuard } from './auth-guard';

describe('authGuard', () => {
  const executeGuard = () =>
    TestBed.runInInjectionContext(
      () => authGuard({ data: {} } as any, {} as any) as any,
    );

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
