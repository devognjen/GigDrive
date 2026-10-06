import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { buildConcert } from '../../../testing/concert.fixture';
import { AdminConcerts } from './admin-concerts';

describe('AdminConcerts', () => {
  let fixture: ComponentFixture<AdminConcerts>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminConcerts],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminConcerts);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('shows an empty state for the submitted filter', async () => {
    fixture.detectChanges();
    httpTesting.expectOne('/api/admin/concerts?userSubmitted=true').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No concerts in this filter.');
  });

  it('hides a concert', async () => {
    const concert = buildConcert({ userSubmitted: true, hidden: false });
    fixture.detectChanges();
    httpTesting.expectOne('/api/admin/concerts?userSubmitted=true').flush([concert]);
    await fixture.whenStable();
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button.btn-danger') as HTMLButtonElement;
    button.click();
    httpTesting.expectOne('/api/admin/concerts/c1/hide').flush({ ...concert, hidden: true });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Unhide');
  });
});
