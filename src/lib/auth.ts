import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Validate JWT_SECRET exists and is strong enough
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is required. ' +
    'Generate a secure secret with: openssl rand -base64 32'
  );
}

// Warn if JWT_SECRET is weak (less than 32 characters)
if (JWT_SECRET.length < 32) {
  console.warn(
    '⚠️  WARNING: JWT_SECRET is weak (less than 32 characters). ' +
    'Generate a stronger secret with: openssl rand -base64 32'
  );
}

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
