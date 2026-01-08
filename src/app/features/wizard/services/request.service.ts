import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class RequestService {

    private apiUrl = `${environment.apiUrl || 'http://localhost:3000'}/wizard/requests`;
    private tokenKey = 'auth_token';

    constructor(
        private http: HttpClient,
        private router: Router
    ) {
    }

    /**
     * Crear una nueva solicitud
     */
    createRequest(data: any): Promise<Request> {
        return firstValueFrom(
            this.http.post<Request>(this.apiUrl, data)
        );
    }


}










