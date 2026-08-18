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

  function queryInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('#concert-query') as HTMLInputElement;
  }

  function focusQuery(): HTMLInputElement {
    fixture.detectChanges();
    const input = queryInput();
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    return input;
  }

  function flushUpcoming(concerts: Concert[] = [concert]): void {
    vi.advanceTimersByTime(300);
    const req = httpTesting.expectOne('/api/concerts/upcoming');
    expect(req.request.method).toBe('GET');
    req.flush(concerts);
    fixture.detectChanges();
  }

  function openUpcoming(concerts: Concert[] = [concert]): HTMLInputElement {
    const input = focusQuery();
    flushUpcoming(concerts);
    return input;
  }

  it('does not fetch or list concerts until the field is focused', () => {
    fixture.detectChanges();

    httpTesting.expectNone('/api/concerts/upcoming');
    expect(queryInput()).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.results')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Metallica');
  });

  it('lists upcoming concerts in an overlay when the query is empty', () => {
    openUpcoming();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Metallica');
    expect(text).toContain('Stade de France, Paris');
    expect(fixture.nativeElement.querySelector('.results')).toBeTruthy();
    expect(queryInput()).toBeTruthy();
  });

  it('searches upcoming concerts as the user types', () => {
    const input = openUpcoming([]);

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
    openUpcoming();

    const option = fixture.nativeElement.querySelector('.result') as HTMLElement;
    option.dispatchEvent(new Event('mousedown'));
    fixture.detectChanges();

    expect(host.control.value).toBe('c1');
    expect(host.lastConcert).toEqual(concert);
    expect(fixture.nativeElement.textContent).toContain('Change');
    expect(queryInput()).toBeNull();
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
    expect(queryInput()).toBeNull();
  });

  it('falls back to the search field when the preselected concert is missing', () => {
    host.control.setValue('missing');
    fixture.detectChanges();

    httpTesting
      .expectOne('/api/concerts/missing')
      .flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(host.control.value).toBe('');
    expect(host.lastConcert).toBeNull();
    expect(queryInput()).toBeTruthy();
    httpTesting.expectNone('/api/concerts/upcoming');
  });

  it('omits a duplicate title when artist and title are the same', () => {
    const duplicate = buildConcert({ artist: 'MATT GOLD', title: 'MATT GOLD' });
    openUpcoming([duplicate]);

    const headline = fixture.nativeElement.querySelector('.headline') as HTMLElement;
    expect(headline.textContent).toContain('MATT GOLD');
    expect(headline.textContent).not.toContain('—');
  });

  it('closes the overlay on Escape', () => {
    const input = openUpcoming();

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.results')).toBeNull();
    expect(queryInput()).toBeTruthy();
  });

  it('closes the overlay on pointerdown outside the picker', () => {
    openUpcoming();

    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.results')).toBeNull();
  });

  it('selects the highlighted concert on Enter', () => {
    const input = openUpcoming();

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(host.control.value).toBe('c1');
    expect(host.lastConcert).toEqual(concert);
    expect(fixture.nativeElement.textContent).toContain('Change');
  });

  it('moves the highlight with arrow keys', () => {
    const second = buildConcert({ id: 'c2', artist: 'Opeth', title: 'Ghost Reveries' });
    const input = openUpcoming([concert, second]);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(host.control.value).toBe('c2');
    expect(host.lastConcert).toEqual(second);
  });

  it('reopens the overlay when Change is clicked', () => {
    openUpcoming();

    const option = fixture.nativeElement.querySelector('.result') as HTMLElement;
    option.dispatchEvent(new Event('mousedown'));
    fixture.detectChanges();

    const change = fixture.nativeElement.querySelector('.change') as HTMLButtonElement;
    change.click();
    fixture.detectChanges();

    expect(queryInput()).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.results')).toBeTruthy();
  });
});
