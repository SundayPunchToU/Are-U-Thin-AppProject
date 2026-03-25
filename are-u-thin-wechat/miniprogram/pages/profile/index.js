const store = require("../../utils/store");
const layout = require("../../utils/layout");

Page({
  data: {
    profile: null,
    goal: null,
    goalOptions: [],
    metrics: null,
    streakDays: 0,
    todayMeals: [],
    todaySummary: {},
    settings: store.appData.DEFAULT_SETTINGS,
    loading: false,
    savingGoal: false,
    errorText: "",
    pageTopInset: layout.getPageTopInset(),
  },

  async onShow() {
    const access = await store.ensurePageAccess();
    if (access.redirectTo) {
      if (access.redirectTo === "/pages/index/index") {
        wx.reLaunch({ url: access.redirectTo });
      } else {
        wx.redirectTo({ url: access.redirectTo });
      }
      return;
    }

    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: 3 });
    }

    this.refreshData();
  },

  async refreshData() {
    this.setData({ loading: true, errorText: "" });
    try {
      this.setData(await store.buildProfileViewModel());
    } catch (error) {
      this.setData({
        errorText: (error && error.message) || "读取档案失败，请稍后再试。",
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  async chooseGoal(event) {
    if (this.data.savingGoal) {
      return;
    }

    this.setData({ savingGoal: true, errorText: "" });
    try {
      await store.updateGoal(event.currentTarget.dataset.goal);
      await this.refreshData();
    } catch (error) {
      this.setData({
        errorText: (error && error.message) || "更新目标失败，请稍后再试。",
      });
    } finally {
      this.setData({ savingGoal: false });
    }
  },

  goRecord() {
    wx.switchTab({ url: "/pages/record/index" });
  },

  goDashboard() {
    wx.switchTab({ url: "/pages/dashboard/index" });
  },

  async handleSettingChange(event) {
    const key = event.currentTarget.dataset.key;
    const settings = {
      ...this.data.settings,
      [key]: event.detail.value,
    };
    await store.saveSettings(settings);
    this.setData({ settings });
  },
});
