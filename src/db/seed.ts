import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from './schema';
import { hashPassword } from '../lib/auth';

async function seed() {
  console.log('🌱 Seeding database...');

  // Explicit connection for testing
  const pool = new Pool({
    connectionString: 'postgresql://postgres:kinan@localhost:5432/ecommerce',
  });

  const db = drizzle(pool);

  try {
    // Create admin user
    const password = await hashPassword('admin123');
    
    await db.insert(users).values({
      email: 'admin@example.com',
      passwordHash: password,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      emailVerified: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seed();