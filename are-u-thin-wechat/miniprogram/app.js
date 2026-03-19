const store = require("./utils/store");

App({
  onLaunch() {
    this.globalData = {
      env: "",
      store,
    };

    store.ensureState();

    if (wx.cloud) {
      const cloudOptions = {
        traceUser: true,
      };

      if (this.globalData.env) {
        cloudOptions.env = this.globalData.env;
      }

      wx.cloud.init(cloudOptions);
    }
  },
});
