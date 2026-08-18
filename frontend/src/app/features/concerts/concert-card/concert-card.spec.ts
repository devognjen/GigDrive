import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { buildConcert } from '../../../testing/concert.fixture';
import { ConcertCard } from './concert-card';

describe('ConcertCard', () => {
  let fixture: ComponentFixture<ConcertCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConcertCard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ConcertCard);
  });

  it('renders artist, date, city, venue, and links to details', () => {
    fixture.componentRef.setInput('concert', buildConcert());
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Metallica');
    expect(text).toContain('M72 World Tour');
    expect(text).toContain('Paris');
    expect(text).toContain('Stade de France');
    expect(text).toContain('Metal');
    expect(text).toContain('user-submitted');
    expect(text).toContain('Sep 1, 2026');

    const link = fixture.nativeElement.querySelector('a.result') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/concerts/c1');
  });

  it('hides a title that repeats the artist', () => {
    fixture.componentRef.setInput(
      'concert',
      buildConcert({ artist: 'Gojira', title: 'Gojira', userSubmitted: false, genre: null }),
    );
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Gojira');
    expect(text).not.toContain('—');
    expect((text.match(/Gojira/g) ?? []).length).toBe(1);
  });
});
