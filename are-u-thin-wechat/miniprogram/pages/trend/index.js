const store = require("../../utils/store");
const layout = require("../../utils/layout");

Page({
  data: {
    streakDays: 0,
    weeklyTrend: [],
    weeklyAverageCalories: 0,
    weeklyInsight: "",
    goalSubtitle: "",
    todayMealTypeStatus: [],
    hasTrendData: false,
    loading: false,
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
      tabBar.setData({ selected: 2 });
    }

    this.setData({ loading: true, errorText: "" });
    try {
      this.setData(await store.buildTrendViewModel());
    } catch (error) {
      this.setData({
        errorText: (error && error.message) || "读取趋势失败，请稍后再试。",
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  goRecord() {
    wx.switchTab({ url: "/pages/record/index" });
  },
});
