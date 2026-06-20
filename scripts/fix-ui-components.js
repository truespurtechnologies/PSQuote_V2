#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix UI components utils imports
const uiFiles = [
  'components/ui/button.tsx',
  'components/ui/card.tsx',
  'components/ui/dialog.tsx',
  'components/ui/input.tsx',
  'components/ui/label.tsx',
  'components/ui/select.tsx',
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

  // Replace @/lib/utils with ../lib/utils
  if (content.includes('@/lib/utils')) {
    content = content.replace(/@\/lib\/utils/g, '../lib/utils');
    modified = true;
    console.log(`Fixed utils import in ${filePath}`);
  }

  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`Updated: ${filePath}`);
  }
}

// Fix remaining component paths
function fixComponentPaths() {
  const fixes = [
    {
      file: 'components/settings/product-catalog.tsx',
      replacements: [
        { from: "../components/ui/", to: "../../components/ui/" },
        { from: "../lib/supabase/", to: "../../lib/supabase/" }
      ]
    },
    {
      file: 'components/settings/ProductRow.tsx',
      replacements: [
        { from: "../types/", to: "../../types/" }
      ]
    },
    {
      file: 'components/ui/button.tsx',
      replacements: [
        { from: "../lib/utils", to: "../lib/utils" } // Fix double slash issue
      ]
    }
  ];

  fixes.forEach(({ file, replacements }) => {
    const fullPath = path.join(__dirname, '..', file);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${file}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    replacements.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
        modified = true;
        console.log(`Fixed in ${file}: ${from} -> ${to}`);
      }
    });

    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`Updated: ${file}`);
    }
  });
}

console.log('Fixing UI components utils imports...');
uiFiles.forEach(fixUtilsImports);
console.log('\nFixing component paths...');
fixComponentPaths();
console.log('Done!');
