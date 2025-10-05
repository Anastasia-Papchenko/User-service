import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { UserRole } from '../entities/User';

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.createUser(req.body);
  res.status(201).json({ success: true, data: user });
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const auth = await UserService.login({ email, password });
  res.status(200).json({ success: true, data: auth });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!req.user) throw new AppError('Unauthorized', 401);

  const isSelf = req.user.id === id;
  const isAdmin = req.user.role === UserRole.ADMIN;
  if (!isSelf && !isAdmin) throw new AppError('Forbidden', 403);

  const user = await UserService.getUserById(id);
  if (!user) throw new AppError('User not found', 404);

  res.status(200).json({ success: true, data: user });
});

export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const list = await UserService.getAllUsers();
  res.status(200).json({ success: true, data: list });
});

export const blockUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!req.user) throw new AppError('Unauthorized', 401);

  const isSelf = req.user.id === id;
  const isAdmin = req.user.role === UserRole.ADMIN;
  if (!isSelf && !isAdmin) throw new AppError('Forbidden', 403);

  const updated = await UserService.updateUser(id, { isActive: false });
  if (!updated) throw new AppError('User not found', 404);

  res.status(200).json({ success: true, data: updated });
});

// export const updateUser = asyncHandler(async (req: Request, res: Response) => {
//   const { id } = req.params;
//   if (!req.user) throw new AppError('Unauthorized', 401);

//   const isSelf = req.user.id === id;
//   const isAdmin = req.user.role === UserRole.ADMIN;
//   if (!isSelf && !isAdmin) throw new AppError('Forbidden', 403);

//   if (!isAdmin) {
//     delete req.body.role;
//     delete req.body.isActive;
//   }

//   const updated = await UserService.updateUser(id, req.body);
//   if (!updated) throw new AppError('User not found', 404);

//   res.status(200).json({ success: true, data: updated });
// });

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const user = await UserService.getUserById(req.user.id);
  if (!user) throw new AppError('User not found', 404);
  res.status(200).json({ success: true, data: user });
});
