import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ClientCompanyProfile {
  legalName?: string | null;
  ein?: string | null;
  address?: string | null;
  billingEmail?: string | null;
  phone?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  routingAch?: string | null;
  swift?: string | null;
  iban?: string | null;
  zelleOrPaypal?: string | null;
  logoUrl?: string | null;
}

const base = () => `${environment.apiUrl || 'http://localhost:3000'}/panel/settings`;

@Injectable({ providedIn: 'root' })
export class CompanyProfileService {
  constructor(private readonly http: HttpClient) {}

  getCompany(): Promise<ClientCompanyProfile> {
    return firstValueFrom(
      this.http.get<ClientCompanyProfile>(`${base()}/company`, { withCredentials: true }),
    );
  }

  updateCompany(body: Partial<ClientCompanyProfile>): Promise<ClientCompanyProfile> {
    return firstValueFrom(
      this.http.patch<ClientCompanyProfile>(`${base()}/company`, body, { withCredentials: true }),
    );
  }

  /** Sube el logo y devuelve el perfil actualizado. */
  uploadCompanyLogo(file: File): Promise<ClientCompanyProfile> {
    const fd = new FormData();
    fd.append('file', file);
    return firstValueFrom(
      this.http.post<ClientCompanyProfile>(`${base()}/company/logo`, fd, {
        withCredentials: true,
      }),
    );
  }

  deleteCompanyLogo(): Promise<ClientCompanyProfile> {
    return firstValueFrom(
      this.http.delete<ClientCompanyProfile>(`${base()}/company/logo`, { withCredentials: true }),
    );
  }
}
