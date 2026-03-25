const store = require("../../utils/store");
const layout = require("../../utils/layout");

function buildRemainingText(remainingCalories) {
  if (remainingCalories >= 0) {
    return `距离今日建议还差 ${remainingCalories} kcal，慢慢吃也来得及。`;
  }
  return `今天已经多摄入 ${Math.abs(remainingCalories)} kcal，下一餐清爽一点就很好。`;
}

Page({
  data: {
    profile: null,
    goal: null,
    streakDays: 0,
    todayMeals: [],
    todaySummary: {},
    todayMealTypeStatus: [],
    remainingCalories: 0,
    remainingText: "",
    goalHeadline: "",
    goalSubtitle: "",
    latestSuggestion: "",
    calorieProgress: 0,
    macroTargets: [],
    dailyCalorieTarget: 0,
    loading: false,
    errorText: "",
    pageTopInset: layout.getPageTopInset(),
  },

  async onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: 0 });
    }

    const access = await store.ensurePageAccess();
    if (access.redirectTo) {
      if (access.redirectTo === "/pages/index/index") {
        wx.reLaunch({ url: access.redirectTo });
      } else {
        wx.redirectTo({ url: access.redirectTo });
      }
      return;
    }

    this.refreshData();
  },

  async refreshData() {
    this.setData({ loading: true, errorText: "" });
    try {
      const viewModel = await store.buildDashboardViewModel();
      this.setData({
        ...viewModel,
        remainingText: buildRemainingText(viewModel.remainingCalories),
      });
    } catch (error) {
      this.setData({
        errorText: (error && error.message) || "读取首页数据失败，请稍后重试。",
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  goRecord() {
    wx.switchTab({ url: "/pages/record/index" });
  },
});
