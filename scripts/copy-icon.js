const fs = require('fs');
const path = require('path');

// Copy source icon
const src = 'C:/Users/Prashant/.gemini/antigravity/brain/e4279149-4d47-441a-87b4-dbad50f35a73/stocksense_icon_512_1782205349234.png';
const dest = path.join(__dirname, 'source_icon.png');
fs.copyFileSync(src, dest);
console.log('Copied source icon to:', dest);
