/**
 * Dashboard Page — 今日
 * 集中展示今日目标、三大营养素额度、今日饮食记录（按餐别分类）
 */

const store = require("../../utils/store");
const layout = require("../../utils/layout");

// ── Constants ──────────────────────────────────────

// ── Micro-nutrient Demo Data ─────────────────────

const MICRO_INDICATORS = [
  { name: "维C", status: "good" },
  { name: "钙", status: "good" },
  { name: "锌", status: "bad" },
  { name: "膳食纤维", status: "warn" },
  { name: "Omega-3", status: "warn" },
];

const MICRO_DETAILS = [
  { name: "维生素 C", status: "good", statusText: "充足", advice: "今日维C摄入达标，继续保持多吃新鲜水果和蔬菜。" },
  { name: "钙", status: "good", statusText: "充足", advice: "钙摄入良好，可维持每日一杯牛奶或酸奶的习惯。" },
  { name: "锌", status: "bad", statusText: "不足", advice: "锌摄入不足，建议补充红肉、牡蛎、坚果等富锌食物。" },
  { name: "膳食纤维", status: "warn", statusText: "偏低", advice: "膳食纤维接近达标，可多吃全谷物、豆类和绿叶蔬菜。" },
  { name: "Omega-3", status: "warn", statusText: "偏低", advice: "Omega-3摄入接近目标，建议每周吃 2-3 次深海鱼或亚麻籽。" },
];

// ── Today Meals Demo Data ────────────────────────

const DEMO_MEALS = {
  breakfast: [
    { id: "b1", name: "全麦吐司", tags: ["高纤维"], protein: 8, carbs: 32, fat: 3, calories: 185 },
    { id: "b2", name: "水煮蛋", tags: ["高蛋白", "低脂"], protein: 12, carbs: 1, fat: 10, calories: 140 },
  ],
  lunch: [
    { id: "l1", name: "香煎鸡胸肉", tags: ["高蛋白", "低脂"], protein: 31, carbs: 2, fat: 5, calories: 175 },
    { id: "l2", name: "糙米饭", tags: ["高纤维"], protein: 5, carbs: 45, fat: 2, calories: 220 },
    { id: "l3", name: "西兰花", tags: ["清淡"], protein: 3, carbs: 7, fat: 0, calories: 40 },
  ],
  dinner: [],
};

/** 模拟识别结果（demo 用，后续替换为真实 AI 接口返回） */
const DEMO_RECOGNITION = [
  { name: "清蒸鲈鱼", tags: ["高蛋白", "低脂"], protein: 28, carbs: 0, fat: 5, calories: 155 },
  { name: "蒜蓉生菜", tags: ["清淡"], protein: 2, carbs: 3, fat: 1, calories: 30 },
];

/** 页面初始状态 */
const INITIAL_STATE = {
  profile: null,
  goal: null,
  streakDays: 0,
  todayMeals: [],
  todaySummary: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  todayMealTypeStatus: [],
  remainingCalories: 0,
  goalHeadline: "",
  goalSubtitle: "",
  latestSuggestion: "",
  calorieProgress: 0,
  macroTargets: [],
  dailyCalorieTarget: 0,
  loading: false,
  errorText: "",
  microIndicators: MICRO_INDICATORS,
  microDetails: MICRO_DETAILS,
  microSheetVisible: false,
  meals: { breakfast: [], lunch: [], dinner: [] },
  totalMealCount: 0,
  pendingMealItems: [],
  showMealTypePicker: false,
  swipeActiveId: "",
  swipeOpenedId: "",
  swipeOffset: 0,
  deleteBtnWidth: 70,
  waterCurrent: 600,
  waterTarget: 2000,
  waterPercent: 30,
  waterBarWidth: 30,
  waterTip: "还差 1400ml，继续加油",
};

const MEAL_TYPE_LABEL = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

// ── Page ───────────────────────────────────────────

Page({
  data: {
    ...INITIAL_STATE,
    pageTopInset: layout.getPageTopInset(),
  },

  _refreshToken: 0,
  _demoMealsLoaded: false,
  _capturing: false,

  // ── Touch tracking (instance, not data) ─────
  _touchStartX: 0,
  _touchStartY: 0,
  _touchMoving: false,
  _touchLastOffset: 0,

  // ── Lifecycle ────────────────────────────────────

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) tabBar.setData({ selected: 0 });

    // 异步鉴权不阻塞主流程
    store.ensurePageAccess().then((access) => {
      if (access.redirectTo) {
        const method = access.redirectTo === "/pages/index/index" ? "reLaunch" : "redirectTo";
        wx[method]({ url: access.redirectTo });
      }
    }).catch(() => {
      // 鉴权失败不阻塞页面
    });

    // 首次加载 demo 数据，后续不再重置（保护用户已添加的菜品）
    if (!this._demoMealsLoaded) {
      this._loadDemoMeals();
      this._demoMealsLoaded = true;
    }

    // 计算删除按钮实际 px 宽度（仅首次）
    if (!this._deleteBtnCalculated) {
      this._calcDeleteBtnWidth();
      this._deleteBtnCalculated = true;
    }

    // 后台数据刷新（不设 loading，静默更新）
    this._refreshInBackground();

    // 检查 tabBar "+" 按钮传入的图片路径或识别结果
    this._checkPending();
  },

  /**
   * 计算删除按钮 px 宽度，使用新 API
   */
  _calcDeleteBtnWidth() {
    try {
      const winInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const rpxRatio = (winInfo.windowWidth || 375) / 750;
      const btnWidth = Math.ceil(140 * rpxRatio);
      this.setData({ deleteBtnWidth: btnWidth });
    } catch (e) {
      console.warn("[Dashboard] 计算删除按钮宽度失败，使用默认值:", e);
    }
  },

  /**
   * 后台静默刷新 store 数据，不阻塞 UI
   */
  _refreshInBackground() {
    const token = ++this._refreshToken;
    store.buildDashboardViewModel().then((viewModel) => {
      if (token !== this._refreshToken) return;
      this.setData({ ...viewModel, loading: false, errorText: "" });
    }).catch((error) => {
      if (token !== this._refreshToken) return;
      console.warn("[Dashboard] 后台刷新失败:", error);
    });
  },

  // ── Pending Check (统一入口) ────────────────────

  /**
   * 检查 globalData 中 tabBar + 传入的数据：
   * - pendingImagePath: tabBar 拍完照传来的图片路径，需要走识别
   * - pendingMealItems: 已识别完的菜品列表，直接弹餐别选择
   */
  _checkPending() {
    const globalData = getApp().globalData;

    // 优先级 1：有待识别的图片路径
    if (globalData.pendingImagePath) {
      const imagePath = globalData.pendingImagePath;
      globalData.pendingImagePath = "";
      console.log("[Dashboard] 检测到待识别图片，开始识别:", imagePath);
      this.startMealCaptureFlow(imagePath);
      return;
    }

    // 优先级 2：已有识别结果（兜底兼容）
    if (globalData.pendingMealItems && globalData.pendingMealItems.length > 0) {
      const items = globalData.pendingMealItems;
      globalData.pendingMealItems = [];
      console.log("[Dashboard] 检测到待归类的识别结果，弹出餐别选择");
      this.setData({
        pendingMealItems: items,
        showMealTypePicker: true,
      });
    }
  },

  // ── Demo Data ─────────────────────────────────

  _loadDemoMeals() {
    const meals = JSON.parse(JSON.stringify(DEMO_MEALS));
    const count = meals.breakfast.length + meals.lunch.length + meals.dinner.length;
    this.setData({ meals, totalMealCount: count, swipeOpenedId: "", swipeActiveId: "", swipeOffset: 0 });
  },

  _recalcMealCount() {
    const { meals } = this.data;
    const count = meals.breakfast.length + meals.lunch.length + meals.dinner.length;
    this.setData({ totalMealCount: count });
  },

  // ── Unified Capture Flow ─────────────────────

  /**
   * 统一入口：图片路径 → AI 识别 → 弹出餐别选择
   * - 点"记录新的一餐"调用此方法
   * - tabBar "+" 拍完照跳回后也走此方法
   *
   * @param {string} imagePath - 已获取到的图片临时路径
   */
  startMealCaptureFlow(imagePath) {
    if (!imagePath) {
      console.warn("[Dashboard] startMealCaptureFlow 收到空路径，忽略");
      return;
    }

    // 防重复：识别进行中时忽略再次调用
    if (this._capturing) {
      console.log("[Dashboard] 识别流程进行中，忽略重复调用");
      return;
    }
    this._capturing = true;

    console.log("[Dashboard] 开始识别流程，图片:", imagePath);
    this._recognizeFood(imagePath);
  },

  /**
   * "记录新的一餐"按钮：选图/拍照 → 统一入口
   */
  goRecord() {
    if (this._capturing) {
      console.log("[Dashboard] 识别流程进行中，忽略重复点击");
      return;
    }
    this._capturing = true;

    console.log("[Dashboard] 用户点击「记录新的一餐」，弹出选图");

    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;
        console.log("[Dashboard] 选图成功:", tempPath);
        this._recognizeFood(tempPath);
      },
      fail: (err) => {
        console.log("[Dashboard] 选图取消或失败:", err.errMsg || err);
        this._capturing = false;
      },
    });
  },

  /**
   * 调用 AI 识别食物
   * @param {string} imagePath - 图片临时路径
   */
  _recognizeFood(imagePath) {
    wx.showLoading({ title: "识别中…", mask: true });
    console.log("[Dashboard] 调用识别接口，图片:", imagePath);

    // TODO: 替换为真实 AI 识别接口，例如：
    // wx.cloud.callFunction({ name: 'recognizeFood', data: { imagePath } })

    // ── 模拟识别（带超时保护的 setTimeout） ──
    const RECOGNIZE_TIMEOUT = 15000; // 15s 超时保护
    const DEMO_DELAY = 1200;

    let timer = setTimeout(() => {
      this._onRecognizeSuccess(imagePath);
    }, DEMO_DELAY);

    // 超时保护
    let timeoutGuard = setTimeout(() => {
      console.error("[Dashboard] 识别超时（" + RECOGNIZE_TIMEOUT + "ms）");
      clearTimeout(timer);
      wx.hideLoading();
      this._capturing = false;
      wx.showToast({ title: "识别超时，请重试", icon: "none" });
    }, RECOGNIZE_TIMEOUT);

    // 清理超时守卫（识别正常完成后）
    this._clearTimeoutGuard = () => {
      clearTimeout(timeoutGuard);
      clearTimeout(timer);
      this._clearTimeoutGuard = null;
    };
  },

  /**
   * 识别成功处理
   */
  _onRecognizeSuccess(_imagePath) {
    if (this._clearTimeoutGuard) {
      this._clearTimeoutGuard();
    }
    wx.hideLoading();

    try {
      const items = DEMO_RECOGNITION.map((item, i) => ({
        ...item,
        id: "r_" + Date.now() + "_" + i,
      }));

      console.log("[Dashboard] 识别成功，结果:", items.map(i => i.name).join(", "));
      console.log("[Dashboard] 弹出餐别选择器");

      this.setData({
        pendingMealItems: items,
        showMealTypePicker: true,
      });
    } catch (err) {
      console.error("[Dashboard] 处理识别结果异常:", err);
      wx.showToast({ title: "识别失败，请重试", icon: "none" });
    } finally {
      this._capturing = false;
    }
  },

  // ── Meal Type Picker ────────────────────────────

  confirmMealType(e) {
    const mealType = e.currentTarget.dataset.type;
    const { pendingMealItems, meals } = this.data;

    const key = "meals." + mealType;
    this.setData({
      [key]: meals[mealType].concat(pendingMealItems),
      pendingMealItems: [],
      showMealTypePicker: false,
    });

    this._recalcMealCount();
    this._recalcSummary();
    console.log("[Dashboard] 已添加到" + MEAL_TYPE_LABEL[mealType]);
    wx.showToast({ title: "已添加到" + MEAL_TYPE_LABEL[mealType], icon: "success" });
  },

  hideMealTypePicker() {
    this.setData({ showMealTypePicker: false, pendingMealItems: [] });
  },

  /**
   * 重新汇总营养数据
   */
  _recalcSummary() {
    const { meals } = this.data;
    let addCal = 0, addP = 0, addC = 0, addF = 0;
    for (const type of ["breakfast", "lunch", "dinner"]) {
      for (const f of meals[type]) {
        addCal += f.calories;
        addP += f.protein;
        addC += f.carbs;
        addF += f.fat;
      }
    }
    this.setData({
      "todaySummary.calories": addCal,
      "todaySummary.protein": addP,
      "todaySummary.carbs": addC,
      "todaySummary.fat": addF,
    });
  },

  // ── Micro-nutrient Sheet ──────────────────────

  showMicroDetails() {
    this.setData({ microSheetVisible: true });
  },

  hideMicroDetails() {
    this.setData({ microSheetVisible: false });
  },

  stopPropagation() {},

  // ── Swipe-to-Delete ────────────────────────

  onSwipeTouchStart(e) {
    const id = e.currentTarget.dataset.id;
    this._touchStartX = e.touches[0].clientX;
    this._touchStartY = e.touches[0].clientY;
    this._touchMoving = false;
    this._touchLastOffset = 0;

    const { swipeOpenedId } = this.data;
    if (swipeOpenedId && swipeOpenedId !== id) {
      this.setData({ swipeOpenedId: "" });
    }

    this.setData({ swipeActiveId: id, swipeOffset: 0 });
  },

  onSwipeTouchMove(e) {
    if (!this._touchMoving) {
      const dx = e.touches[0].clientX - this._touchStartX;
      const dy = e.touches[0].clientY - this._touchStartY;
      if (Math.abs(dx) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) return;
      this._touchMoving = true;
    }
    if (!this._touchMoving) return;

    const dx = e.touches[0].clientX - this._touchStartX;
    const { swipeOpenedId, swipeActiveId, deleteBtnWidth } = this.data;
    const base = (swipeOpenedId === swipeActiveId) ? -deleteBtnWidth : 0;
    let offset = base + dx;
    if (offset > 0) offset = 0;
    if (offset < -deleteBtnWidth) offset = -deleteBtnWidth;

    if (Math.abs(offset - this._touchLastOffset) > 1) {
      this._touchLastOffset = offset;
      this.setData({ swipeOffset: offset });
    }
  },

  onSwipeTouchEnd(e) {
    if (!this._touchMoving) {
      if (this.data.swipeOpenedId) {
        this.setData({ swipeOpenedId: "", swipeActiveId: "", swipeOffset: 0 });
      } else {
        this.setData({ swipeActiveId: "", swipeOffset: 0 });
      }
      return;
    }

    const dx = e.changedTouches[0].clientX - this._touchStartX;
    const { swipeOpenedId, swipeActiveId, deleteBtnWidth } = this.data;
    const base = (swipeOpenedId === swipeActiveId) ? -deleteBtnWidth : 0;
    const endOffset = base + dx;

    if (endOffset < -35) {
      this.setData({
        swipeOpenedId: swipeActiveId,
        swipeActiveId: "",
        swipeOffset: 0,
      });
    } else {
      this.setData({
        swipeOpenedId: "",
        swipeActiveId: "",
        swipeOffset: 0,
      });
    }

    this._touchMoving = false;
    this._touchLastOffset = 0;
  },

  closeSwipe() {
    const { swipeOpenedId } = this.data;
    if (swipeOpenedId) {
      this.setData({ swipeOpenedId: "", swipeActiveId: "", swipeOffset: 0 });
    }
  },

  deleteFood(e) {
    const mealType = e.currentTarget.dataset.mealType;
    const foodId = e.currentTarget.dataset.foodId;
    const { meals } = this.data;

    const filtered = meals[mealType].filter(f => f.id !== foodId);

    this.setData({
      ["meals." + mealType]: filtered,
      swipeOpenedId: "",
      swipeActiveId: "",
      swipeOffset: 0,
    });

    this._recalcMealCount();
    this._recalcSummary();
    wx.showToast({ title: "已删除", icon: "none" });
  },

  handleDrinkWater() {
    var next = this.data.waterCurrent + 250;
    var target = this.data.waterTarget;
    var pct = Math.round(next / target * 100);
    if (pct > 100) { pct = 100; }
    var bar = pct;
    var remaining = target - next;
    var tip = "";
    if (remaining <= 0) {
      tip = "已完成今日饮水目标！";
    } else {
      tip = "还差 " + remaining + "ml，继续加油";
    }
    this.setData({
      waterCurrent: next,
      waterPercent: pct,
      waterBarWidth: bar,
      waterTip: tip,
    });
  },
});
