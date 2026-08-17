import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewForm } from './review-form';

describe('ReviewForm', () => {
  let fixture: ComponentFixture<ReviewForm>;
  let component: ReviewForm;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewForm],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emits rating and comment on submit', () => {
    const emitted: { rating: number; comment: string }[] = [];
    component.submitted.subscribe((value) => emitted.push(value));

    component['form'].setValue({ rating: 5, comment: '  Great ride  ' });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    expect(emitted).toEqual([{ rating: 5, comment: 'Great ride' }]);
  });

  it('does not emit when the form is invalid', () => {
    const emitted: unknown[] = [];
    component.submitted.subscribe((value) => emitted.push(value));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(emitted).toEqual([]);
  });
});
