import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthResponse, User } from '../../../core/models/user.model';
import { Register } from './register';

const mockUser: User = {
  id: 'u1',
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: null,
  emailNotifications: true,
};

const mockAuthResponse: AuthResponse = { accessToken: 'jwt-token', user: mockUser };

const validForm = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  password: 'password123',
  phone: '',
};

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let httpTesting: HttpTestingController;

  const submitForm = () => {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
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

    component['form'].setValue(validForm);
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
  });

  it('enforces required fields, email format and the 8-character password minimum', () => {
    const form = component['form'];
    form.setValue({ ...validForm, firstName: '', email: 'not-an-email', password: 'short' });

    expect(form.controls.firstName.hasError('required')).toBe(true);
    expect(form.controls.email.hasError('email')).toBe(true);
    expect(form.controls.password.hasError('minlength')).toBe(true);

    form.controls.password.setValue('password123');
    expect(form.controls.password.valid).toBe(true);
  });

  it('shows validation messages for touched invalid fields', () => {
    const form = component['form'];
    form.controls.password.setValue('short');
    form.controls.password.markAsTouched();
    form.controls.firstName.markAsTouched();
    fixture.detectChanges();

    const errors = [...fixture.nativeElement.querySelectorAll('.error')].map((e) =>
      e.textContent.trim(),
    );
    expect(errors).toContain('First name is required.');
    expect(errors).toContain('Password must be at least 8 characters.');
  });

  it('registers, stores the session and navigates to /concerts', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component['form'].setValue(validForm);
    fixture.detectChanges();
    submitForm();

    const req = httpTesting.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'password123',
    });
    req.flush(mockAuthResponse);

    expect(localStorage.getItem('gigdrive.token')).toBe('jwt-token');
    expect(navigateSpy).toHaveBeenCalledWith(['/concerts']);
  });

  it('includes the phone in the payload when provided', () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component['form'].setValue({ ...validForm, phone: '+49 170 1234567' });
    fixture.detectChanges();
    submitForm();

    const req = httpTesting.expectOne('/api/auth/register');
    expect(req.request.body.phone).toBe('+49 170 1234567');
    req.flush(mockAuthResponse);
  });

  it('shows "This email is already registered" on a 409 response', () => {
    component['form'].setValue(validForm);
    fixture.detectChanges();
    submitForm();

    httpTesting
      .expectOne('/api/auth/register')
      .flush({ message: 'Email already in use' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role=alert]') as HTMLElement;
    expect(alert.textContent).toContain('This email is already registered');
  });

  it('links to the login page', () => {
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a[href="/auth/login"]');
    expect(link).toBeTruthy();
  });
});
