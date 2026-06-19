// This script will help clean up the project by removing unnecessary files
// and organizing the scripts directory

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to keep (move to utils directory)
const KEEP_FILES = [
  'list-tables-rest.js',       // Useful for debugging
  'test-user-signup.js',       // Useful for testing user creation
  'fix-permissions.js'         // Useful for permission management
];

// Files to delete
const DELETE_FILES = [
  'apply-migration.js',       // One-time use
  'check-profiles-table.js',  // Replaced by list-tables-rest.js
  'direct-api-test.js',       // Test script
  'direct-sql-query.js',      // Test script
  'simple-db-test.js',        // Test script
  'test-db-connection.js',    // Test script
  'test-insert-profile.js',   // Test script
  'test-supabase-client.js'   // Test script
];

// Create utils directory if it doesn't exist
const utilsDir = path.join(__dirname, 'utils');
if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir, { recursive: true });
}

console.log('🚀 Starting project cleanup...');

// Move files to utils directory
console.log('\n📁 Moving utility scripts to /scripts/utils...');
KEEP_FILES.forEach(file => {
  const source = path.join(__dirname, file);
  const dest = path.join(utilsDir, file);
  
  if (fs.existsSync(source)) {
    fs.renameSync(source, dest);
    console.log(`  → Moved: ${file}`);
  }
});

// Delete unnecessary files
console.log('\n🗑️  Removing temporary and test scripts...');
let deletedCount = 0;

DELETE_FILES.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`  → Deleted: ${file}`);
      deletedCount++;
    } catch (error) {
      console.error(`  ❌ Error deleting ${file}:`, error.message);
    }
  }
});

// Update README if it exists
const readmePath = path.join(__dirname, '..', 'README.md');
if (fs.existsSync(readmePath)) {
  try {
    let readme = fs.readFileSync(readmePath, 'utf8');
    
    // Add or update scripts section
    if (!readme.includes('## Available Scripts')) {
      readme += '\n## Available Scripts\n\n';
      readme += '- `node scripts/utils/list-tables-rest.js` - List all tables and their structure\n';
      readme += '- `node scripts/utils/test-user-signup.js` - Test user signup and profile creation\n';
      readme += '- `node scripts/utils/fix-permissions.js` - Check and fix database permissions\n';
      
      fs.writeFileSync(readmePath, readme);
      console.log('\n📝 Updated README.md with available scripts');
    }
  } catch (error) {
    console.error('  ❌ Error updating README.md:', error.message);
  }
}

console.log(`\n✅ Cleanup complete! Removed ${deletedCount} files.`);
console.log('\n📁 Project structure is now clean and organized.');
console.log('💡 Utility scripts have been moved to /scripts/utils');

// Run git status to show changes
console.log('\n🔄 Running git status...\n');
try {
  const status = execSync('git status --porcelain', { cwd: path.join(__dirname, '..') }).toString();
  if (status.trim()) {
    console.log(status);
    console.log('\n💡 You can now review the changes and commit them to version control.');
  } else {
    console.log('No changes to commit. Working directory is clean.');
  }
} catch (error) {
  console.log('  ℹ️  Git status check skipped (git not available or not a git repository)');
}
