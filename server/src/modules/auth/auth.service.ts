import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../../infrastructure/database/models/User';
import { config } from '../../config/env';
import { RegisterInput, LoginInput, UserRole, VerificationStatus } from '@loadvanta/contracts';
import { AuditLog } from '../../infrastructure/database/models/AuditLog';

export class AuthService {
  async register(data: RegisterInput, ipAddress?: string): Promise<{ user: Partial<IUser>; accessToken: string }> {
    // 1. Check if user already exists
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      const err: any = new Error('An account with this email address already exists.');
      err.statusCode = 409;
      err.code = 'USER_EXISTS';
      err.isOperational = true;
      throw err;
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // 3. Create user
    // Transporters start as PENDING verification; Shippers start as VERIFIED
    const verificationStatus =
      data.role === UserRole.TRANSPORTER ? VerificationStatus.PENDING : VerificationStatus.VERIFIED;

    const user = await User.create({
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      passwordHash,
      role: data.role,
      companyName: data.companyName,
      city: data.city,
      state: 'Punjab',
      verificationStatus,
      isEmailVerified: true // in MVP dev mode auto-verify email
    });

    // 4. Audit log
    await AuditLog.create({
      actorId: user._id,
      actorRole: user.role,
      action: 'USER_REGISTERED',
      targetEntity: 'User',
      targetId: user._id.toString(),
      ipAddress
    });

    // 5. Generate token
    const accessToken = this.generateAccessToken(user);

    return {
      user: this.sanitizeUser(user),
      accessToken
    };
  }

  async login(data: LoginInput, ipAddress?: string): Promise<{ user: Partial<IUser>; accessToken: string }> {
    const user = await User.findOne({ email: data.email.toLowerCase() });
    if (!user) {
      const err: any = new Error('Invalid email or password.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      err.isOperational = true;
      throw err;
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      const err: any = new Error('Invalid email or password.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      err.isOperational = true;
      throw err;
    }

    // Audit log
    await AuditLog.create({
      actorId: user._id,
      actorRole: user.role,
      action: 'USER_LOGIN',
      targetEntity: 'User',
      targetId: user._id.toString(),
      ipAddress
    });

    const accessToken = this.generateAccessToken(user);

    return {
      user: this.sanitizeUser(user),
      accessToken
    };
  }

  async getCurrentUser(userId: string): Promise<Partial<IUser>> {
    const user = await User.findById(userId);
    if (!user) {
      const err: any = new Error('User not found.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      err.isOperational = true;
      throw err;
    }
    return this.sanitizeUser(user);
  }

  generateAccessToken(user: IUser): string {
    return jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        fullName: user.fullName
      },
      config.jwt.accessSecret,
      { expiresIn: '7d' } // 7-day token for seamless usability
    );
  }

  sanitizeUser(user: IUser): Partial<IUser> {
    const obj = user.toObject ? user.toObject() : user;
    delete (obj as any).passwordHash;
    delete (obj as any).__v;
    return obj;
  }
}

export const authService = new AuthService();
