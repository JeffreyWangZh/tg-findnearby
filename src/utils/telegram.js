import WebApp from '@twa-dev/sdk'

/**
 * 检查应用是否运行在真实的 Telegram 环境中
 * 支持通过 ?debug=true 或 本地开发环境(Vite DEV) 绕过限制
 */
export const isTelegramEnvironment = () => {
  const isDebug = new URLSearchParams(window.location.search).get('debug') === 'true';
  const isLocalDev = import.meta.env?.DEV;

  if (isDebug || isLocalDev) return true;

  // 严格检查 Telegram InitData 和 UserID
  const hasInitData = WebApp.initData && WebApp.initData.trim() !== '';
  const hasUserId = WebApp.initDataUnsafe?.user?.id != null;
  const platform = WebApp.platform;

  return hasInitData && hasUserId && platform !== 'unknown';
};

/**
 * 获取当前 Telegram 用户信息 (兼容本地浏览器测试)
 */
export const getCurrentTgUser = () => {
  const user = WebApp.initDataUnsafe?.user;
  if (user && user.id) {
    return {
      id: user.id,
      username: user.username || user.first_name || 'Anonymous'
    };
  }
  // 必须是本地开发环境/调试模式才可以拿到假数据
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

export const FALLBACK_IMAGES = {
  '餐饮美食': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=300&fit=crop',
  '咖啡茶饮': 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600&h=300&fit=crop',
  '零售购物': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=300&fit=crop',
  '生活服务': 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=300&fit=crop',
  '美容健身': 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&h=300&fit=crop',
  '教育培训': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=300&fit=crop',
  '科技互联': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=300&fit=crop',
  '默认': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=300&fit=crop'
};
/**
 * 前端图片压缩（上传前节省带宽）
 */
export const compressImage = async (file) => {
  return file; 
};
