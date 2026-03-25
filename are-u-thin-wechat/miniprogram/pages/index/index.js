const store = require("../../utils/store");
const layout = require("../../utils/layout");

Page({
  data: {
    nickname: "微信用户",
    avatarUrl: "",
    submitting: false,
    checking: true,
    errorText: "",
    canChooseAvatar: wx.canIUse && wx.canIUse("button.open-type.chooseAvatar"),
    pageTopInset: layout.getPageTopInset(),
  },

  async onShow() {
    this.setData({ checking: true, errorText: "" });

    try {
      const route = await store.resolveEntryRoute();
      if (route === "/pages/dashboard/index") {
        wx.switchTab({ url: route });
        return;
      }

      if (route === "/pages/onboarding/index") {
        wx.redirectTo({ url: route });
        return;
      }

      this.hydrateLocalProfile();
    } catch (error) {
      this.setData({ errorText: this.formatError(error) });
    } finally {
      this.setData({ checking: false });
    }
  },

  hydrateLocalProfile() {
    const cachedProfile = store.getPendingPublicProfile() || store.getProfile() || store.getUser() || {};
    this.setData({
      nickname: cachedProfile.nickname || "微信用户",
      avatarUrl: cachedProfile.avatarUrl || "",
    });
  },

  handleNicknameInput(event) {
    this.setData({ nickname: event.detail.value || "", errorText: "" });
  },

  handleChooseAvatar(event) {
    const avatarUrl = (event.detail && event.detail.avatarUrl) || "";
    this.setData({ avatarUrl, errorText: "" });
  },

  async handleLogin() {
    if (this.data.submitting) {
      return;
    }

    const nickname = (this.data.nickname || "").trim() || "微信用户";
    this.setData({ submitting: true, errorText: "", nickname });


    try {
      const result = await store.loginWithWechat({
        nickname,
        avatarUrl: this.data.avatarUrl || "",
      });
      if (result && result.profile) {
        wx.switchTab({ url: "/pages/dashboard/index" });
        return;
      }
      wx.redirectTo({ url: "/pages/onboarding/index" });
    } catch (error) {
      this.setData({ errorText: this.formatError(error) });
    } finally {
      this.setData({ submitting: false });
    }
  },

  formatError(error) {
    const message =
      (error && error.errMsg) ||
      (error && error.message) ||
      "微信身份初始化失败，请稍后重试。";

    if (message.indexOf("Environment not found") > -1) {
      return "云开发环境未配置。请先在 miniprogram/app.js 中填写 env，或在微信开发者工具里绑定云环境。";
    }

    if (message.indexOf("FunctionName parameter could not be found") > -1) {
      return "未找到 dietData 云函数。请先上传并部署 cloudfunctions/dietData。";
    }

    return message;
  },
});
