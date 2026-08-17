import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, shareReplay, tap } from 'rxjs';

import { Features } from '../models/features.model';

const API_BASE = '/api';

/**
 * Loads public feature flags once so UI entry points can hide disabled
 * features (FR-COMM-02). Fail-closed: a load error treats chat as off.
 */
@Injectable({ providedIn: 'root' })
export class FeaturesService {
  private readonly http = inject(HttpClient);

  private readonly featuresState = signal<Features | null>(null);
  private load$: Observable<Features> | null = null;

  readonly features = this.featuresState.asReadonly();
  readonly chatEnabled = computed(() => this.featuresState()?.chat === true);

  constructor() {
    this.load().subscribe();
  }

  load(): Observable<Features> {
    this.load$ ??= this.http.get<Features>(`${API_BASE}/features`).pipe(
      tap((features) => this.featuresState.set(features)),
      catchError(() => {
        const disabled: Features = { chat: false };
        this.featuresState.set(disabled);
        return of(disabled);
      }),
      shareReplay(1),
    );
    return this.load$;
  }
}
