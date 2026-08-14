import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthResponse, User } from '../../../core/models/user.model';
import { Login } from './login';

const mockUser: User = {
  id: 'u1',
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: null,
  emailNotifications: true,
};

const mockAuthResponse: AuthResponse = { accessToken: 'jwt-token', user: mockUser };

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let httpTesting: HttpTestingController;

  const submitForm = () => {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps the submit button disabled while the form is invalid', () => {
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[type=submit]') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    component['form'].controls.email.setValue('ada@example.com');
    component['form'].controls.password.setValue('password123');
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
  });

  it('shows validation messages for invalid fields', () => {
    const form = component['form'];
    form.controls.email.setValue('not-an-email');
    form.controls.email.markAsTouched();
    form.controls.password.markAsTouched();
    fixture.detectChanges();

    const errors = [...fixture.nativeElement.querySelectorAll('.error')].map((e) =>
      e.textContent.trim(),
    );
    expect(errors).toContain('Enter a valid email address.');
    expect(errors).toContain('Password is required.');
  });

  it('submits credentials and navigates to /concerts on success', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component['form'].setValue({ email: 'ada@example.com', password: 'password123' });
    fixture.detectChanges();
    submitForm();

    const req = httpTesting.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'ada@example.com', password: 'password123' });
    req.flush(mockAuthResponse);

    expect(localStorage.getItem('gigdrive.token')).toBe('jwt-token');
    expect(navigateSpy).toHaveBeenCalledWith(['/concerts']);
  });

  it('shows "Invalid email or password" on a 401 response', () => {
    component['form'].setValue({ email: 'ada@example.com', password: 'wrong-password' });
    fixture.detectChanges();
    submitForm();

    httpTesting
      .expectOne('/api/auth/login')
      .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role=alert]') as HTMLElement;
    expect(alert.textContent).toContain('Invalid email or password');
  });

  it('links to the register page', () => {
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a[href="/auth/register"]');
    expect(link).toBeTruthy();
  });
});
