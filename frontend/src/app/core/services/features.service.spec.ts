import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { FeaturesService } from './features.service';

describe('FeaturesService', () => {
  let service: FeaturesService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    service = TestBed.inject(FeaturesService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads flags and exposes chatEnabled', () => {
    expect(service.chatEnabled()).toBe(false);

    const req = httpTesting.expectOne('/api/features');
    expect(req.request.method).toBe('GET');
    req.flush({ chat: true });

    expect(service.features()).toEqual({ chat: true });
    expect(service.chatEnabled()).toBe(true);
  });

  it('treats chat as off when the flags request fails', () => {
    httpTesting.expectOne('/api/features').flush(null, {
      status: 500,
      statusText: 'Server Error',
    });

    expect(service.features()).toEqual({ chat: false });
    expect(service.chatEnabled()).toBe(false);
  });
});
