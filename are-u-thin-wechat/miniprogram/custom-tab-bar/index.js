/**
 * Custom Tab Bar — 底部导航栏
 * 中心 "+" 按钮：拍照/选图 → 将图片路径写入 globalData → 跳转首页
 * 识别逻辑统一由 dashboard 的 startMealCaptureFlow 处理
 */

Component({
  data: {
    selected: 0,
    color: "#747884",
    selectedColor: "#FA725D",
    _capturing: false,
    list: [
      { pagePath: "/pages/dashboard/index", text: "今日", icon: "🏠" },
      { pagePath: "/pages/trend/index", text: "记录", icon: "📈" },
      { pagePath: "/pages/community/index", text: "社区", icon: "🏆" },
      { pagePath: "/pages/profile/index", text: "我的", icon: "👤" },
    ],
  },

  methods: {
    switchTab(event) {
      const { path, index } = event.currentTarget.dataset;
      this.setData({ selected: index });
      wx.switchTab({ url: path });
    },

    /**
     * 中心 "+" 按钮：拍照 → 写入 globalData → 跳转首页由 dashboard 统一识别
     */
    onCenterTap() {
      if (this.data._capturing) return;
      this.setData({ _capturing: true });

      console.log("[TabBar] + 按钮点击，开始拍照流程");

      wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["album", "camera"],
        success: (res) => {
          const tempPath = res.tempFiles[0].tempFilePath;
          console.log("[TabBar] 拍照/选图成功:", tempPath);

          getApp().globalData.pendingImagePath = tempPath;
          wx.switchTab({ url: "/pages/dashboard/index" });
        },
        fail: (err) => {
          console.log("[TabBar] 拍照/选图取消或失败:", err.errMsg || err);
        },
        complete: () => {
          this.setData({ _capturing: false });
        },
      });
    },
  },
});
