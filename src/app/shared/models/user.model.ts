export interface User {
  id: number;
  username: string;
  password?: string; // Es opcional ya que no querrás mostrar la contraseña en el frontend
  email: string;
  status: boolean;
  type: string;
  first_name: string;
  last_name: string;
  bio: string;
  createdAt: Date;
  updatedAt: Date;
}
