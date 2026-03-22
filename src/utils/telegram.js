import WebApp from '@twa-dev/sdk'

/**
 * Opens a direct Telegram chat with the merchant owner.
 * @param {string} ownerPath - Either a username (e.g., 'johndoe') or a full t.me link.
 */
export const contactMerchantOwner = (ownerPath) => {
  if (!ownerPath) {
    WebApp.showPopup({
      title: 'Wait!',
      message: 'This merchant hasn\'t provided a contact yet.',
      buttons: [{ type: 'ok', text: 'Ok then' }]
    });
    return;
  }

  // Ensure it's a valid Telegram URL
  let targetUrl = ownerPath;
  if (!ownerPath.startsWith('http')) {
    // Strip '@' if provided
    const cleanUsername = ownerPath.replace('@', '');
    targetUrl = `https://t.me/${cleanUsername}`;
  }

  // Technical Requirement: Use Telegram.WebApp.openTelegramLink
  WebApp.openTelegramLink(targetUrl);
};

/**
 * Compresses an image before upload to save bandwidth in Telegram.
 * Mock implementation of frontend image compression.
 */
export const compressImage = async (file) => {
  console.log(`Compressing ${file.name}...`);
  // Real implementation would use canvas or a library like 'browser-image-compression'
  return file; 
};
