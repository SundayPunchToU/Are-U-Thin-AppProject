const store = require("../../utils/store");
const layout = require("../../utils/layout");

Page({
  data: {
    draft: "",
    quickPrompts: ["今晚外卖怎么点？", "训练后加餐建议", "夜宵想吃又怕胖"],
    coachMessages: [],
    scrollTarget: "",
    isLoading: false,
    errorText: "",
    agentMode: "cloud",
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
    if (!text || this.data.isLoading) {
      return;
    }

    store.addCoachMessage(text, true);
    this.setData({
      draft: "",
      errorText: "",
      isLoading: true,
    });
    this.syncMessages();

    this.requestCoachReply(text)
      .then((result) => {
        store.addCoachMessage(result.reply, false);
        this.setData({
          agentMode: result.fallback ? "fallback" : "cloud",
          errorText: result.notice || "",
        });
      })
      .catch((error) => {
        store.addCoachMessage(`【演示回复】${store.appData.generateCoachReply(text)}`, false);
        this.setData({
          agentMode: "fallback",
          errorText: this.formatError(error),
        });
      })
      .finally(() => {
        this.setData({
          isLoading: false,
        });
        this.syncMessages();
      });
  },

  requestCoachReply(text) {
    if (!wx.cloud) {
      return Promise.resolve({
        fallback: true,
        notice: "当前基础库未启用云能力，已切换为本地演示回复。",
        reply: `【演示回复】${store.appData.generateCoachReply(text)}`,
      });
    }

    const history = store
      .getCoachMessages()
      .filter(
        (item) =>
          item.fromUser ||
          (typeof item.text === "string" &&
            item.text.indexOf("【演示回复】") !== 0)
      )
      .slice(-8)
      .map((item) => ({
        role: item.fromUser ? "user" : "assistant",
        content: item.text,
      }));

    return wx.cloud
      .callFunction({
        name: "aiCoach",
        data: {
          action: "chat",
          messages: history,
          context: store.buildCoachRequestContext(),
        },
      })
      .then((response) => {
        const result = response.result || {};
        if (result.success && result.reply) {
          return {
            fallback: false,
            reply: result.reply,
            notice: "",
          };
        }

        return {
          fallback: true,
          notice:
            result.message ||
            "AI 服务暂未正确配置，已切换为本地演示回复。",
          reply: `【演示回复】${store.appData.generateCoachReply(text)}`,
        };
      });
  },

  formatError(error) {
    const message =
      (error && error.errMsg) ||
      (error && error.message) ||
      "AI 服务调用失败，已切换为本地演示回复。";

    if (message.indexOf("Environment not found") > -1) {
      return "云开发环境未配置。请先在 miniprogram/app.js 中填写 env，或在微信开发者工具里绑定云环境。";
    }

    if (message.indexOf("FunctionName parameter could not be found") > -1) {
      return "未找到 aiCoach 云函数。请先上传并部署 cloudfunctions/aiCoach。";
    }

    return `${message} 已切换为本地演示回复。`;
  },

  onUnload() {
  },

  onHide() {
  },
});
