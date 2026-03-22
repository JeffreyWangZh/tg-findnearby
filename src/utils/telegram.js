import WebApp from '@twa-dev/sdk'

/**
 * 打开与商户老板的 Telegram 私聊
 * @param {string} ownerPath - 用户名或完整 t.me 链接
 */
export const contactMerchantOwner = (ownerPath) => {
  if (!ownerPath) {
    WebApp.showPopup({
      title: '暂无联系方式',
      message: '该商户还未提供 Telegram 联系方式。',
      buttons: [{ type: 'ok', text: '知道了' }]
    });
    return;
  }

  let targetUrl = ownerPath;
  if (!ownerPath.startsWith('http')) {
    const cleanUsername = ownerPath.replace('@', '');
    targetUrl = `https://t.me/${cleanUsername}`;
  }

  WebApp.openTelegramLink(targetUrl);
};

/**
 * 前端图片压缩（上传前节省带宽）
 */
export const compressImage = async (file) => {
  // 实际项目中可使用 browser-image-compression 库
  console.log(`正在压缩 ${file.name}...`);
  return file; 
};
