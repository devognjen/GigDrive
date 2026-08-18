import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { provideRouter } from '@angular/router';

import { Concert } from '../../../core/models/concert.model';
import { buildConcert } from '../../../testing/concert.fixture';
import { ConcertPicker } from './concert-picker';

@Component({
  selector: 'app-concert-picker-host',
  imports: [ConcertPicker],
  template: `
    <app-concert-picker [concertIdControl]="control" (concertChange)="lastConcert = $event" />
  `,
})
class ConcertPickerHost {
  readonly control = new FormControl('', { nonNullable: true });
  lastConcert: Concert | null | undefined;
}

describe('ConcertPicker', () => {
  let fixture: ComponentFixture<ConcertPickerHost>;
  let host: ConcertPickerHost;
  let httpTesting: HttpTestingController;
  const concert = buildConcert();

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [ConcertPickerHost],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ConcertPickerHost);
    host = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.useRealTimers();
    httpTesting.verify();
  });

  function flushUpcoming(concerts: Concert[] = [concert]): void {
    vi.advanceTimersByTime(300);
    const req = httpTesting.expectOne('/api/concerts/upcoming');
    expect(req.request.method).toBe('GET');
    req.flush(concerts);
    fixture.detectChanges();
  }

  it('lists upcoming concerts when the query is empty', () => {
    fixture.detectChanges();
    flushUpcoming();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Metallica');
    expect(text).toContain('Stade de France, Paris');
  });

  it('searches upcoming concerts as the user types', () => {
    fixture.detectChanges();
    flushUpcoming([]);

    const input = fixture.nativeElement.querySelector('#concert-query') as HTMLInputElement;
    input.value = 'metal';
    input.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(300);

    const req = httpTesting.expectOne((r) => r.url === '/api/concerts/search');
    expect(req.request.params.get('q')).toBe('metal');
    expect(req.request.params.has('dateFrom')).toBe(true);
    req.flush([concert]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Metallica');
  });

  it('writes the concert id on select and emits the concert', () => {
    fixture.detectChanges();
    flushUpcoming();

    const option = fixture.nativeElement.querySelector('.result') as HTMLElement;
    option.dispatchEvent(new Event('mousedown'));
    fixture.detectChanges();

    expect(host.control.value).toBe('c1');
    expect(host.lastConcert).toEqual(concert);
    expect(fixture.nativeElement.textContent).toContain('Change');
    expect(fixture.nativeElement.querySelector('#concert-query')).toBeNull();
  });

  it('loads a preselected concert by id', () => {
    host.control.setValue('c1');
    fixture.detectChanges();

    const req = httpTesting.expectOne('/api/concerts/c1');
    expect(req.request.method).toBe('GET');
    req.flush({ concert, trips: [] });
    fixture.detectChanges();

    expect(host.lastConcert).toEqual(concert);
    expect(fixture.nativeElement.textContent).toContain('M72 World Tour');
    expect(fixture.nativeElement.querySelector('#concert-query')).toBeNull();
  });

  it('falls back to search when the preselected concert is missing', () => {
    host.control.setValue('missing');
    fixture.detectChanges();

    httpTesting
      .expectOne('/api/concerts/missing')
      .flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    flushUpcoming([]);

    expect(host.control.value).toBe('');
    expect(host.lastConcert).toBeNull();
    expect(fixture.nativeElement.querySelector('#concert-query')).toBeTruthy();
  });
});
