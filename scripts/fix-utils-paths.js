#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix UI components utils imports - they should be ../lib/utils
const uiFiles = [
  'components/ui/button.tsx',
  'components/ui/card.tsx',
  'components/ui/dialog.tsx',
  'components/ui/input.tsx',
  'components/ui/label.tsx',
  'components/ui/select.tsx',
  'components/ui/switch.tsx',
  'components/ui/table.tsx',
  'components/ui/alert-dialog.tsx'
];

function fixUtilsImports(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Replace ../lib/utils with ../lib/utils (fix double slash issue)
  if (content.includes('../lib/utils')) {
    content = content.replace(/\.\.\/lib\/utils/g, '../lib/utils');
    modified = true;
    console.log(`Fixed utils import in ${filePath}`);
  }

  // Replace @/lib/utils with ../lib/utils
  if (content.includes('@/lib/utils')) {
    content = content.replace(/@\/lib\/utils/g, '../lib/utils');
    modified = true;
    console.log(`Fixed @/lib/utils import in ${filePath}`);
  }

  // Replace @/components/ui/button with ./button for alert-dialog
  if (content.includes('@/components/ui/button')) {
    content = content.replace(/@\/components\/ui\/button/g, './button');
    modified = true;
    console.log(`Fixed button import in ${filePath}`);
  }

  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`Updated: ${filePath}`);
  }
}

console.log('Fixing utils paths in UI components...');
uiFiles.forEach(fixUtilsImports);
console.log('Done!');
