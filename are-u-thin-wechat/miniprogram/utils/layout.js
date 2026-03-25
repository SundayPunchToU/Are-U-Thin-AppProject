let cachedPageTopInset = null;

function computePageTopInset() {
  const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
  const statusBarHeight = systemInfo.statusBarHeight || 20;
  const fallbackInset = statusBarHeight + 52;

  if (!wx.getMenuButtonBoundingClientRect) {
    return fallbackInset;
  }

  const menuButtonRect = wx.getMenuButtonBoundingClientRect();
  if (!menuButtonRect || !menuButtonRect.top || !menuButtonRect.height) {
    return fallbackInset;
  }

  const navGap = Math.max(menuButtonRect.top - statusBarHeight, 4);
  return menuButtonRect.bottom + navGap + 8;
}

function getPageTopInset() {
  if (cachedPageTopInset === null) {
    cachedPageTopInset = computePageTopInset();
  }
  return cachedPageTopInset;
}

module.exports = {
  getPageTopInset,
};

