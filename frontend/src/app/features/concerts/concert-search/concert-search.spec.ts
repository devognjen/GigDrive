import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Concert } from '../../../core/models/concert.model';
import { todayIsoDate } from '../../../core/utils/local-datetime';
import { ConcertSearch } from './concert-search';

const mockConcerts: Concert[] = [
  {
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
    imageUrl: null,
    genre: 'Metal',
    ticketUrl: null,
  },
  {
    id: 'c2',
    externalId: 'tm-1',
    userSubmitted: false,
    artist: 'Billie Eilish',
    title: 'Hit Me Hard and Soft',
    venue: 'Accor Arena',
    city: 'Paris',
    country: 'France',
    lat: null,
    lng: null,
    startAt: '2026-10-05T20:00:00.000Z',
    imageUrl: null,
    genre: null,
    ticketUrl: null,
  },
];

const mockFilterOptions = {
  cities: ['Paris', 'Vienna'],
  genres: ['Metal', 'Rock'],
};

describe('ConcertSearch', () => {
  let component: ConcertSearch;
  let fixture: ComponentFixture<ConcertSearch>;
  let httpTesting: HttpTestingController;

  // The app is zoneless, so fakeAsync is unavailable; vitest fake timers drive
  // the debounceTime(300) of the instant search instead. They must be installed
  // before the component is created, because the constructor already subscribes.
  beforeEach(async () => {
    localStorage.clear();
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [ConcertSearch],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ConcertSearch);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpTesting.expectOne('/api/concerts/filter-options').flush(mockFilterOptions);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    httpTesting.verify();
    localStorage.clear();
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    vi.advanceTimersByTime(300);
    httpTesting.expectOne((r) => r.url === '/api/concerts/search').flush([]);
  });

  it('triggers an initial search from today', () => {
    vi.advanceTimersByTime(300);

    const req = httpTesting.expectOne((r) => r.url === '/api/concerts/search');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('dateFrom')).toBe(todayIsoDate());
    req.flush(mockConcerts);
  });

  it('debounces typing into a single request after 300ms', () => {
    vi.advanceTimersByTime(300);
    httpTesting.expectOne((r) => r.url === '/api/concerts/search').flush([]);

    const q = component['filters'].controls.q;
    q.setValue('m');
    vi.advanceTimersByTime(100);
    q.setValue('me');
    vi.advanceTimersByTime(100);
    q.setValue('metallica');
    vi.advanceTimersByTime(100);
    httpTesting.expectNone((r) => r.params.get('q') === 'metallica');

    vi.advanceTimersByTime(200);
    const requests = httpTesting.match((r) => r.url === '/api/concerts/search');
    expect(requests.length).toBe(1);
    expect(requests[0].request.params.get('q')).toBe('metallica');
    requests[0].flush([]);
  });

  it('cancels a stale request when the filters change before it answered', () => {
    vi.advanceTimersByTime(300);
    httpTesting.expectOne((r) => r.url === '/api/concerts/search').flush([]);

    const q = component['filters'].controls.q;
    q.setValue('metallica');
    vi.advanceTimersByTime(300);
    const first = httpTesting.expectOne((r) => r.params.get('q') === 'metallica');

    q.setValue('billie');
    vi.advanceTimersByTime(300);
    const second = httpTesting.expectOne((r) => r.params.get('q') === 'billie');

    expect(first.cancelled).toBe(true);
    second.flush(mockConcerts);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Metallica');
  });

  it('does not search again when the serialized params are unchanged', () => {
    vi.advanceTimersByTime(300);
    httpTesting.expectOne((r) => r.url === '/api/concerts/search').flush([]);

    // Whitespace-only change: the trimmed params stay the same.
    component['filters'].controls.q.setValue('   ');
    vi.advanceTimersByTime(300);
    httpTesting.expectNone((r) => r.url === '/api/concerts/search');
  });

  it('renders the results with badges and detail links', () => {
    vi.advanceTimersByTime(300);
    httpTesting.expectOne((r) => r.url === '/api/concerts/search').flush(mockConcerts);
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.results .result') as NodeListOf<Element>;
    expect(items.length).toBe(2);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Metallica');
    expect(text).toContain('Paris · Stade de France');
    expect(text).toContain('Metal');

    const first = items[0];
    expect(first.getAttribute('href')).toBe('/concerts/c1');
    expect(first.querySelector('.badge.user-submitted')).toBeTruthy();
    expect(items[1].querySelector('.badge.user-submitted')).toBeNull();
    expect(items[1].querySelector('.badge.genre')).toBeNull();
  });

  it('shows the empty state when nothing matches', () => {
    vi.advanceTimersByTime(300);
    httpTesting.expectOne((r) => r.url === '/api/concerts/search').flush([]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No concerts found');
  });

  it('shows an error state when the search request fails', () => {
    vi.advanceTimersByTime(300);
    httpTesting
      .expectOne((r) => r.url === '/api/concerts/search')
      .flush('error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain("Couldn't search concerts");
    expect(text).not.toContain('No concerts found');
  });

  it('hides the "add manually" link for guests', () => {
    vi.advanceTimersByTime(300);
    httpTesting.expectOne((r) => r.url === '/api/concerts/search').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a[href="/concerts/new"]')).toBeNull();
  });

  it('populates city and genre selects from the filter options', () => {
    vi.advanceTimersByTime(300);
    httpTesting.expectOne((r) => r.url === '/api/concerts/search').flush([]);
    fixture.detectChanges();

    const cityOptions = [
      ...(fixture.nativeElement.querySelectorAll('#city option') as NodeListOf<HTMLOptionElement>),
    ].map((option) => option.value);
    const genreOptions = [
      ...(fixture.nativeElement.querySelectorAll('#genre option') as NodeListOf<HTMLOptionElement>),
    ].map((option) => option.value);

    expect(cityOptions).toEqual(['', 'Paris', 'Vienna']);
    expect(genreOptions).toEqual(['', 'Metal', 'Rock']);
  });

  it('searches with the selected city and genre', () => {
    vi.advanceTimersByTime(300);
    httpTesting.expectOne((r) => r.url === '/api/concerts/search').flush([]);

    component['filters'].controls.city.setValue('Paris');
    component['filters'].controls.genre.setValue('Metal');
    vi.advanceTimersByTime(300);

    const req = httpTesting.expectOne((r) => r.url === '/api/concerts/search');
    expect(req.request.params.get('city')).toBe('Paris');
    expect(req.request.params.get('genre')).toBe('Metal');
    req.flush([]);
  });

  it('omits city and genre when Any is selected', () => {
    vi.advanceTimersByTime(300);
    httpTesting.expectOne((r) => r.url === '/api/concerts/search').flush([]);

    component['filters'].controls.city.setValue('Paris');
    vi.advanceTimersByTime(300);
    httpTesting.expectOne((r) => r.params.get('city') === 'Paris').flush([]);

    component['filters'].controls.city.setValue('');
    vi.advanceTimersByTime(300);
    const req = httpTesting.expectOne((r) => r.url === '/api/concerts/search');
    expect(req.request.params.has('city')).toBe(false);
    req.flush([]);
  });
});
