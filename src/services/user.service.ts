import { Repository } from 'typeorm';
import { User } from '../entities/User';
import { 
  CreateUserDto, 
  LoginDto,
  AuthResponse,
  UserResponse,
  UserRole 
} from '../types/user.types';
import { AppError } from '../utils/AppError';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/ormconfig';
import fs from 'fs';
import path from 'path';

export class UserService {
  private static userRepository: Repository<User> = AppDataSource.getRepository(User);
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly JWT_EXPIRES = '7d';

  static generateToken(user: User): string {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES }
    );
  }

  static verifyToken(token: string): any {
    return jwt.verify(token, this.JWT_SECRET);
  }

  static async createUser(userData: CreateUserDto): Promise<UserResponse> {
    const existingUser = await this.userRepository.findOne({
        where: { email: userData.email }
    });

    if (existingUser) {
        throw new AppError('User with this email already exists', 400);
    }

    const dateOfBirth = new Date(userData.dateOfBirth);
    if (isNaN(dateOfBirth.getTime())) {
        throw new AppError('Invalid date of birth', 400);
    }

    const user = new User();
    user.fullName = userData.fullName;
    user.dateOfBirth = dateOfBirth; 
    user.email = userData.email;
    user.role = UserRole.USER;
    user.isActive = true;

    await user.setPassword(userData.password);

    const savedUser = await this.userRepository.save(user);
    return this.formatUserResponse(savedUser);
    }

  static async login(loginData: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({
      where: { email: loginData.email }
    });
    
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is blocked', 403);
    }

    const isPasswordValid = await user.validatePassword(loginData.password);
    
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = this.generateToken(user);

    return {
      user: this.formatUserResponse(user),
      token,
    };
  }

  static async getUserById(id: string): Promise<UserResponse | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user ? this.formatUserResponse(user) : null;
  }

  static async getAllUsers(): Promise<UserResponse[]> {
    const users = await this.userRepository.find();
    return users.map(this.formatUserResponse);
  }

  static async updateUserStatus(id: string, isActive: boolean): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { id }
    });
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.isActive = isActive;
    const updatedUser = await this.userRepository.save(user);
    
    return this.formatUserResponse(updatedUser);
  }

  static async updateUser(id: string, updateData: Partial<CreateUserDto & { isActive?: boolean; role?: UserRole }>): Promise<UserResponse | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return null;

    if (updateData.fullName) user.fullName = updateData.fullName;
    if (updateData.email) user.email = updateData.email;
    if (updateData.dateOfBirth) {
      const dob = new Date(updateData.dateOfBirth);
      if (isNaN(dob.getTime())) throw new AppError('Invalid date of birth', 400);
      user.dateOfBirth = dob;
    }
    if (typeof updateData.isActive === 'boolean') user.isActive = updateData.isActive;
    if (updateData.role) user.role = updateData.role;

    const saved = await this.userRepository.save(user);
    return this.formatUserResponse(saved);
  }

  private static formatUserResponse(user: User): UserResponse {
    const dateOfBirth = typeof user.dateOfBirth === 'string' 
        ? new Date(user.dateOfBirth) 
        : user.dateOfBirth;

    const createdAt = typeof user.createdAt === 'string'
        ? new Date(user.createdAt)
        : user.createdAt;

    const updatedAt = typeof user.updatedAt === 'string'
        ? new Date(user.updatedAt)
        : user.updatedAt;

    return {
        id: user.id,
        fullName: user.fullName,
        dateOfBirth: dateOfBirth.toISOString().split('T')[0], 
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        };
    }

  static async createFirstAdmin(): Promise<void> {
    const adminExists = await this.userRepository.findOne({
      where: { email: 'admin@example.com' }
    });

    if (!adminExists) {
      const admin = new User();
      admin.fullName = 'System Administrator';
      admin.dateOfBirth = new Date('1990-01-01');
      admin.email = 'admin@example.com';
      admin.role = UserRole.ADMIN;
      admin.isActive = true;
      
      await admin.setPassword('admin123');
      await this.userRepository.save(admin);
      
      console.log('👑 First admin user created: admin@example.com / admin123');
    }
  }
  static async ensureAdminAndWriteTokenFile(): Promise<void> {
    const email = 'admin@example.com';

    let admin = await this.userRepository.findOne({ where: { email } });

    if (!admin) {
      admin = new User();
      admin.fullName = 'System Administrator';
      admin.dateOfBirth = new Date('1990-01-01');
      admin.email = email;
      admin.role = UserRole.ADMIN;
      admin.isActive = true;
      await admin.setPassword('admin123');
      await this.userRepository.save(admin);
      console.log('👑 First admin user created: admin@example.com / admin123');
    }

    const token = this.generateToken(admin);

    const filePath = path.resolve('.admin.jwt');     
    fs.writeFileSync(filePath, token + '\n', 'utf8'); 
    console.log(`🔑 ADMIN_JWT written to ${filePath}`);
  }
  
}