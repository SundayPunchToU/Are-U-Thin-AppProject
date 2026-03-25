Component({
  data: {
    selected: 0,
    color: "#747884",
    selectedColor: "#FA725D",
    list: [
      { pagePath: "/pages/dashboard/index", text: "今日", icon: "⌂" },
      { pagePath: "/pages/record/index", text: "记录", icon: "＋" },
      { pagePath: "/pages/trend/index", text: "趋势", icon: "▥" },
      { pagePath: "/pages/profile/index", text: "我的", icon: "◐" },
    ],
  },

  methods: {
    switchTab(event) {
      const { path, index } = event.currentTarget.dataset;
      this.setData({ selected: index });
      wx.switchTab({ url: path });
    },
  },
});
