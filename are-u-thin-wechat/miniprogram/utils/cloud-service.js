function callDietData(action, data) {
  if (!wx.cloud) {
    return Promise.reject(new Error("当前基础库未启用云能力"));
  }

  return wx.cloud
    .callFunction({
      name: "dietData",
      data: {
        action,
        ...(data || {}),
      },
    })
    .then((response) => {
      const result = response.result || {};
      if (!result.success) {
        throw new Error(result.message || "云函数调用失败");
      }
      return result.data;
    });
}

function uploadMealImage(filePath) {
  if (!filePath) {
    return Promise.resolve("");
  }

  if (!wx.cloud) {
    return Promise.reject(new Error("当前基础库未启用云能力"));
  }

  const extension = (filePath.match(/\.[a-zA-Z0-9]+$/) || [""])[0] || ".jpg";
  return wx.cloud
    .uploadFile({
      cloudPath: `meal-images/${Date.now()}_${Math.random().toString(36).slice(2, 8)}${extension}`,
      filePath,
    })
    .then((result) => result.fileID || "");
}

module.exports = {
  initUser(publicProfile) {
    return callDietData("initUser", {
      publicProfile: publicProfile || {},
    });
  },
  saveOnboarding(profile, settings) {
    return callDietData("saveOnboarding", { profile, settings });
  },
  getDashboard() {
    return callDietData("getDashboard");
  },
  getTrend() {
    return callDietData("getTrend");
  },
  getProfile() {
    return callDietData("getProfile");
  },
  updateProfile(profile, settings) {
    return callDietData("updateProfile", { profile, settings });
  },
  async createMealRecord(meal, imagePath) {
    const imageFileId = imagePath ? await uploadMealImage(imagePath) : meal.imageFileId || "";
    return callDietData("createMealRecord", {
      meal: {
        ...meal,
        imageFileId,
      },
    });
  },
};

