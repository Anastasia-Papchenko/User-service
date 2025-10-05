import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const validateCreateUser = (req: Request, res: Response, next: NextFunction) => {
  const { fullName, dateOfBirth, email, password } = req.body;

  if (!fullName || !dateOfBirth || !email || !password) {
    return next(new AppError('All fields are required', 400));
  }

  if (password.length < 6) {
    return next(new AppError('Password must be at least 6 characters long', 400));
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return next(new AppError('Please provide a valid email', 400));
  }

  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) {
    return next(new AppError('Invalid date of birth', 400));
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required', 400));
  }

  next();
};