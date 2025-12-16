import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  bio?: string;
  status: boolean;
  type: 'client' | 'partner' | 'admin' | 'user' | 'editor';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  type?: 'client' | 'partner' | 'admin' | 'user' | 'editor';
  phone?: string;
  company?: string;
  bio?: string;
}

export interface UpdateUserDto {
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  bio?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:3000'}/users`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los partners (solo admin)
   */
  getPartners(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/partners`);
  }

  /**
   * Obtener todos los clientes (solo admin)
   */
  getClients(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/clients`);
  }

  /**
   * Obtener los clientes del partner actual (solo partner)
   */
  getMyClients(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/my-clients`);
  }

  /**
   * Obtener un usuario por ID
   */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear un nuevo usuario (solo admin)
   */
  createUser(userData: CreateUserDto): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}`, userData);
  }

  /**
   * Actualizar un usuario
   */
  updateUser(id: number, userData: UpdateUserDto): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, userData);
  }

  /**
   * Activar/Desactivar un usuario (solo admin)
   */
  toggleUserStatus(id: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/status`, {});
  }
}
