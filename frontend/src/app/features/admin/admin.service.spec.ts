import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AdminService } from './admin.service';
import { buildConcert } from '../../testing/concert.fixture';
import { buildTrip } from '../../testing/trip.fixture';

describe('AdminService', () => {
  let service: AdminService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads stats', () => {
    service.getStats().subscribe();
    const req = httpTesting.expectOne('/api/admin/stats');
    expect(req.request.method).toBe('GET');
    req.flush({
      users: 1,
      concerts: { total: 1, cached: 1, userSubmitted: 0, hidden: 0 },
      tripsByStatus: {},
      bookingsByStatus: {},
      reviews: 0,
    });
  });

  it('lists users with a search query', () => {
    service.listUsers('ada', 1).subscribe();
    const req = httpTesting.expectOne('/api/admin/users?page=1&q=ada');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, page: 1 });
  });

  it('disables and enables users', () => {
    service.disableUser('u1').subscribe();
    const disable = httpTesting.expectOne('/api/admin/users/u1/disable');
    expect(disable.request.method).toBe('POST');
    disable.flush({ id: 'u1' });

    service.enableUser('u1').subscribe();
    const enable = httpTesting.expectOne('/api/admin/users/u1/enable');
    expect(enable.request.method).toBe('POST');
    enable.flush({ id: 'u1' });
  });

  it('hides concerts and cancels trips', () => {
    service.hideConcert('c1').subscribe();
    httpTesting.expectOne('/api/admin/concerts/c1/hide').flush(buildConcert({ hidden: true }));

    service.cancelTrip('t1').subscribe();
    httpTesting.expectOne('/api/admin/trips/t1/cancel').flush(buildTrip({ status: 'CANCELLED' }));
  });
});
