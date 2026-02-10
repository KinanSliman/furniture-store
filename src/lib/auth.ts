import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT token generation and verification
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'customer' | 'admin' | 'super_admin';
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.SESSION_EXPIRY || '7d',
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Session helpers
export function generateSessionToken(): string {
  return jwt.sign(
    { random: Math.random().toString(36) },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
