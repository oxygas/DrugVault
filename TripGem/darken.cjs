const fs = require('fs');

const path = '/home/sigh/Documents/!Scripts/TripGem/TripGem/src/app/globals.css';
let css = fs.readFileSync(path, 'utf8');

// Theme mappings
const themeColors = {
  ':root': { bg: '020104', bg2: '040208', bg3: '08030f' },
  'synthwave': { bg: '030005', bg2: '05010a', bg3: '0a0212' },
  'midnight': { bg: '010104', bg2: '020207', bg3: '05050f' },
  'sunset': { bg: '040101', bg2: '070202', bg3: '0f0404' },
  'aurora': { bg: '000303', bg2: '010505', bg3: '030a0a' },
  'matrix': { bg: '000200', bg2: '000500', bg3: '000800' },
  'vaporwave': { bg: '020006', bg2: '04000b', bg3: '080012' },
  'royal': { bg: '020104', bg2: '040208', bg3: '080310' },
  'ocean': { bg: '000103', bg2: '010206', bg3: '02040b' },
  'cyberpunk': { bg: '030002', bg2: '060004', bg3: '0a0006' },
  'toxic': { bg: '010201', bg2: '020402', bg3: '040704' },
  'terminal': { bg: '000201', bg2: '010402', bg3: '010803' },
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

Object.keys(themeColors).forEach(themeName => {
  const blockStart = themeName === ':root' ? ':root {' : `[data-theme="${themeName}"] {`;
  const blockEnd = '}';
  
  let startIndex = css.indexOf(blockStart);
  if (startIndex === -1) {
    console.log(`Theme ${themeName} not found.`);
    return;
  }
  
  let endIndex = css.indexOf(blockEnd, startIndex);
  let block = css.substring(startIndex, endIndex);
  
  const c = themeColors[themeName];
  const rgb = hexToRgb(c.bg);
  const rgb2 = hexToRgb(c.bg2);
  const rgb3 = hexToRgb(c.bg3);
  
  block = block.replace(/--bg:\s*#[a-fA-F0-9]{6};/, `--bg: #${c.bg};`);
  block = block.replace(/--bg2:\s*#[a-fA-F0-9]{6};/, `--bg2: #${c.bg2};`);
  block = block.replace(/--bg3:\s*#[a-fA-F0-9]{6};/, `--bg3: #${c.bg3};`);
  
  block = block.replace(/--bg-rgb:\s*[^;]+;/, `--bg-rgb: ${rgb};`);
  block = block.replace(/--bg2-rgb:\s*[^;]+;/, `--bg2-rgb: ${rgb2};`);
  block = block.replace(/--bg3-rgb:\s*[^;]+;/, `--bg3-rgb: ${rgb3};`);
  
  block = block.replace(/--surface:\s*rgba\([^,]+,\s*[^,]+,\s*[^,]+,\s*([0-9.]+)\);/, `--surface: rgba(${rgb}, $1);`);
  block = block.replace(/--surface-hover:\s*rgba\([^,]+,\s*[^,]+,\s*[^,]+,\s*([0-9.]+)\);/, `--surface-hover: rgba(${rgb2}, $1);`);
  block = block.replace(/--surface-solid:\s*rgba\([^,]+,\s*[^,]+,\s*[^,]+,\s*([0-9.]+)\);/, `--surface-solid: rgba(${rgb}, $1);`);
  block = block.replace(/--surface-elevated:\s*rgba\([^,]+,\s*[^,]+,\s*[^,]+,\s*([0-9.]+)\);/, `--surface-elevated: rgba(${rgb3}, $1);`);
  block = block.replace(/--surface-rgb:\s*[^;]+;/, `--surface-rgb: ${rgb};`);

  css = css.substring(0, startIndex) + block + css.substring(endIndex);
});

// Also replace .tripgem-text-trip
css = css.replace(
  /\.tripgem-text-trip\s*\{\s*background:\s*linear-gradient\([^;]+\);\s*background-size:\s*300%\s*100%;\s*-webkit-background-clip:\s*text;\s*background-clip:\s*text;\s*-webkit-text-fill-color:\s*transparent;\s*animation:\s*tripgem-text-shift\s*6s\s*ease-in-out\s*infinite;\s*\}/,
  `.tripgem-text-trip {
  background: linear-gradient(90deg, var(--deep-crimson), var(--accent), var(--laser-cyan), var(--amber-glow), var(--neon-magenta), var(--deep-crimson));
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: tripgem-text-shift 6s ease-in-out infinite;
}`
);

fs.writeFileSync(path, css);
console.log('Done!');
