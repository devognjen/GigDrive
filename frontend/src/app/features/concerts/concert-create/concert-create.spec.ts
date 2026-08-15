import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Concert } from '../../../core/models/concert.model';
import { ConcertCreate } from './concert-create';

const mockConcert: Concert = {
  id: 'c-new',
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
};

describe('ConcertCreate', () => {
  let component: ConcertCreate;
  let fixture: ComponentFixture<ConcertCreate>;
  let httpTesting: HttpTestingController;
  let navigateSpy: ReturnType<typeof vi.spyOn>;

  const submitForm = () => {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
  };

  const fillValidForm = () => {
    component['form'].setValue({
      artist: 'Metallica',
      title: 'M72 World Tour',
      venue: 'Stade de France',
      city: 'Paris',
      country: 'France',
      startAt: '2026-09-01T20:00',
      genre: 'Metal',
      imageUrl: '',
      ticketUrl: '',
      lat: null,
      lng: null,
    });
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ConcertCreate],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ConcertCreate);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('blocks the submit while required fields are missing', () => {
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[type=submit]') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    submitForm();
    httpTesting.expectNone('/api/concerts');
  });

  it('rejects invalid URLs', () => {
    fillValidForm();
    component['form'].controls.ticketUrl.setValue('not-a-url');
    fixture.detectChanges();

    submitForm();
    httpTesting.expectNone('/api/concerts');

    component['form'].controls.ticketUrl.setValue('https://tickets.example.com/m72');
    fixture.detectChanges();
    submitForm();
    httpTesting.expectOne('/api/concerts').flush(mockConcert);
  });

  it('posts a valid form and navigates to the new concert details', () => {
    fillValidForm();
    fixture.detectChanges();
    submitForm();

    const req = httpTesting.expectOne('/api/concerts');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      artist: 'Metallica',
      title: 'M72 World Tour',
      venue: 'Stade de France',
      city: 'Paris',
      country: 'France',
      startAt: new Date('2026-09-01T20:00').toISOString(),
      genre: 'Metal',
    });
    req.flush(mockConcert);

    expect(navigateSpy).toHaveBeenCalledWith(['/concerts', 'c-new']);
  });

  it('includes optional lat/lng when given', () => {
    fillValidForm();
    component['form'].controls.lat.setValue(48.92);
    component['form'].controls.lng.setValue(2.36);
    fixture.detectChanges();
    submitForm();

    const req = httpTesting.expectOne('/api/concerts');
    expect(req.request.body.lat).toBe(48.92);
    expect(req.request.body.lng).toBe(2.36);
    req.flush(mockConcert);
  });

  it('shows an error message when the request fails', () => {
    fillValidForm();
    fixture.detectChanges();
    submitForm();

    httpTesting
      .expectOne('/api/concerts')
      .flush({ message: 'Bad Request' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role=alert]') as HTMLElement;
    expect(alert.textContent).toContain('Could not save the concert');
  });
});
