#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix critical build errors
const fixes = [
  {
    file: 'app/debug-supabase/page.tsx',
    replacements: [
      { from: "../lib/supabase/client", to: "../../lib/supabase/client" }
    ]
  },
  {
    file: 'app/existing-quotations/page.tsx',
    replacements: [
      { from: "../components/auth/", to: "../../components/auth/" },
      { from: "../lib/quotation-db", to: "../../lib/quotation-db" },
      { from: "../lib/supabase/client", to: "../../lib/supabase/client" },
      { from: "../components/ui/", to: "../../components/ui/" }
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
console.log('Fixing critical build errors...');
fixes.forEach(({ file, replacements }) => {
  fixImportsInFile(file, replacements);
});
console.log('Done!');
