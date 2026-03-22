import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

export function useCollections() {
  const [collections, setCollections] = useState(() => {
    const saved = localStorage.getItem('tg_merchant_collections');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('tg_merchant_collections', JSON.stringify(collections));
  }, [collections]);

  const setTag = (merchant, tag) => {
    setCollections(prev => {
      const newCol = { ...prev };
      // 如果标签和当前一样，则取消收藏（Toggle效果）
      if (newCol[merchant.id]?.tag === tag) {
        delete newCol[merchant.id];
      } else {
        newCol[merchant.id] = { ...merchant, tag, savedAt: Date.now() };
      }
      return newCol;
    });
    
    try {
      WebApp.HapticFeedback.impactOccurred('light');
    } catch (e) {
      // ignore
    }
  };

  const removeCollection = (merchantId) => {
    setCollections(prev => {
      const newCol = { ...prev };
      delete newCol[merchantId];
      return newCol;
    });
  };

  return { collections, setTag, removeCollection };
}
