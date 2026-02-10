import { existsSync } from 'fs';
import { join } from 'path';

const requiredFiles = [
  // API Routes
  'src/app/api/admin/auth/login/route.ts',
  'src/app/api/admin/auth/logout/route.ts',
  'src/app/api/admin/auth/me/route.ts',
  
  // Pages
  'src/app/admin/layout.tsx',
  'src/app/admin/login/page.tsx',
  'src/app/admin/dashboard/page.tsx',
  
  // Libraries
  'src/lib/auth.ts',
  'src/lib/middleware.ts',
  'src/lib/utils.ts',
  
  // Database
  'src/db/schema.ts',
  'src/db/db.ts',
  
  // Config
  'drizzle.config.ts',
  'tsconfig.json',
];

console.log('🔍 Checking required files...\n');

let missingCount = 0;
const missing: string[] = [];

requiredFiles.forEach(file => {
  const exists = existsSync(file);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file}`);
  
  if (!exists) {
    missingCount++;
    missing.push(file);
  }
});

console.log('\n' + '='.repeat(50));
if (missingCount === 0) {
  console.log('✅ All required files exist!');
} else {
  console.log(`❌ Missing ${missingCount} file(s):`);
  missing.forEach(file => console.log(`   - ${file}`));
  console.log('\nℹ️  You need to copy these files to your project.');
}