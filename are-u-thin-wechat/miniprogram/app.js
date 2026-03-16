const store = require("./utils/store");

App({
  onLaunch() {
    this.globalData = {
      env: "",
      store,
    };

    store.ensureState();

    if (wx.cloud && this.globalData.env) {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }
  },
});
