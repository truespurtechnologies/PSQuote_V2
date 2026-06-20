#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Final comprehensive fix
const fixes = [
  // Fix all UI components utils paths
  {
    files: [
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
    ],
    replacements: [
      { from: "../lib/utils", to: "../lib/utils" }, // Fix double slash
      { from: "@/lib/utils", to: "../lib/utils" },
      { from: "@/components/ui/", to: "./" }
    ]
  },
  // Fix new-quotation page
  {
    file: 'app/new-quotation/page.tsx',
    replacements: [
      { from: "../components/ui/", to: "../../components/ui/" },
      { from: "@/components/quotation-preview", to: "../../components/quotation-preview" },
      { from: "@/components/loading-slip-preview", to: "../../components/loading-slip-preview" },
      { from: "@/components/pos-quotation-preview", to: "../../components/pos-quotation-preview" },
      { from: "@/components/pos-loading-slip-preview", to: "../../components/pos-loading-slip-preview" },
      { from: "@/components/quotation-items-table", to: "../../components/quotation-items-table" },
      { from: "../lib/database.types", to: "../../lib/database.types" }
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
console.log('Running final comprehensive fix...');
fixes.forEach(({ file, files, replacements }) => {
  if (file) {
    fixImportsInFile(file, replacements);
  } else if (files) {
    files.forEach(f => fixImportsInFile(f, replacements));
  }
});
console.log('Done!');
