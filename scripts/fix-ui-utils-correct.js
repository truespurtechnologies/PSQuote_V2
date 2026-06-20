#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix UI components utils paths - they should be ../../lib/utils
const uiFiles = [
  'components/ui/alert-dialog.tsx',
  'components/ui/alert.tsx',
  'components/ui/button.tsx',
  'components/ui/card.tsx',
  'components/ui/dialog.tsx',
  'components/ui/input.tsx',
  'components/ui/item-input.tsx',
  'components/ui/label.tsx',
  'components/ui/select.tsx',
  'components/ui/skeleton.tsx',
  'components/ui/switch.tsx',
  'components/ui/table.tsx'
];

function fixUtilsImports(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Replace ../lib/utils with ../../lib/utils (go up from ui to components, then to lib)
  if (content.includes('../lib/utils')) {
    content = content.replace(/\.\.\/lib\/utils/g, '../../lib/utils');
    modified = true;
    console.log(`Fixed utils import in ${filePath}`);
  }

  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`Updated: ${filePath}`);
  }
}

console.log('Fixing UI components utils paths to correct location...');
uiFiles.forEach(fixUtilsImports);
console.log('Done!');
