const store = require("../../utils/store");

const loadingHints = [
  "正在数米粒...",
  "正在判断烹饪方式...",
  "正在估算隐藏热量...",
];

Page({
  data: {
    imagePath: "",
    voiceNote: "",
    quickTags: ["少油", "外卖", "训练后", "加餐"],
    isLoading: false,
    progressText: "",
    errorText: "",
    lastAnalysis: null,
    mealLogs: [],
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
      tabBar.setData({ selected: 1 });
    }

    this.refreshData();
  },

  refreshData() {
    this.setData({
      mealLogs: store.getMealLogs().slice(0, 3),
      lastAnalysis: store.getLastAnalysis(),
    });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const file = (res.tempFiles || [])[0];
        this.setData({
          imagePath: file ? file.tempFilePath : "",
        });
      },
    });
  },

  handleVoiceInput(event) {
    this.setData({
      voiceNote: event.detail.value,
      errorText: "",
    });
  },

  applyTag(event) {
    const { tag } = event.currentTarget.dataset;
    const nextText = this.data.voiceNote
      ? `${this.data.voiceNote} #${tag}`
      : `#${tag}`;
    this.setData({
      voiceNote: nextText,
    });
  },

  analyzeMeal() {
    const voiceNote = (this.data.voiceNote || "").trim();
    if (!voiceNote || this.data.isLoading) {
      return;
    }

    this.setData({
      isLoading: true,
      progressText: loadingHints[Math.floor(Math.random() * loadingHints.length)],
      errorText: "",
    });

    setTimeout(() => {
      const result = store.appData.analyzeMeal(voiceNote);
      store.addMealLog(result, voiceNote, this.data.imagePath);
      this.setData({
        isLoading: false,
        progressText: "已识别并同步到今日看板",
        imagePath: "",
        voiceNote: "",
      });
      this.refreshData();
    }, 700);
  },
});
