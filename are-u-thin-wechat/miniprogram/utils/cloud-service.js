/**
 * 云服务层 — 封装所有云函数调用，统一增加 timeout 保护
 *
 * 根因：wx.cloud.callFunction 在云环境异常时会挂起（既不 resolve 也不 reject），
 *       直到微信内部 10s 超时才抛出 Error: timeout。
 * 修复：对每个调用包装 Promise.race + timeout，超时后快速 reject 并 fallback。
 */

var CLOUD_TIMEOUT = 8000; // 8s 超时（早于微信内部 10s），给 fallback 留余量

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise(function (_, reject) {
      setTimeout(function () {
        reject(new Error("云服务调用超时（" + timeoutMs + "ms）"));
      }, timeoutMs);
    }),
  ]);
}

function callDietData(action, data) {
  if (!wx.cloud) {
    return Promise.reject(new Error("当前基础库未启用云能力"));
  }

  var cloudPromise = wx.cloud
    .callFunction({
      name: "dietData",
      data: {
        action: action,
        ...(data || {}),
      },
    })
    .then(function (response) {
      var result = response.result || {};
      if (!result.success) {
        throw new Error(result.message || "云函数调用失败");
      }
      return result.data;
    });

  return withTimeout(cloudPromise, CLOUD_TIMEOUT);
}

function uploadMealImage(filePath) {
  if (!filePath) {
    return Promise.resolve("");
  }

  if (!wx.cloud) {
    return Promise.reject(new Error("当前基础库未启用云能力"));
  }

  var extension = (filePath.match(/\.[a-zA-Z0-9]+$/) || [""])[0] || ".jpg";
  var uploadPromise = wx.cloud
    .uploadFile({
      cloudPath: "meal-images/" + Date.now() + "_" + Math.random().toString(36).slice(2, 8) + extension,
      filePath: filePath,
    })
    .then(function (result) { return result.fileID || ""; });

  return withTimeout(uploadPromise, CLOUD_TIMEOUT);
}

module.exports = {
  initUser: function (publicProfile) {
    return callDietData("initUser", {
      publicProfile: publicProfile || {},
    });
  },
  saveOnboarding: function (profile, settings) {
    return callDietData("saveOnboarding", { profile: profile, settings: settings });
  },
  getDashboard: function () {
    return callDietData("getDashboard");
  },
  getTrend: function () {
    return callDietData("getTrend");
  },
  getProfile: function () {
    return callDietData("getProfile");
  },
  updateProfile: function (profile, settings) {
    return callDietData("updateProfile", { profile: profile, settings: settings });
  },
  createMealRecord: function (meal, imagePath) {
    if (imagePath) {
      return uploadMealImage(imagePath).then(function (imageFileId) {
        return callDietData("createMealRecord", {
          meal: Object.assign({}, meal, { imageFileId: imageFileId }),
        });
      });
    }
    return callDietData("createMealRecord", {
      meal: Object.assign({}, meal, { imageFileId: meal.imageFileId || "" }),
    });
  },
};
