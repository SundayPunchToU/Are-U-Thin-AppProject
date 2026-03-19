const store = require("../../utils/store");

Page({
  data: {
    streakDays: 0,
    storyProfiles: [],
    inspirationFeed: [],
    latestSuggestion: "",
    todayGoal: {},
    macroTargets: [],
    showMicroDrawer: false,
    microNutrients: []
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

    // 先获取dashboard数据，然后合并微量元素数据
    const dashboardData = store.buildDashboardViewModel();
    this.initMicroNutrients();
    
    // 合并数据，确保microNutrients不被覆盖
    this.setData({
      ...dashboardData,
      showMicroDrawer: false,
      microNutrients: this.data.microNutrients
    });
  },

  // 初始化微量元素数据
  initMicroNutrients() {
    const microData = [
      {
        name: "维生素C",
        shortName: "维C",
        current: 45,
        recommended: 90,
        unit: "mg",
        statusColor: "#34D399",
        statusText: "充足",
        suggestion: "摄入充足，继续保持新鲜水果和蔬菜的摄入"
      },
      {
        name: "钙",
        shortName: "钙",
        current: 800,
        recommended: 1000,
        unit: "mg",
        statusColor: "#34D399",
        statusText: "充足",
        suggestion: "钙摄入良好，有助于骨骼健康"
      },
      {
        name: "锌",
        shortName: "锌",
        current: 8,
        recommended: 15,
        unit: "mg",
        statusColor: "#F87171",
        statusText: "不足",
        suggestion: "锌摄入不足，建议补充红肉或海鲜"
      },
      {
        name: "膳食纤维",
        shortName: "纤维",
        current: 18,
        recommended: 25,
        unit: "g",
        statusColor: "#FBBF24",
        statusText: "偏低",
        suggestion: "膳食纤维略低，建议多吃全谷物和蔬菜"
      },
      {
        name: "Omega-3",
        shortName: "Omega-3",
        current: 0.8,
        recommended: 1.6,
        unit: "g",
        statusColor: "#FBBF24",
        statusText: "偏低",
        suggestion: "Omega-3脂肪酸偏低，建议每周吃2-3次深海鱼"
      },
      {
        name: "铁",
        shortName: "铁",
        current: 12,
        recommended: 18,
        unit: "mg",
        statusColor: "#F87171",
        statusText: "不足",
        suggestion: "铁摄入不足，建议多吃瘦肉、豆类和深绿色蔬菜"
      },
      {
        name: "维生素D",
        shortName: "维D",
        current: 8,
        recommended: 15,
        unit: "μg",
        statusColor: "#FBBF24",
        statusText: "偏低",
        suggestion: "维生素D偏低，建议适量晒太阳或补充富含维生素D的食物"
      }
    ];

    // 计算进度百分比
    const microNutrients = microData.map(item => ({
      ...item,
      progress: Math.min((item.current / item.recommended) * 100, 100)
    }));

    this.setData({ microNutrients });
  },

  // 显示微量元素详情抽屉
  showMicroDetails() {
    this.setData({ showMicroDrawer: true });
  },

  // 隐藏微量元素详情抽屉
  hideMicroDetails() {
    this.setData({ showMicroDrawer: false });
  },

  // 抽屉关闭后的回调
  onDrawerClose() {
    // 可以在这里添加抽屉关闭后的逻辑
  }
});