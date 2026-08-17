import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { PublicProfile as PublicProfileModel } from '../../../core/models/user.model';
import { PublicProfile } from './public-profile';

const mockProfile: PublicProfileModel = {
  id: 'u1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  averageRating: null,
  reviewCount: 0,
};

describe('PublicProfile', () => {
  let fixture: ComponentFixture<PublicProfile>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicProfile],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'u1' }) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicProfile);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  const flushProfile = (profile: PublicProfileModel) => {
    httpTesting.expectOne('/api/users/u1').flush(profile);
    httpTesting.expectOne('/api/users/u1/reviews').flush([]);
  };

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
    flushProfile(mockProfile);
  });

  it('renders the name and the empty state when there are no reviews', () => {
    flushProfile(mockProfile);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Ada Lovelace');
    expect(compiled.querySelector('.empty-state')?.textContent).toContain('No reviews yet');
  });

  it('renders the average rating, review count, and comments when reviews exist', () => {
    httpTesting
      .expectOne('/api/users/u1')
      .flush({ ...mockProfile, averageRating: 4.5, reviewCount: 3 });
    httpTesting.expectOne('/api/users/u1/reviews').flush([
      {
        id: 'r1',
        tripId: 't1',
        authorId: 'p1',
        authorName: 'Ana Passenger',
        rating: 5,
        comment: 'On time and friendly.',
        createdAt: '2026-07-01T00:00:00.000Z',
      },
    ]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.rating')?.textContent).toContain('4.5');
    expect(compiled.querySelector('.rating')?.textContent).toContain('3 reviews');
    expect(compiled.querySelector('.empty-state')).toBeNull();
    expect(compiled.textContent).toContain('On time and friendly.');
    expect(compiled.textContent).toContain('Ana Passenger');
  });

  it('shows a friendly message for an unknown user', () => {
    httpTesting
      .expectOne('/api/users/u1')
      .flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    httpTesting.expectOne('/api/users/u1/reviews').flush([], { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-state')?.textContent).toContain(
      'This user does not exist.',
    );
  });
});
