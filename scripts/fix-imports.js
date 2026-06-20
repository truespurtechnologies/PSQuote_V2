#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common import path mappings
const importMappings = {
  '@/components/ui/': '../components/ui/',
  '@/components/auth/': '../components/auth/',
  '@/components/settings/': '../components/settings/',
  '@/components/providers/': '../components/providers/',
  '@/lib/': '../lib/',
  '@/hooks/': '../hooks/',
  '@/types/': '../types/',
  '@/app/': '../app/',
};

// Files to process
const filesToProcess = [
  'app/existing-quotations/page.tsx',
  'app/new-quotation/page.tsx',
  'app/landing/page.tsx',
  'app/login/LoginContent.tsx',
  'app/quick-load-slip/page.tsx',
  'app/update-password/page.tsx',
  'app/reset-password/ResetPasswordForm.tsx',
  'app/forgot-password/page.tsx',
  'app/settings/page.tsx',
  'app/settings/SettingsContent.tsx',
  'app/signup/page.tsx',
  'app/debug-supabase/page.tsx',
  'app/reset-password/page.tsx',
  'components/settings/product-catalog.tsx',
  'components/settings/ProductRow.tsx',
  'components/settings/user-management.tsx',
  'components/settings/user-modal.tsx',
  'components/auth/enhanced-auth-context.tsx',
  'components/ErrorBoundary.tsx',
  'components/providers/supabase-provider.tsx',
];

function fixImportsInFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Apply import mappings
  for (const [from, to] of Object.entries(importMappings)) {
    const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (content.includes(from)) {
      content = content.replace(regex, to);
      modified = true;
      console.log(`Fixed imports in ${filePath}: ${from} -> ${to}`);
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`Updated: ${filePath}`);
  }
}

// Process all files
console.log('Fixing import paths...');
filesToProcess.forEach(fixImportsInFile);
console.log('Done!');
