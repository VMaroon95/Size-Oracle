const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function convertSvgToPng() {
  // Read SVG content
  const svgContent = fs.readFileSync('./icons/icon.svg', 'utf8');
  
  // Create different sized PNGs
  const sizes = [16, 48, 128];
  
  for (const size of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Set background to transparent
    ctx.clearRect(0, 0, size, size);
    
    // Create a simple icon programmatically since Canvas doesn't support SVG directly
    // Background circle
    ctx.fillStyle = '#202124';
    ctx.strokeStyle = '#8ab4f8';
    ctx.lineWidth = size * 0.03;
    ctx.beginPath();
    ctx.arc(size/2, size/2, size * 0.47, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Main "O"
    ctx.fillStyle = 'transparent';
    ctx.strokeStyle = '#8ab4f8';
    ctx.lineWidth = size * 0.06;
    ctx.beginPath();
    ctx.arc(size/2, size/2, size * 0.27, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Inner "O"
    ctx.lineWidth = size * 0.02;
    ctx.beginPath();
    ctx.arc(size/2, size/2, size * 0.14, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Caliper elements (simplified for small sizes)
    if (size >= 48) {
      ctx.lineWidth = size * 0.015;
      ctx.lineCap = 'round';
      
      // Left caliper arm
      ctx.beginPath();
      ctx.moveTo(size * 0.23, size * 0.35);
      ctx.lineTo(size * 0.27, size * 0.31);
      ctx.lineTo(size * 0.27, size * 0.39);
      ctx.lineTo(size * 0.23, size * 0.43);
      ctx.stroke();
      
      // Right caliper arm
      ctx.beginPath();
      ctx.moveTo(size * 0.77, size * 0.35);
      ctx.lineTo(size * 0.73, size * 0.31);
      ctx.lineTo(size * 0.73, size * 0.39);
      ctx.lineTo(size * 0.77, size * 0.43);
      ctx.stroke();
      
      // Horizontal measurement line
      ctx.setLineDash([2, 2]);
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(size * 0.23, size * 0.39);
      ctx.lineTo(size * 0.77, size * 0.39);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    
    // Save PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`./icons/icon${size}.png`, buffer);
    console.log(`Created icon${size}.png`);
  }
}

// Check if canvas module is available, if not provide fallback
try {
  convertSvgToPng();
} catch (error) {
  console.log('Canvas module not available. Creating simple fallback icons...');
  
  // Create simple colored squares as fallback
  const sizes = [16, 48, 128];
  
  for (const size of sizes) {
    // This is a very simple fallback - just copy existing icons for now
    try {
      const existingIcon = fs.readFileSync(`./icons/icon${size}.png`);
      console.log(`Using existing icon${size}.png`);
    } catch (e) {
      console.log(`Could not create icon${size}.png - canvas module needed`);
    }
  }
}