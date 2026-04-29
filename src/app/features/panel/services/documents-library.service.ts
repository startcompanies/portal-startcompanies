import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

const BASE = `${environment.apiUrl || 'http://localhost:3000'}/panel/documents-library`;

@Injectable({ providedIn: 'root' })
export class DocumentsLibraryService {
  constructor(private readonly http: HttpClient) {}

  listFolders() {
    return firstValueFrom(this.http.get<any[]>(`${BASE}/folders`, { withCredentials: true }));
  }

  listDocuments(folderId?: number) {
    return firstValueFrom(
      this.http.get<any[]>(`${BASE}/documents`, {
        withCredentials: true,
        params: folderId ? { folderId } : {},
      }),
    );
  }
}

