import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { Profile } from './profile';

const mockUser: User = {
  id: 'u1',
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: '+49 170 1234567',
  emailNotifications: true,
};

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);

    // Establish an authenticated session before the component is created.
    TestBed.inject(AuthService).login('ada@example.com', 'password123').subscribe();
    httpTesting
      .expectOne('/api/auth/login')
      .flush({ accessToken: 'jwt-token', user: mockUser });

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('prefills the form from the current user', () => {
    fixture.detectChanges();

    expect(component['form'].getRawValue()).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '+49 170 1234567',
      emailNotifications: true,
    });

    const firstNameInput = fixture.nativeElement.querySelector('#firstName') as HTMLInputElement;
    expect(firstNameInput.value).toBe('Ada');
    const checkbox = fixture.nativeElement.querySelector(
      '#emailNotifications',
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('keeps the save button disabled while the form is pristine', () => {
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[type=submit]') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    component['form'].controls.firstName.setValue('Augusta');
    component['form'].controls.firstName.markAsDirty();
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
  });

  it('saves changes and shows a confirmation', () => {
    fixture.detectChanges();
    component['form'].controls.firstName.setValue('Augusta');
    component['form'].controls.firstName.markAsDirty();
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    const updated: User = { ...mockUser, firstName: 'Augusta' };
    const req = httpTesting.expectOne('/api/users/me');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      firstName: 'Augusta',
      lastName: 'Lovelace',
      phone: '+49 170 1234567',
      emailNotifications: true,
    });
    req.flush(updated);
    fixture.detectChanges();

    const status = fixture.nativeElement.querySelector('[role=status]') as HTMLElement;
    expect(status.textContent).toContain('Profile saved.');
    expect(TestBed.inject(AuthService).currentUser()?.firstName).toBe('Augusta');

    // The saved values become the new baseline: pristine again, button disabled.
    const button = fixture.nativeElement.querySelector('button[type=submit]') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
