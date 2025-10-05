import { Router } from 'express';
import {
  registerUser,
  loginUser,
  getUsers,
  getUser,
  blockUser,
  // updateUser,
  getProfile,
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateCreateUser, validateLogin } from '../middleware/validation.middleware';
import { UserRole } from '../types/user.types';

const router = Router();

router.post('/register', validateCreateUser, registerUser);
router.post('/login', validateLogin, loginUser);

router.use(authenticate);

router.get('/profile', getProfile);

router.get('/:id', getUser);
router.patch('/:id/block', blockUser);
// router.patch('/:id', updateUser);

router.get('/', authorize(UserRole.ADMIN), getUsers);

export default router;