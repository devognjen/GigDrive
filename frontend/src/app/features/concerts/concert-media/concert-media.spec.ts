import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConcertMedia } from './concert-media';

describe('ConcertMedia', () => {
  let fixture: ComponentFixture<ConcertMedia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConcertMedia],
    }).compileComponents();

    fixture = TestBed.createComponent(ConcertMedia);
    fixture.componentRef.setInput('artist', 'Gojira');
  });

  it('renders the image when a url is provided', () => {
    fixture.componentRef.setInput('imageUrl', 'https://img.example/gojira.jpg');
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(image.getAttribute('src')).toBe('https://img.example/gojira.jpg');
    expect(image.getAttribute('alt')).toBe('Gojira');
  });

  it('renders a placeholder initial when there is no image', () => {
    fixture.componentRef.setInput('imageUrl', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('G');
  });
});
