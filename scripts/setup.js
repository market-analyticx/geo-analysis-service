const fs = require('fs');
const path = require('path');

// Create necessary directories
const dirs = ['logs', 'reports'];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

console.log('🎉 Setup complete!');