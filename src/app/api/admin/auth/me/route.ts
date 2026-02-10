import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Get token from cookie
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Connect to database (same method that works)
    const url = new URL(process.env.DATABASE_URL!);
    const pool = new Pool({
      host: url.hostname,
      port: parseInt(url.port),
      database: url.pathname.slice(1),
      user: url.username,
      password: url.password,
    });
    const db = drizzle(pool);

    // Get user from database
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId));

    await pool.end();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Return user data (excluding password)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}