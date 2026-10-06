import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AdminOverview } from './admin-overview';

const stats = {
  users: 4,
  concerts: { total: 6, cached: 5, userSubmitted: 1, hidden: 0 },
  tripsByStatus: { OPEN: 1, CANCELLED: 0 },
  bookingsByStatus: { CONFIRMED: 3 },
  reviews: 2,
};

describe('AdminOverview', () => {
  let fixture: ComponentFixture<AdminOverview>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminOverview],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminOverview);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('renders KPI cards', async () => {
    fixture.detectChanges();
    httpTesting.expectOne('/api/admin/stats').flush(stats);
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Users');
    expect(text).toContain('4');
    expect(text).toContain('1 submitted');
    expect(text).toContain('OPEN');
  });

  it('shows an error state', async () => {
    fixture.detectChanges();
    httpTesting
      .expectOne('/api/admin/stats')
      .flush('nope', { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Could not load platform stats.');
  });
});
