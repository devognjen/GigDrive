import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PublicProfile } from '../../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  getPublicProfile(id: string): Observable<PublicProfile> {
    return this.http.get<PublicProfile>(`/api/users/${id}`);
  }
}
