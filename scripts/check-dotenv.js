const fs = require('fs');
const path = require('path');

console.log('Reading .env.local file...');
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  const content = fs.readFileSync(envPath, 'utf8');
  console.log('File content:');
  console.log('---');
  console.log(content);
  console.log('---');
} catch (error) {
  console.error('Error reading .env.local file:', error.message);
}
