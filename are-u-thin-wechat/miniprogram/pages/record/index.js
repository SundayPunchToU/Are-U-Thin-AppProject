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
    breakfastLogs: [],
    lunchLogs: [],
    dinnerLogs: [],
    showMealTypeDialog: false,
    pendingMealResult: null,
  },

  // 判断时间是否属于早餐（6:00-10:00）
  isBreakfastTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours();
    return hours >= 6 && hours < 10;
  },

  // 判断时间是否属于午餐（11:00-14:00）
  isLunchTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours();
    return hours >= 11 && hours < 14;
  },

  // 判断时间是否属于晚餐（17:00-21:00）
  isDinnerTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours();
    return hours >= 17 && hours < 21;
  },

  // 显示餐次选择弹窗
  showMealTypeDialog() {
    this.setData({
      showMealTypeDialog: true,
    });
  },

  // 隐藏餐次选择弹窗
  hideMealTypeDialog() {
    this.setData({
      showMealTypeDialog: false,
      pendingMealResult: null,
    });
  },

  // 选择餐次
  selectMealType(event) {
    const { type } = event.currentTarget.dataset;
    const { pendingMealResult, voiceNote, imagePath } = this.data;
    
    if (!pendingMealResult) {
      return;
    }

    // 添加餐次标签到记录中
    const mealTypeTags = {
      breakfast: "早餐",
      lunch: "午餐", 
      dinner: "晚餐"
    };
    
    const mealTag = mealTypeTags[type];
    const noteWithMealType = voiceNote ? `${voiceNote} #${mealTag}` : `#${mealTag}`;
    
    // 保存记录
    store.addMealLog(pendingMealResult, noteWithMealType, imagePath);
    
    this.setData({
      showMealTypeDialog: false,
      progressText: `已记录到${mealTag}`,
      imagePath: "",
      voiceNote: "",
      pendingMealResult: null,
    });
    
    this.refreshData();
  },

  // 弹窗关闭回调
  onDialogClose() {
    // 可以在这里添加弹窗关闭后的逻辑
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
    const mealLogs = store.getMealLogs();
    
    // 分类三餐记录（这里简单按时间分类，实际可以根据用户选择）
    const breakfastLogs = mealLogs.filter(log => this.isBreakfastTime(log.timestamp));
    const lunchLogs = mealLogs.filter(log => this.isLunchTime(log.timestamp));
    const dinnerLogs = mealLogs.filter(log => this.isDinnerTime(log.timestamp));
    
    this.setData({
      mealLogs: mealLogs.slice(0, 3),
      breakfastLogs,
      lunchLogs,
      dinnerLogs,
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
      
      // 保存识别结果，显示弹窗让用户选择餐次
      this.setData({
        isLoading: false,
        pendingMealResult: result,
        showMealTypeDialog: true,
      });
    }, 700);
  },
});