#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix specific remaining import issues
const fixes = [
  // UI components need to go up two levels from settings folder
  {
    files: ['components/settings/ProductRow.tsx', 'components/settings/user-management.tsx', 'components/settings/user-modal.tsx'],
    replacements: [
      { from: "../components/ui/", to: "../../components/ui/" },
      { from: "../lib/types/", to: "../../lib/types/" }
    ]
  },
  // UI components themselves
  {
    files: ['components/ui/button.tsx'],
    replacements: [
      { from: "@/lib/utils", to: "../lib/utils" }
    ]
  },
  // App files that need different paths
  {
    files: ['app/landing/page.tsx'],
    replacements: [
      { from: "../components/ui/", to: "../../components/ui/" },
      { from: "../lib/", to: "../../lib/" },
      { from: "../hooks/", to: "../../hooks/" }
    ]
  },
  // Auth components
  {
    files: ['components/auth/enhanced-auth-context.tsx'],
    replacements: [
      { from: "../components/ui/", to: "../ui/" },
      { from: "../lib/", to: "../../lib/" }
    ]
  },
  // Providers
  {
    files: ['components/providers/supabase-provider.tsx'],
    replacements: [
      { from: "../lib/", to: "../../lib/" },
      { from: "../types/", to: "../../types/" }
    ]
  }
];

function fixImportsInFile(filePath, replacements) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Apply replacements
  for (const { from, to } of replacements) {
    const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (content.includes(from)) {
      content = content.replace(regex, to);
      modified = true;
      console.log(`Fixed in ${filePath}: ${from} -> ${to}`);
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`Updated: ${filePath}`);
  }
}

// Process all fixes
console.log('Fixing remaining import paths...');
fixes.forEach(({ files, replacements }) => {
  files.forEach(file => fixImportsInFile(file, replacements));
});
console.log('Done!');
