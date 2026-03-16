const store = require("../../utils/store");

Page({
  data: {
    draft: "",
    quickPrompts: ["今晚外卖怎么点？", "训练后加餐建议", "夜宵想吃又怕胖"],
    coachMessages: [],
    scrollTarget: "",
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
      tabBar.setData({ selected: 3 });
    }

    this.syncMessages();
  },

  syncMessages() {
    const coachMessages = store.getCoachMessages();
    const lastItem = coachMessages[coachMessages.length - 1];
    this.setData({
      coachMessages,
      scrollTarget: lastItem ? `message-${lastItem.id}` : "",
    });
  },

  handleDraftInput(event) {
    this.setData({
      draft: event.detail.value,
    });
  },

  applyPrompt(event) {
    const { prompt } = event.currentTarget.dataset;
    this.sendMessage(prompt);
  },

  sendDraft() {
    this.sendMessage(this.data.draft);
  },

  sendMessage(rawText) {
    const text = (rawText || "").trim();
    if (!text) {
      return;
    }

    store.addCoachMessage(text, true);
    this.setData({ draft: "" });
    this.syncMessages();

    clearTimeout(this.replyTimer);
    this.replyTimer = setTimeout(() => {
      store.addCoachMessage(store.appData.generateCoachReply(text), false);
      this.syncMessages();
    }, 650);
  },

  onUnload() {
    clearTimeout(this.replyTimer);
  },
});
