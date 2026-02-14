#!/usr/bin/env node

/**
 * Password Hash Generator
 *
 * Generate a bcrypt hash for a password to manually insert into the database.
 * Useful for creating your first admin user.
 *
 * Usage:
 *   node scripts/hash-password.js "YourPassword123!"
 *   node scripts/hash-password.js
 */

const bcrypt = require('bcrypt');

const password = process.argv[2];
const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10');

if (!password) {
  console.error('❌ Error: Password is required\n');
  console.log('Usage:');
  console.log('  node scripts/hash-password.js "YourPassword123!"\n');
  console.log('Example:');
  console.log('  node scripts/hash-password.js "MySecureP@ssw0rd"');
  process.exit(1);
}

// Validate password strength
if (password.length < 8) {
  console.warn('⚠️  Warning: Password is less than 8 characters');
}

if (!/[A-Z]/.test(password)) {
  console.warn('⚠️  Warning: Password has no uppercase letters');
}

if (!/[a-z]/.test(password)) {
  console.warn('⚠️  Warning: Password has no lowercase letters');
}

if (!/[0-9]/.test(password)) {
  console.warn('⚠️  Warning: Password has no numbers');
}

if (!/[^A-Za-z0-9]/.test(password)) {
  console.warn('⚠️  Warning: Password has no special characters');
}

console.log('\n🔐 Generating Password Hash...\n');
console.log('Password:', password);
console.log('Rounds:', rounds);
console.log('');

bcrypt.hash(password, rounds)
  .then(hash => {
    console.log('✅ Hash Generated Successfully!\n');
    console.log('=' .repeat(70));
    console.log('Copy this hash to your database:\n');
    console.log(hash);
    console.log('=' .repeat(70));
    console.log('\n💡 How to use:\n');
    console.log('1. Open Drizzle Studio: pnpm db:studio');
    console.log('2. Navigate to the "users" table');
    console.log('3. Create a new user or update existing user');
    console.log('4. Paste the hash above into the "passwordHash" field');
    console.log('5. Set role to "admin"');
    console.log('6. Set isActive to true');
    console.log('7. Save the user\n');
    console.log('⚠️  IMPORTANT: Keep this password in a secure place!\n');
  })
  .catch(error => {
    console.error('❌ Error generating hash:', error.message);
    process.exit(1);
  });
