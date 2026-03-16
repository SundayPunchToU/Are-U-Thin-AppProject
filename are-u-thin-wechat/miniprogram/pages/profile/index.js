const store = require("../../utils/store");

Page({
  data: {
    profile: null,
    dailyCalorieTarget: 0,
    goalLabel: "",
    macroPlanText: "",
    settings: store.appData.DEFAULT_SETTINGS,
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
      tabBar.setData({ selected: 4 });
    }

    this.refreshData();
  },

  refreshData() {
    const profile = store.getProfile();
    const macroPlan = store.appData.getMacroPlan(profile.goal);
    const goalOption = store.appData.getGoalOption(profile.goal);

    this.setData({
      profile,
      dailyCalorieTarget: store.appData.calculateDailyCalorieTarget(profile),
      goalLabel: goalOption.label,
      macroPlanText: `蛋白 ${Math.round(macroPlan.proteinRatio * 100)}% · 碳水 ${Math.round(
        macroPlan.carbRatio * 100
      )}% · 脂肪 ${Math.round(macroPlan.fatRatio * 100)}%`,
      settings: store.getSettings(),
    });
  },

  handleSettingChange(event) {
    const key = event.currentTarget.dataset.key;
    const settings = {
      ...this.data.settings,
      [key]: event.detail.value,
    };
    store.saveSettings(settings);
    this.setData({ settings });
  },
});
