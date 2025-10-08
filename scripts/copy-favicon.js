const fs = require('fs');
const path = require('path');

// Get brand from environment
const brandKey = process.env.NEXT_PUBLIC_BRAND_KEY || 'fram3';

// Paths
const sourcePath = path.join(process.cwd(), 'public', 'logos', brandKey, 'favicon.ico');
const destPath = path.join(process.cwd(), 'src', 'app', 'favicon.ico');

try {
  // Check if source exists
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Favicon not found at: ${sourcePath}`);
    process.exit(1);
  }

  // Copy favicon
  fs.copyFileSync(sourcePath, destPath);
  console.log(`✅ Copied ${brandKey} favicon to src/app/favicon.ico`);
} catch (error) {
  console.error('❌ Error copying favicon:', error);
  process.exit(1);
}