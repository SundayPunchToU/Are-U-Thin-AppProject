const store = require("../../utils/store");

Page({
  data: {
    streakDays: 0,
    storyProfiles: [],
    inspirationFeed: [],
    latestSuggestion: "",
    todayGoal: {},
    macroTargets: [],
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
      tabBar.setData({ selected: 0 });
    }

    this.setData(store.buildDashboardViewModel());
  },
});
