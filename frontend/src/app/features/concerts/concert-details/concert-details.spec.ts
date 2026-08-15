import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { ConcertDetails as ConcertDetailsData } from '../../../core/models/concert.model';
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
    lat: null,
    lng: null,
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
    httpTesting.expectOne('/api/concerts/c1').flush(mockDetails);
  });

  it('loads the concert by route param and renders its info', () => {
    fixture.detectChanges();

    const req = httpTesting.expectOne('/api/concerts/c1');
    expect(req.request.method).toBe('GET');
    req.flush(mockDetails);
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
  });

  it('renders the trips linked to the concert', () => {
    fixture.detectChanges();
    httpTesting.expectOne('/api/concerts/c1').flush(mockDetails);
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
    httpTesting
      .expectOne('/api/concerts/c1')
      .flush({ ...mockDetails, trips: [] });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No trips yet');
  });

  it('shows a not-found state on a 404 response', () => {
    fixture.detectChanges();
    httpTesting
      .expectOne('/api/concerts/c1')
      .flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Concert not found');
  });
});
