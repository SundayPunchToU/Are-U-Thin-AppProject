const store = require("../../utils/store");
const layout = require("../../utils/layout");

function buildProfile(data, baseProfile) {
  return {
    ...(baseProfile || {}),
    nickname: (baseProfile && baseProfile.nickname) || "微信用户",
    avatarUrl: (baseProfile && baseProfile.avatarUrl) || "",
    age: data.age,
    heightCm: data.heightCm,
    weightKg: data.weightKg,
    activityFactor: data.activityValue / 10,
    goal: data.goal,
  };
}

Page({
  data: {
    age: 27,
    heightCm: 165,
    weightKg: 58,
    activityValue: 14,
    activityText: "轻度活跃",
    goal: "cut",
    goalOptions: store.appData.GOAL_OPTIONS,
    calorieTarget: 0,
    macroTargets: null,
    goalTitle: "",
    goalSubtitle: "",
    isSubmitting: false,
    errorText: "",
    pageTopInset: layout.getPageTopInset(),
  },

  onLoad() {
    this.refreshPreview();
  },

  async onShow() {
    const access = await store.ensurePageAccess();
    if (access.redirectTo === "/pages/index/index") {
      wx.redirectTo({ url: access.redirectTo });
      return;
    }
    if (access.profile) {
      wx.switchTab({ url: "/pages/dashboard/index" });
      return;
    }

    const baseProfile = store.getPendingPublicProfile() || store.getProfile() || store.getUser() || {};
    this.setData({
      goal: baseProfile.goal || this.data.goal,
      age: Number(baseProfile.age || this.data.age),
      heightCm: Number(baseProfile.heightCm || this.data.heightCm),
      weightKg: Number(baseProfile.weightKg || this.data.weightKg),
      activityValue: Math.round(Number(baseProfile.activityFactor || this.data.activityValue / 10) * 10),
    });
    this.refreshPreview();
  },

  handleAgeChange(event) {
    this.setData({ age: Number(event.detail.value) });
    this.refreshPreview();
  },

  handleHeightChange(event) {
    this.setData({ heightCm: Number(event.detail.value) });
    this.refreshPreview();
  },

  handleWeightChange(event) {
    this.setData({ weightKg: Number(event.detail.value) });
    this.refreshPreview();
  },

  handleActivityChange(event) {
    this.setData({ activityValue: Number(event.detail.value) });
    this.refreshPreview();
  },

  chooseGoal(event) {
    this.setData({ goal: event.currentTarget.dataset.goal });
    this.refreshPreview();
  },

  refreshPreview() {
    const profile = buildProfile(this.data, store.getPendingPublicProfile() || store.getProfile() || store.getUser());
    const metrics = store.appData.buildProfileMetrics(profile);
    const goalOption = store.appData.getGoalOption(profile.goal);
    this.setData({
      calorieTarget: metrics.dailyCalorieTarget,
      macroTargets: metrics,
      activityText: store.appData.getActivityText(profile.activityFactor),
      goalTitle: goalOption.supportiveTitle,
      goalSubtitle: goalOption.supportiveSubtitle,
    });
  },

  async submitProfile() {
    if (this.data.isSubmitting) {
      return;
    }

    this.setData({
      isSubmitting: true,
      errorText: "",
    });

    try {
      await store.completeOnboarding(buildProfile(this.data, store.getPendingPublicProfile() || store.getProfile() || store.getUser()));
      wx.switchTab({ url: "/pages/dashboard/index" });
    } catch (error) {
      this.setData({
        errorText: (error && error.message) || "保存档案失败，请稍后再试。",
      });
    } finally {
      this.setData({
        isSubmitting: false,
      });
    }
  },
});
