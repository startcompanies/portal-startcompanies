import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface LiliApplicationPayload {
  email: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
}

export interface LiliApplicationResponse {
  token: string;
  location: string;
}

@Injectable({ providedIn: 'root' })
export class LiliService {
  private readonly apiUrl = environment.liliCreateApplicationUrl;

  constructor(private http: HttpClient) {}

  createApplication(data: LiliApplicationPayload): Promise<LiliApplicationResponse> {
    return firstValueFrom(
      this.http.post<LiliApplicationResponse>(this.apiUrl, data),
    );
  }
}
