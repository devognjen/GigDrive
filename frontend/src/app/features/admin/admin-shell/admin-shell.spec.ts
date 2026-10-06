import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AdminShell } from './admin-shell';

describe('AdminShell', () => {
  let fixture: ComponentFixture<AdminShell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminShell],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(AdminShell);
    fixture.detectChanges();
  });

  it('renders section links', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Overview');
    expect(text).toContain('Users');
    expect(text).toContain('Concerts');
    expect(text).toContain('Trips');
  });
});
