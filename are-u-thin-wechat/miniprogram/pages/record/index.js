const store = require("../../utils/store");
const layout = require("../../utils/layout");
const aiService = require("../../utils/ai-service");

const loadingHints = ["AI 正在分析餐食...", "正在识别食物成分...", "正在计算营养成分...", "正在生成个性化建议..."];

function getMealTypeLabel(value, options) {
  const matched = (options || []).find((item) => item.value === value);
  return (matched && matched.label) || "这餐";
}

Page({
  data: {
    imagePath: "",
    voiceNote: "",
    quickTags: ["少油", "外卖", "训练后", "加餐"],
    mealTypeOptions: store.MEAL_TYPE_OPTIONS || [],
    selectedMealType: store.inferMealType(Date.now()),
    selectedMealTypeLabel: getMealTypeLabel(store.inferMealType(Date.now()), store.MEAL_TYPE_OPTIONS || []),
    currentStep: 1,
    isLoading: false,
    isSaving: false,
    progressText: "",
    errorText: "",
    previewResult: null,
    todayMeals: [],
    pageTopInset: layout.getPageTopInset(),
    useAI: true,
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

    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: 1 });
    }

    this.refreshData();
  },

  async refreshData() {
    const dashboard = await store.buildDashboardViewModel();
    const selectedMealType = this.data.selectedMealType || store.inferMealType(Date.now());
    this.setData({
      todayMeals: dashboard.todayMeals.slice(0, 4),
      selectedMealType,
      selectedMealTypeLabel: getMealTypeLabel(selectedMealType, this.data.mealTypeOptions),
    });
  },

  resetPreview(nextState) {
    this.setData({
      previewResult: null,
      progressText: "",
      errorText: "",
      ...nextState,
    });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const file = (res.tempFiles || [])[0];
        this.resetPreview({ imagePath: file ? file.tempFilePath : "", currentStep: file ? 2 : 1 });
      },
    });
  },

  handleVoiceInput(event) {
    const voiceNote = event.detail.value;
    this.resetPreview({ voiceNote, currentStep: this.data.imagePath ? 2 : 1 });
  },

  applyTag(event) {
    const { tag } = event.currentTarget.dataset;
    const nextText = this.data.voiceNote ? `${this.data.voiceNote} #${tag}` : `#${tag}`;
    this.resetPreview({ voiceNote: nextText, currentStep: this.data.imagePath ? 2 : 1 });
  },

  handleMealTypeSelect(event) {
    const { value } = event.currentTarget.dataset;
    if (!value || value === this.data.selectedMealType) {
      return;
    }
    this.resetPreview({
      selectedMealType: value,
      selectedMealTypeLabel: getMealTypeLabel(value, this.data.mealTypeOptions),
    });
  },

  async analyzePreview() {
    const voiceNote = (this.data.voiceNote || "").trim();
    if (!voiceNote || this.data.isLoading) {
      return;
    }

    this.setData({
      isLoading: true,
      progressText: loadingHints[Math.floor(Math.random() * loadingHints.length)],
      errorText: "",
    });

    try {
      // 获取用户上下文
      const context = store.buildCoachRequestContext();
      
      // 调用 AI 分析
      const result = await aiService.analyzeMealWithAI({
        imagePath: this.data.imagePath,
        voiceNote: voiceNote,
        mealType: this.data.selectedMealType,
        context: context,
      });

      this.setData({
        previewResult: {
          ...result,
          mealType: this.data.selectedMealType,
          mealTypeLabel: this.data.selectedMealTypeLabel,
        },
        currentStep: 3,
        isLoading: false,
        progressText: result.needsMoreInfo ? "AI 建议补充更多信息" : "AI 分析完成，确认后会保存到今日。",
      });
    } catch (error) {
      console.error("[record] AI analysis failed, fallback to local:", error);
      
      // 降级到本地分析
      const result = store.analyzeMealPreview(this.data.imagePath, voiceNote);
      this.setData({
        previewResult: {
          ...result,
          mealType: this.data.selectedMealType,
          mealTypeLabel: this.data.selectedMealTypeLabel,
        },
        currentStep: 3,
        isLoading: false,
        progressText: "AI 暂时不可用，已使用本地分析。",
        errorText: "提示：当前使用本地估算，AI 服务暂时不可用",
      });
    }
  },

  async saveMeal() {
    const result = this.data.previewResult;
    if (!result || result.needsMoreInfo || this.data.isSaving) {
      return;
    }

    this.setData({
      isSaving: true,
      progressText: "正在上传并保存到云端...",
      errorText: "",
    });

    try {
      await store.saveAnalyzedMeal(result, this.data.voiceNote.trim(), this.data.imagePath, this.data.selectedMealType);
      const nextMealType = store.inferMealType(Date.now());
      this.setData({
        imagePath: "",
        voiceNote: "",
        previewResult: null,
        currentStep: 1,
        selectedMealType: nextMealType,
        selectedMealTypeLabel: getMealTypeLabel(nextMealType, this.data.mealTypeOptions),
        progressText: "已保存到今日看板",
        errorText: "",
      });
      await this.refreshData();
      wx.switchTab({ url: "/pages/dashboard/index" });
    } catch (error) {
      this.setData({
        errorText: (error && error.message) || "保存失败，请稍后再试。",
        progressText: "",
      });
    } finally {
      this.setData({
        isSaving: false,
      });
    }
  },
});
