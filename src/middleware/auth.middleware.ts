import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AppError } from '../utils/AppError';
import { UserRole, User } from '../entities/User';
import { AppDataSource } from '../config/ormconfig';

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new AppError('Access denied. No token provided.', 401);

    const decoded = UserService.verifyToken(token);
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { id: decoded.id } });

    if (!user || !user.isActive) throw new AppError('Invalid token or user inactive', 401);

    req.user = {
      id: user.id,
      fullName: user.fullName,
      dateOfBirth: user.dateOfBirth,
      email: user.email,
      password: user.password,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    next();
  } catch (e) {
    next(e);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError('Access denied', 401);
    if (!roles.includes(req.user.role)) throw new AppError('Insufficient permissions', 403);
    next();
  };
};
