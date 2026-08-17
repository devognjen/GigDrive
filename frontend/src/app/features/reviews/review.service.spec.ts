import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Review } from '../../core/models/review.model';
import { ReviewService } from './review.service';

describe('ReviewService', () => {
  let service: ReviewService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReviewService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReviewService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates a review for a trip', () => {
    service.create('t1', { rating: 5, comment: 'Great ride' }).subscribe();
    const req = httpMock.expectOne('/api/trips/t1/reviews');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ rating: 5, comment: 'Great ride' });
    req.flush({} as Review);
  });

  it('lists reviews of a driver', () => {
    service.listForDriver('u1').subscribe();
    const req = httpMock.expectOne('/api/users/u1/reviews');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
