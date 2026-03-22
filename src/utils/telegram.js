import WebApp from '@twa-dev/sdk'

/**
 * 获取当前 Telegram 用户信息 (兼容本地浏览器测试)
 */
export const getCurrentTgUser = () => {
  const user = WebApp.initDataUnsafe?.user;
  if (user) {
    return {
      id: user.id,
      username: user.username || user.first_name || 'Anonymous'
    };
  }
  // 浏览器开发环境的假数据
  return {
    id: 12345678,
    username: 'DevUser'
  };
};

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
  return file; 
};
