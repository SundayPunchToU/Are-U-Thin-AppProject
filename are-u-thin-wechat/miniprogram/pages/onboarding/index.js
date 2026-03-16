const store = require("../../utils/store");

Page({
  data: {
    age: 27,
    heightCm: 165,
    weightKg: 58,
    activityValue: 14,
    activityText: "1.4",
    goal: "steadyCut",
    goalOptions: store.appData.GOAL_OPTIONS,
    calorieTarget: 0,
  },

  onLoad() {
    this.refreshPreview();
  },

  onShow() {
    if (store.getProfile()) {
      wx.switchTab({
        url: "/pages/dashboard/index",
      });
    }
  },

  handleAgeChange(event) {
    this.setData({
      age: Number(event.detail.value),
    });
    this.refreshPreview();
  },

  handleHeightChange(event) {
    this.setData({
      heightCm: Number(event.detail.value),
    });
    this.refreshPreview();
  },

  handleWeightChange(event) {
    this.setData({
      weightKg: Number(event.detail.value),
    });
    this.refreshPreview();
  },

  handleActivityChange(event) {
    this.setData({
      activityValue: Number(event.detail.value),
    });
    this.refreshPreview();
  },

  chooseGoal(event) {
    this.setData({
      goal: event.currentTarget.dataset.goal,
    });
    this.refreshPreview();
  },

  refreshPreview() {
    const profile = {
      nickname: "Lihanjie",
      age: this.data.age,
      heightCm: this.data.heightCm,
      weightKg: this.data.weightKg,
      activityFactor: this.data.activityValue / 10,
      goal: this.data.goal,
    };
    this.setData({
      calorieTarget: store.appData.calculateDailyCalorieTarget(profile),
      activityText: (this.data.activityValue / 10).toFixed(1),
    });
  },

  submitProfile() {
    const profile = {
      nickname: "Lihanjie",
      age: this.data.age,
      heightCm: this.data.heightCm,
      weightKg: this.data.weightKg,
      activityFactor: this.data.activityValue / 10,
      goal: this.data.goal,
    };

    store.completeOnboarding(profile);
    wx.switchTab({
      url: "/pages/dashboard/index",
    });
  },
});
