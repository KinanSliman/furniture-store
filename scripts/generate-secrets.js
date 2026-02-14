#!/usr/bin/env node

/**
 * Generate Secure Secrets for Environment Variables
 *
 * This script generates cryptographically secure random secrets
 * for use in your .env.local file.
 *
 * Usage:
 *   node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 Generating Secure Secrets for Your E-Commerce Platform\n');
console.log('=' .repeat(70));
console.log('\nCopy these values to your .env.local file:\n');

// Generate JWT Secret (64 bytes = 512 bits)
const jwtSecret = crypto.randomBytes(64).toString('base64');
console.log('# JWT Secret (for authentication tokens)');
console.log(`JWT_SECRET=${jwtSecret}\n`);

// Generate Session Secret (64 bytes)
const sessionSecret = crypto.randomBytes(64).toString('base64');
console.log('# Session Secret (for cookie encryption)');
console.log(`SESSION_SECRET=${sessionSecret}\n`);

// Generate Cron Secret (32 bytes)
const cronSecret = crypto.randomBytes(32).toString('base64');
console.log('# Cron Secret (for securing cron endpoints)');
console.log(`CRON_SECRET=${cronSecret}\n`);

// Generate CSRF Token Secret (32 bytes)
const csrfSecret = crypto.randomBytes(32).toString('base64');
console.log('# CSRF Secret (for CSRF token generation)');
console.log(`CSRF_SECRET=${csrfSecret}\n`);

console.log('=' .repeat(70));
console.log('\n⚠️  IMPORTANT SECURITY NOTES:\n');
console.log('1. Never commit these secrets to version control');
console.log('2. Use different secrets for development, staging, and production');
console.log('3. Rotate secrets regularly (at least every 90 days)');
console.log('4. Store production secrets in a secure vault (AWS Secrets Manager, etc.)');
console.log('5. Never share secrets via email, Slack, or other insecure channels\n');
console.log('✅ Secrets generated successfully!\n');
