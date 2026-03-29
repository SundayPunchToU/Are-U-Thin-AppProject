/**
 * Stats Page — 记录（数据趋势）
 * 合并概览 + 热量趋势为统一模块，体重/体脂率折线图支持切换
 */

const store = require("../../utils/store");
const layout = require("../../utils/layout");

// ── Constants ──────────────────────────────────────

const ROUTES = {
  dashboard: "/pages/dashboard/index",
};

const TIME_RANGES = [
  { value: "week", label: "本周" },
  { value: "month", label: "本月" },
  { value: "year", label: "本年" },
];

const WEIGHT_METRICS = [
  { value: "weight", label: "体重" },
  { value: "bodyfat", label: "体脂率" },
];

const INITIAL_STATE = {
  streakDays: 0,
  calorieTrend: [],
  averageCalories: 0,
  dailyCalorieTarget: 0,
  calorieDeviation: 0,
  recordingRate: "0/7",
  insight: "",
  hasTrendData: false,
  timeRange: "week",
  weightTrend: [],
  latestWeight: 0,
  hasWeightData: false,
  showWeightInput: false,
  weightInput: "",
  weightError: "",
  weightMetric: "weight",
  showCaloriePicker: false,
  showWeightPicker: false,
  loading: false,
  errorText: "",
};

// ── Page ───────────────────────────────────────────

Page({
  data: {
    ...INITIAL_STATE,
    timeRangeOptions: TIME_RANGES,
    weightMetricOptions: WEIGHT_METRICS,
    pageTopInset: layout.getPageTopInset(),
  },

  _refreshToken: 0,

  // ── Lifecycle ────────────────────────────────────

  async onShow() {
    const access = await store.ensurePageAccess();
    if (access.redirectTo) {
      const method = access.redirectTo === "/pages/index/index" ? "reLaunch" : "redirectTo";
      wx[method]({ url: access.redirectTo });
      return;
    }

    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) tabBar.setData({ selected: 1 });

    this.refreshData();
  },

  onReady() {
    this._drawWeightChartQueued = false;
  },

  // ── Data ─────────────────────────────────────────

  async refreshData() {
    const token = ++this._refreshToken;
    const range = this.data.timeRange;

    this.setData({ loading: true, errorText: "" });

    try {
      const viewModel = await store.buildStatsViewModel(range);
      if (token !== this._refreshToken) return;
      this.setData({ ...viewModel, loading: false });
      this._scheduleWeightChart();
    } catch (error) {
      if (token !== this._refreshToken) return;
      this.setData({
        loading: false,
        errorText: (error && error.message) || "读取趋势数据失败，请稍后重试。",
      });
    }
  },

  // ── Calorie Range Picker ─────────────────────────

  toggleCaloriePicker() {
    this.setData({ showCaloriePicker: !this.data.showCaloriePicker, showWeightPicker: false });
  },

  selectTimeRange(e) {
    const range = e.currentTarget.dataset.value;
    if (range === this.data.timeRange) { this.setData({ showCaloriePicker: false }); return; }
    this.setData({ timeRange: range, showCaloriePicker: false });
    this.refreshData();
  },

  // ── Weight Metric Picker ─────────────────────────

  toggleWeightPicker() {
    this.setData({ showWeightPicker: !this.data.showWeightPicker, showCaloriePicker: false });
  },

  selectWeightMetric(e) {
    const metric = e.currentTarget.dataset.value;
    this.setData({ weightMetric: metric, showWeightPicker: false });
    this._scheduleWeightChart();
  },

  // ── Weight Input ─────────────────────────────────

  toggleWeightInput() {
    this.setData({ showWeightInput: !this.data.showWeightInput, weightInput: "", weightError: "" });
  },

  handleWeightInput(e) {
    this.setData({ weightInput: e.detail.value, weightError: "" });
  },

  handleSaveWeight() {
    const val = parseFloat(this.data.weightInput);
    if (isNaN(val) || val <= 20 || val > 300) {
      this.setData({ weightError: "请输入有效的体重数值（20-300 kg）" });
      return;
    }
    if (!store.saveWeightRecord(val)) {
      this.setData({ weightError: "保存失败，请重试" });
      return;
    }
    this.setData({ showWeightInput: false, weightInput: "", weightError: "" });
    this.refreshData();
  },

  // ── Canvas Weight Chart ──────────────────────────

  _scheduleWeightChart() {
    if (this._drawWeightChartQueued) return;
    this._drawWeightChartQueued = true;
    setTimeout(() => {
      this._drawWeightChartQueued = false;
      this._drawWeightChart();
    }, 300);
  },

  _drawWeightChart() {
    const data = this.data.weightTrend;
    if (!data || data.length < 1) return;

    const isBodyFat = this.data.weightMetric === "bodyfat";
    const key = isBodyFat ? "bodyFat" : "weight";
    const unit = isBodyFat ? "%" : "kg";

    const query = wx.createSelectorQuery().in(this);
    query
      .select(".weight-canvas-wrap")
      .fields({ size: true })
      .exec((wrapRes) => {
        if (!wrapRes || !wrapRes[0] || wrapRes[0].width < 10 || wrapRes[0].height < 10) return;

        const wrapW = wrapRes[0].width;
        const wrapH = wrapRes[0].height;

        const q2 = wx.createSelectorQuery().in(this);
        q2
          .select("#weightCanvas")
          .fields({ node: true })
          .exec((res) => {
            if (!res || !res[0] || !res[0].node) return;

            const canvas = res[0].node;
            const ctx = canvas.getContext("2d");
            const dpr = wx.getSystemInfoSync().pixelRatio;

            canvas.width = wrapW * dpr;
            canvas.height = wrapH * dpr;
            canvas.style.width = wrapW + "px";
            canvas.style.height = wrapH + "px";
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, wrapW, wrapH);

            var W = wrapW, H = wrapH;

            var values = data.map(function (d) { return d[key] || d.weight; }).filter(function (v) { return v > 0; });
            if (values.length < 1) return;

            if (values.length === 1) {
              var sx = W / 2, sy = H / 2;
              ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fillStyle = "#FA725D"; ctx.fill();
              ctx.fillStyle = "#737988"; ctx.font = "12px sans-serif"; ctx.textAlign = "center";
              ctx.fillText(values[0] + " " + unit, sx, sy + 22);
              return;
            }

            var pad = { top: 28, right: 20, bottom: 32, left: 52 };
            var plotW = W - pad.left - pad.right;
            var plotH = H - pad.top - pad.bottom;

            var minV = Math.floor(Math.min.apply(null, values)) - 0.5;
            var maxV = Math.ceil(Math.max.apply(null, values)) + 0.5;
            if (isBodyFat) { minV = Math.max(0, minV); maxV = Math.min(60, maxV + 1); }
            var vRange = Math.max(maxV - minV, 1);

            var toX = function (i) { return pad.left + (i / Math.max(values.length - 1, 1)) * plotW; };
            var toY = function (v) { return pad.top + (1 - (v - minV) / vRange) * plotH; };

            ctx.strokeStyle = "rgba(116,120,132,0.08)"; ctx.lineWidth = 1;
            for (var g = 0; g <= 4; g++) {
              var gy = pad.top + (g / 4) * plotH;
              ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(W - pad.right, gy); ctx.stroke();
              ctx.fillStyle = "#98a0ad"; ctx.font = "10px sans-serif"; ctx.textAlign = "right";
              ctx.fillText((maxV - (g / 4) * vRange).toFixed(1), pad.left - 8, gy + 3);
            }

            ctx.beginPath();
            ctx.moveTo(toX(0), toY(values[0]));
            values.forEach(function (v, i) { ctx.lineTo(toX(i), toY(v)); });
            ctx.lineTo(toX(values.length - 1), pad.top + plotH);
            ctx.lineTo(toX(0), pad.top + plotH);
            ctx.closePath();
            var grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
            grad.addColorStop(0, "rgba(250,114,93,0.18)");
            grad.addColorStop(1, "rgba(250,114,93,0.01)");
            ctx.fillStyle = grad; ctx.fill();

            ctx.beginPath(); ctx.strokeStyle = "#FA725D"; ctx.lineWidth = 2;
            ctx.lineJoin = "round"; ctx.lineCap = "round";
            values.forEach(function (v, i) {
              if (i === 0) ctx.moveTo(toX(i), toY(v));
              else ctx.lineTo(toX(i), toY(v));
            });
            ctx.stroke();

            var maxLabels = 7;
            var step = Math.max(1, Math.ceil(values.length / maxLabels));
            values.forEach(function (v, i) {
              var dx = toX(i), dy = toY(v);
              ctx.beginPath(); ctx.arc(dx, dy, 4, 0, Math.PI * 2); ctx.fillStyle = "#FA725D"; ctx.fill();
              ctx.beginPath(); ctx.arc(dx, dy, 1.5, 0, Math.PI * 2); ctx.fillStyle = "#ffffff"; ctx.fill();
              if (i % step === 0 || i === values.length - 1) {
                ctx.fillStyle = "#98a0ad"; ctx.font = "10px sans-serif"; ctx.textAlign = "center";
                ctx.fillText(data[i] ? data[i].label : "", dx, H - 8);
                ctx.fillStyle = "#737988";
                ctx.fillText(isBodyFat ? v.toFixed(1) : v + "", dx, dy - 10);
              }
            });
          });
      });
  },

  // ── Navigation ───────────────────────────────────

  goRecord() {
    wx.switchTab({ url: ROUTES.dashboard });
  },
});
