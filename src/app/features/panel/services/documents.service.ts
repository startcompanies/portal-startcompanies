import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface UploadResponse {
  url: string;
  key: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:3000'}/panel/documents`;

  constructor(private http: HttpClient) {}

  uploadDocument(file: File, requestId?: number, documentType?: string, description?: string): Observable<HttpEvent<UploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    // Nota: El backend actual solo acepta el archivo
    // Los campos adicionales (requestId, documentType, description) se pueden agregar cuando el backend los soporte
    if (requestId) {
      formData.append('requestId', requestId.toString());
    }
    if (documentType) {
      formData.append('documentType', documentType);
    }
    if (description) {
      formData.append('description', description);
    }

    return this.http.post<UploadResponse>(this.apiUrl, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  getDocumentsByRequest(requestId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/request/${requestId}`);
  }

  deleteDocument(documentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${documentId}`);
  }
}









