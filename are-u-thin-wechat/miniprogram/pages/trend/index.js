const store = require("../../utils/store");

Page({
  data: {
    streakDays: 0,
    weeklyTrend: [],
    badges: [],
  },

  onShow() {
    if (!store.getProfile()) {
      wx.reLaunch({
        url: "/pages/onboarding/index",
      });
      return;
    }

    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: 2 });
    }

    this.setData(store.buildTrendViewModel());
  },
});
