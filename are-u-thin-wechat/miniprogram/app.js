const store = require("./utils/store");

App({
  onLaunch() {
    this.globalData = {
      env: "cloud1-5g7efswaf4780b4c",
      store,
      pendingMealItems: [],
      pendingImagePath: "",
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
