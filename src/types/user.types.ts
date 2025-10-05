import { UserRole } from '../entities/User';

export { UserRole } from '../entities/User';

export interface IUser {
  id: string;
  fullName: string;
  dateOfBirth: Date;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  fullName: string;
  dateOfBirth: string;
  email: string;
  password: string;
}

export interface UpdateUserDto {
  fullName?: string;
  dateOfBirth?: string;
  isActive?: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}