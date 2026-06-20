#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix remaining app file paths
const appFixes = [
  {
    files: [
      'app/reset-password/page.tsx',
      'app/settings/page.tsx'
    ],
    replacements: [
      { from: "../components/ui/", to: "../../components/ui/" }
    ]
  },
  {
    files: [
      'app/reset-password/ResetPasswordForm.tsx',
      'app/forgot-password/page.tsx',
      'app/update-password/page.tsx'
    ],
    replacements: [
      { from: "../hooks/", to: "../../hooks/" }
    ]
  },
  {
    files: [
      'app/update-password/page.tsx'
    ],
    replacements: [
      { from: "../lib/supabase/", to: "../../lib/supabase/" }
    ]
  },
  {
    files: [
      'app/settings/SettingsContent.tsx'
    ],
    replacements: [
      { from: "../components/ui/", to: "../../components/ui/" },
      { from: "../components/settings/", to: "../../components/settings/" }
    ]
  },
  {
    files: [
      'app/signup/page.tsx'
    ],
    replacements: [
      { from: "../components/auth/", to: "../../components/auth/" }
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
console.log('Fixing remaining app file paths...');
appFixes.forEach(({ files, replacements }) => {
  files.forEach(file => fixImportsInFile(file, replacements));
});
console.log('Done!');
