import * as dotenv from 'dotenv';

// Load .env file
dotenv.config();

console.log('🔍 Checking environment variables...\n');

console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length);
console.log('DATABASE_URL (masked):', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
console.log('DATABASE_URL type:', typeof process.env.DATABASE_URL);

// Parse the connection string manually
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('\n📊 Parsed connection:');
    console.log('Protocol:', url.protocol);
    console.log('Username:', url.username);
    console.log('Password length:', url.password.length);
    console.log('Password type:', typeof url.password);
    console.log('Host:', url.hostname);
    console.log('Port:', url.port);
    console.log('Database:', url.pathname.slice(1));
  } catch (error) {
    console.error('❌ Failed to parse DATABASE_URL:', error);
  }
}
