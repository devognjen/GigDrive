import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import {
  ConcertDetails as ConcertDetailsData,
  ConcertWeather,
} from '../../../core/models/concert.model';
import { ConcertDetails } from './concert-details';

const mockDetails: ConcertDetailsData = {
  concert: {
    id: 'c1',
    externalId: null,
    userSubmitted: true,
    artist: 'Metallica',
    title: 'M72 World Tour',
    venue: 'Stade de France',
    city: 'Paris',
    country: 'France',
    lat: 48.92,
    lng: 2.36,
    startAt: '2026-09-01T18:00:00.000Z',
    imageUrl: 'https://example.com/m72.jpg',
    genre: 'Metal',
    ticketUrl: 'https://tickets.example.com/m72',
  },
  trips: [
    {
      id: 't1',
      status: 'OPEN',
      departureAt: '2026-09-01T14:00:00.000Z',
      minPassengers: 2,
      maxPassengers: 4,
      driverId: 'u1',
      driverName: 'Ada',
    },
    {
      id: 't2',
      status: 'FULL',
      departureAt: '2026-09-01T12:30:00.000Z',
      minPassengers: 1,
      maxPassengers: 3,
      driverId: 'u2',
      driverName: 'Grace',
    },
  ],
};

const hiddenWeather: ConcertWeather = { available: false, reason: 'UNAVAILABLE' };

const forecast: ConcertWeather = {
  available: true,
  date: '2026-09-01',
  weatherCode: 0,
  description: 'Clear',
  tempMinC: 12,
  tempMaxC: 24,
  precipitationMm: 0,
};

function flushPage(
  httpTesting: HttpTestingController,
  details: ConcertDetailsData | 'not-found' = mockDetails,
  weather: ConcertWeather | 'error' = hiddenWeather,
): void {
  const detailsReq = httpTesting.expectOne('/api/concerts/c1');
  const weatherReq = httpTesting.expectOne('/api/concerts/c1/weather');
  expect(detailsReq.request.method).toBe('GET');
  expect(weatherReq.request.method).toBe('GET');

  // Flush weather first: if details 404s, zip unsubscribes and cancels weather.
  if (weather === 'error') {
    weatherReq.flush({ message: 'fail' }, { status: 500, statusText: 'Server Error' });
  } else {
    weatherReq.flush(weather);
  }

  if (details === 'not-found') {
    detailsReq.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
  } else {
    detailsReq.flush(details);
  }
}

describe('ConcertDetails', () => {
  let component: ConcertDetails;
  let fixture: ComponentFixture<ConcertDetails>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ConcertDetails],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'c1' }) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConcertDetails);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    flushPage(httpTesting);
  });

  it('loads the concert by route param and renders its info', () => {
    fixture.detectChanges();
    flushPage(httpTesting);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const text = element.textContent as string;
    expect(text).toContain('Metallica');
    expect(text).toContain('M72 World Tour');
    expect(text).toContain('Stade de France');
    expect(text).toContain('Paris, France');
    expect(text).toContain('Metal');
    expect(text).toContain('user-submitted');

    const image = element.querySelector('img.cover') as HTMLImageElement;
    expect(image.getAttribute('src')).toBe('https://example.com/m72.jpg');

    const tickets = element.querySelector('a.tickets') as HTMLAnchorElement;
    expect(tickets.getAttribute('href')).toBe('https://tickets.example.com/m72');

    const offer = element.querySelector('a.offer-ride') as HTMLAnchorElement;
    expect(offer.getAttribute('href')).toBe('/trips/new?concertId=c1');
    expect(offer.textContent).toContain('Offer a ride to this concert');
  });

  it('renders the trips linked to the concert', () => {
    fixture.detectChanges();
    flushPage(httpTesting);
    fixture.detectChanges();

    const trips = fixture.nativeElement.querySelectorAll('.trips li') as NodeListOf<Element>;
    expect(trips.length).toBe(2);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ada');
    expect(text).toContain('Grace');
    expect(text).toContain('OPEN');
    expect(text).toContain('FULL');
    expect(text).toContain('2–4 passengers');
  });

  it('shows "No trips yet" when the concert has no trips', () => {
    fixture.detectChanges();
    flushPage(httpTesting, { ...mockDetails, trips: [] });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No trips yet');
  });

  it('shows a not-found state on a 404 response', () => {
    fixture.detectChanges();
    flushPage(httpTesting, 'not-found');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Concert not found');
  });

  it('zips weather in parallel and renders the concert-day forecast', () => {
    fixture.detectChanges();
    flushPage(httpTesting, mockDetails, forecast);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Metallica');
    expect(text).toContain('Weather on the concert day');
    expect(text).toContain('Clear');
    expect(text).toContain('12–24 °C');
  });

  it('keeps the concert page when weather fails', () => {
    fixture.detectChanges();
    flushPage(httpTesting, mockDetails, 'error');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Metallica');
    expect(text).not.toContain('Weather on the concert day');
  });

  it('shows an empty state when the concert date is outside the forecast', () => {
    fixture.detectChanges();
    flushPage(httpTesting, mockDetails, { available: false, reason: 'OUT_OF_RANGE' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('outside the 16-day forecast');
  });
});
