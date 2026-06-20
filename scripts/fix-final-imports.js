#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix remaining imports
const fixes = [
  {
    file: 'app/quick-load-slip/page.tsx',
    replacements: [
      { from: "../lib/supabase/", to: "../../lib/supabase/" },
      { from: "../hooks/", to: "../../hooks/" },
      { from: "../components/ui/", to: "../../components/ui/" },
      { from: "@/components/loading-slip-preview", to: "../../components/loading-slip-preview" },
      { from: "@/components/pos-loading-slip-preview", to: "../../components/pos-loading-slip-preview" }
    ]
  },
  {
    file: 'app/update-password/page.tsx',
    replacements: [
      { from: "../components/ui/", to: "../../components/ui/" }
    ]
  },
  {
    file: 'components/auth/signup-form.tsx',
    replacements: [
      { from: "@/hooks/", to: "../../hooks/" }
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
console.log('Fixing final imports...');
fixes.forEach(({ file, replacements }) => {
  fixImportsInFile(file, replacements);
});
console.log('Done!');
