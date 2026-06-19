const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const projectRoot = __dirname;
const idDir = path.join(projectRoot, 'app', 'existing-quotations', '[id]');
const quotationNumberDir = path.join(projectRoot, 'app', 'existing-quotations', '[quotationNumber]');

// 1. First, check if [id] directory exists
if (fs.existsSync(idDir)) {
  console.log(`Found directory: ${idDir}`);
  
  // 2. Check if [quotationNumber] directory exists
  if (!fs.existsSync(quotationNumberDir)) {
    console.log(`Creating directory: ${quotationNumberDir}`);
    fs.mkdirSync(quotationNumberDir, { recursive: true });
  }
  
  // 3. Copy files from [id] to [quotationNumber] if they don't exist
  const files = fs.readdirSync(idDir);
  files.forEach(file => {
    const sourcePath = path.join(idDir, file);
    const destPath = path.join(quotationNumberDir, file);
    
    if (!fs.existsSync(destPath)) {
      console.log(`Copying ${file} to [quotationNumber] directory`);
      fs.copyFileSync(sourcePath, destPath);
    } else {
      console.log(`Skipping ${file} - already exists in [quotationNumber] directory`);
    }
  });
  
  // 4. Update references in the files
  console.log('Updating file references...');
  updateFileReferences(quotationNumberDir);
  
  // 5. Remove the [id] directory
  console.log(`Removing directory: ${idDir}`);
  fs.rmSync(idDir, { recursive: true, force: true });
  
  console.log('Done! Please restart your development server.');
} else {
  console.log(`Directory not found: ${idDir}`);
  console.log('No changes were made.');
}

function updateFileReferences(directory) {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile() && file.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Replace { params: { id: ... } with { params: { quotationNumber: ... }
      content = content.replace(/\{ params: \{ id: ([^}]+)\}/g, 
        '{ params: { quotationNumber: $1 }');
      
      // Replace params.id with params.quotationNumber
      content = content.replace(/params\.id/g, 'params.quotationNumber');
      
      // Write the updated content back to the file
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated references in: ${filePath}`);
    }
  });
}
