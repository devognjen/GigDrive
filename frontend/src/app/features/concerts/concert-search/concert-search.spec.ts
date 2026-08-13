import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConcertSearch } from './concert-search';

describe('ConcertSearch', () => {
  let component: ConcertSearch;
  let fixture: ComponentFixture<ConcertSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConcertSearch],
    }).compileComponents();

    fixture = TestBed.createComponent(ConcertSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
