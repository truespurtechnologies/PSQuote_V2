#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix remaining utils paths - they should be ../lib/utils
const files = [
  'components/ui/button.tsx',
  'components/ui/card.tsx',
  'components/ui/dialog.tsx',
  'components/ui/input.tsx',
  'components/ui/label.tsx',
  'components/ui/select.tsx',
  'components/ui/switch.tsx',
  'components/ui/table.tsx',
  'components/ui/alert-dialog.tsx',
  'components/ui/skeleton.tsx'
];

function fixUtilsPaths(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Replace ../lib/utils with ../lib/utils (remove double slash)
  if (content.includes('../lib/utils')) {
    content = content.replace(/\.\.\/lib\/utils/g, '../lib/utils');
    modified = true;
    console.log(`Fixed utils path in ${filePath}`);
  }

  // Replace @/lib/utils with ../lib/utils
  if (content.includes('@/lib/utils')) {
    content = content.replace(/@\/lib\/utils/g, '../lib/utils');
    modified = true;
    console.log(`Fixed @/lib/utils in ${filePath}`);
  }

  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`Updated: ${filePath}`);
  }
}

console.log('Fixing final utils paths...');
files.forEach(fixUtilsPaths);
console.log('Done!');
