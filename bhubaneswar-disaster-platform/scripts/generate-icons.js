const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../public/icons');

// Icon sizes needed for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Base icon template
const BASE_ICON = {
  width: 512,
  height: 512,
  channels: 4,
  background: '#1976d2', // Primary blue color
};

// Notification badge template
const NOTIFICATION_BADGE = {
  width: 96,
  height: 96,
  channels: 4,
  background: '#d32f2f', // Error red color
};

async function generateIcons() {
  // Ensure icons directory exists
  await fs.mkdir(ICONS_DIR, { recursive: true });

  // Generate main app icon in different sizes
  for (const size of ICON_SIZES) {
    const svg = `
      <svg width="${BASE_ICON.width}" height="${BASE_ICON.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${BASE_ICON.background}"/>
        <text x="50%" y="50%" font-family="Arial" font-size="${BASE_ICON.width * 0.4}" 
              fill="white" text-anchor="middle" dominant-baseline="middle">
          BDP
        </text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .resize(size, size)
      .toFile(path.join(ICONS_DIR, `icon-${size}x${size}.png`));
    
    console.log(`Generated icon-${size}x${size}.png`);
  }

  // Generate notification badge
  const badgeSvg = `
    <svg width="${NOTIFICATION_BADGE.width}" height="${NOTIFICATION_BADGE.height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${NOTIFICATION_BADGE.background}"/>
      <text x="50%" y="50%" font-family="Arial" font-size="${NOTIFICATION_BADGE.width * 0.5}" 
            fill="white" text-anchor="middle" dominant-baseline="middle">
        !
      </text>
    </svg>
  `;

  await sharp(Buffer.from(badgeSvg))
    .toFile(path.join(ICONS_DIR, 'notification-badge.png'));
  
  console.log('Generated notification-badge.png');
}

generateIcons().catch(console.error);