const appData = require("./app-data-v2");
const cloudService = require("./cloud-service");

const STORAGE_KEYS = {
  profile: "are_u_thin_profile",
  mealLogs: "are_u_thin_meal_logs",
  latestSuggestion: "are_u_thin_latest_suggestion",
  lastAnalysis: "are_u_thin_last_analysis",
  coachMessages: "are_u_thin_coach_messages",
  settings: "are_u_thin_settings",
  user: "are_u_thin_user",
  identityReady: "are_u_thin_identity_ready",
  pendingPublicProfile: "are_u_thin_pending_public_profile",
  weightLogs: "are_u_thin_weight_logs",
};
const read = (key, fallback) => { try { const value = wx.getStorageSync(key); return value === "" || value === undefined ? fallback : value; } catch (error) { return fallback; } };
const write = (key, value) => { wx.setStorageSync(key, value); };
const getProfile = () => read(STORAGE_KEYS.profile, null);
const saveProfile = (profile) => write(STORAGE_KEYS.profile, profile);
const getMealLogs = () => read(STORAGE_KEYS.mealLogs, []);
const saveMealLogs = (logs) => write(STORAGE_KEYS.mealLogs, logs);
const getLatestSuggestion = () => read(STORAGE_KEYS.latestSuggestion, appData.getDefaultLatestSuggestion());
const saveLatestSuggestion = (text) => write(STORAGE_KEYS.latestSuggestion, text);
const getLastAnalysis = () => read(STORAGE_KEYS.lastAnalysis, null);
const saveLastAnalysis = (result) => write(STORAGE_KEYS.lastAnalysis, result);
const getCoachMessages = () => read(STORAGE_KEYS.coachMessages, appData.getDefaultCoachMessages());
const saveCoachMessages = (messages) => write(STORAGE_KEYS.coachMessages, messages);
const getSettings = () => read(STORAGE_KEYS.settings, appData.DEFAULT_SETTINGS);
const getUser = () => read(STORAGE_KEYS.user, null);
const saveUser = (user) => write(STORAGE_KEYS.user, user);
const hasIdentitySession = () => !!read(STORAGE_KEYS.identityReady, false);
const saveIdentitySession = (value) => write(STORAGE_KEYS.identityReady, !!value);
const getPendingPublicProfile = () => read(STORAGE_KEYS.pendingPublicProfile, null);
const savePendingPublicProfile = (profile) => write(STORAGE_KEYS.pendingPublicProfile, profile || null);
const getWeightLogs = () => read(STORAGE_KEYS.weightLogs, []);
const saveWeightLogs = (logs) => write(STORAGE_KEYS.weightLogs, logs);
const canUseCloud = () => typeof wx !== "undefined" && !!wx.cloud;
const MEAL_TYPE_OPTIONS = [
  { value: "breakfast", label: "早餐", shortLabel: "早" },
  { value: "lunch", label: "午餐", shortLabel: "午" },
  { value: "dinner", label: "晚餐", shortLabel: "晚" },
  { value: "snack", label: "加餐", shortLabel: "加" },
];
const emptyMealTypeCounts = () => ({ breakfast: 0, lunch: 0, dinner: 0, snack: 0 });
const inferMealType = (timestamp) => {
  const date = new Date(Number(timestamp || Date.now()));
  const hour = date.getHours();
  if (hour >= 5 && hour < 10) return "breakfast";
  if (hour >= 10 && hour < 15) return "lunch";
  if (hour >= 15 && hour < 21) return "dinner";
  return "snack";
};
const normalizeMealType = (mealType, timestamp) => (MEAL_TYPE_OPTIONS.some((item) => item.value === mealType) ? mealType : inferMealType(timestamp));
const getMealTypeMeta = (mealType, timestamp) => {
  const value = normalizeMealType(mealType, timestamp);
  return MEAL_TYPE_OPTIONS.find((item) => item.value === value) || MEAL_TYPE_OPTIONS[0];
};
const buildMealTypeCounts = (meals) => (meals || []).reduce((acc, item) => {
  const type = normalizeMealType(item.mealType, item.timestamp || item.eatenAt);
  acc[type] = Number(acc[type] || 0) + 1;
  return acc;
}, emptyMealTypeCounts());
const normalizeSummary = (summary, meals) => {
  const fallbackCounts = meals ? buildMealTypeCounts(meals) : emptyMealTypeCounts();
  const mealTypeCounts = { ...fallbackCounts, ...((summary && summary.mealTypeCounts) || {}) };
  const mealCount = Number((summary && summary.mealCount) || (meals && meals.length) || 0);
  return {
    calories: Number(summary && summary.calories) || 0,
    protein: Number(summary && summary.protein) || 0,
    carbs: Number(summary && summary.carbs) || 0,
    fat: Number(summary && summary.fat) || 0,
    mealCount,
    mealTypeCounts,
    hasBreakfast: !!((summary && summary.hasBreakfast) || mealTypeCounts.breakfast),
    hasLunch: !!((summary && summary.hasLunch) || mealTypeCounts.lunch),
    hasDinner: !!((summary && summary.hasDinner) || mealTypeCounts.dinner),
    hasSnack: !!((summary && summary.hasSnack) || mealTypeCounts.snack),
  };
};
const buildMealTypeStatus = (summary) => {
  const mealTypeCounts = { ...emptyMealTypeCounts(), ...((summary && summary.mealTypeCounts) || {}) };
  return MEAL_TYPE_OPTIONS.map((item) => ({ ...item, count: Number(mealTypeCounts[item.value] || 0), recorded: Number(mealTypeCounts[item.value] || 0) > 0 }));
};
const mapCloudMeal = (item) => {
  const timestamp = Number(item.eatenAt || item.timestamp || Date.now());
  const mealTypeMeta = getMealTypeMeta(item.mealType, timestamp);
  return { id: item._id || item.id || `${timestamp}`, timestamp, name: item.name || item.guessedMealName || "已记录餐食", note: item.note || "", imagePath: item.imageFileId || item.imagePath || "", imageFileId: item.imageFileId || "", nutrition: item.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 }, scoreTitle: item.scoreTitle || "", suggestion: item.suggestion || "", mealType: mealTypeMeta.value, mealTypeLabel: mealTypeMeta.label, mealTypeShortLabel: mealTypeMeta.shortLabel };
};

function normalizePublicProfile(profile) {
  const safe = profile || {};
  return {
    nickname: typeof safe.nickname === "string" && safe.nickname.trim() ? safe.nickname.trim() : "微信用户",
    avatarUrl: typeof safe.avatarUrl === "string" ? safe.avatarUrl : "",
  };
}

function persistSettings(settings) { const next = { ...appData.DEFAULT_SETTINGS, ...settings }; write(STORAGE_KEYS.settings, next); return next; }
function cacheBundle(bundle) {
  if (!bundle) return;
  if (bundle.profile) { saveProfile(bundle.profile); if (bundle.profile.settings) persistSettings(bundle.profile.settings); }
  if (bundle.latestSuggestion !== undefined) saveLatestSuggestion(bundle.latestSuggestion || "");
  if (Array.isArray(bundle.todayMeals)) saveMealLogs(bundle.todayMeals.map(mapCloudMeal));
}
function buildDashboardLocal() {
  const profile = getProfile() || appData.createDefaultProfile();
  const metrics = appData.buildProfileMetrics(profile);
  const mealLogs = getMealLogs();
  const todayMeals = appData.getTodayMeals(mealLogs).map(mapCloudMeal);
  const todaySummary = normalizeSummary(appData.getTodaySummary(mealLogs), todayMeals);
  const goal = appData.getGoalOption(profile.goal);
  const remainingCalories = metrics.dailyCalorieTarget - todaySummary.calories;
  return {
    profile,
    goal,
    streakDays: appData.getStreakDays(mealLogs),
    todayMeals,
    todaySummary,
    todayMealTypeStatus: buildMealTypeStatus(todaySummary),
    remainingCalories,
    goalHeadline: goal.supportiveTitle,
    goalSubtitle: goal.supportiveSubtitle,
    latestSuggestion: getLatestSuggestion(),
    calorieProgress: Math.min(100, Math.round((todaySummary.calories / Math.max(metrics.dailyCalorieTarget, 1)) * 100)),
    macroTargets: appData.buildMacroTargets(profile, todaySummary),
    dailyCalorieTarget: metrics.dailyCalorieTarget,
  };
}
function buildTrendLocal() {
  const profile = getProfile() || appData.createDefaultProfile();
  const mealLogs = getMealLogs().map(mapCloudMeal);
  const target = appData.buildProfileMetrics(profile).dailyCalorieTarget;
  const weeklyTrend = appData.buildWeeklyCalorieTrend(mealLogs, target);
  const weeklyAverageCalories = weeklyTrend.length ? Math.round(weeklyTrend.reduce((sum, item) => sum + item.calories, 0) / weeklyTrend.length) : 0;
  const todaySummary = normalizeSummary(appData.getTodaySummary(mealLogs), appData.getTodayMeals(mealLogs));
  return {
    streakDays: appData.getStreakDays(mealLogs),
    weeklyTrend,
    weeklyAverageCalories,
    weeklyInsight: appData.buildWeeklyInsight(weeklyAverageCalories, target),
    goalSubtitle: appData.getGoalOption(profile.goal).supportiveSubtitle,
    hasTrendData: weeklyTrend.some((item) => item.calories > 0),
    todayMealTypeStatus: buildMealTypeStatus(todaySummary),
  };
}
function buildProfileLocal() {
  const profile = getProfile() || appData.createDefaultProfile();
  const mealLogs = getMealLogs();
  const todayMeals = appData.getTodayMeals(mealLogs).map(mapCloudMeal);
  const todaySummary = normalizeSummary(appData.getTodaySummary(mealLogs), todayMeals);
  return { profile, goal: appData.getGoalOption(profile.goal), goalOptions: appData.GOAL_OPTIONS, metrics: appData.buildProfileMetrics(profile), streakDays: appData.getStreakDays(mealLogs), todayMeals, todaySummary, settings: getSettings() };
}
function ensureState() {
  if (!getLatestSuggestion()) saveLatestSuggestion(appData.getDefaultLatestSuggestion());
  if (!getCoachMessages().length) saveCoachMessages(appData.getDefaultCoachMessages());
  persistSettings(getSettings());
}
async function initUser() {
  if (!canUseCloud()) return getProfile();
  try {
    const data = await cloudService.initUser();
    if (data && data.user) saveUser(data.user);
    if (data && data.profile) {
      saveProfile(data.profile);
      persistSettings(data.profile.settings);
      saveIdentitySession(true);
      savePendingPublicProfile(null);
    }
    return (data && data.profile) || null;
  } catch (error) {
    console.error("[store] initUser failed", error);
    return getProfile();
  }
}
async function loginWithWechat(publicProfile) {
  const nextPublicProfile = normalizePublicProfile(publicProfile);
  if (!canUseCloud()) {
    throw new Error("当前环境未启用云开发，无法完成微信身份初始化。");
  }
  const data = await cloudService.initUser(nextPublicProfile);
  if (data && data.user) saveUser(data.user);
  saveIdentitySession(true);
  if (data && data.profile) {
    saveProfile(data.profile);
    persistSettings(data.profile.settings);
    savePendingPublicProfile(null);
  } else {
    savePendingPublicProfile(nextPublicProfile);
  }
  return {
    user: (data && data.user) || getUser(),
    profile: (data && data.profile) || null,
  };
}
async function ensurePageAccess() {
  const profile = getProfile() || (await initUser());
  const nextProfile = profile || getProfile();
  if (nextProfile) {
    return { profile: nextProfile, redirectTo: "" };
  }
  return {
    profile: null,
    redirectTo: hasIdentitySession() ? "/pages/onboarding/index" : "/pages/index/index",
  };
}
async function resolveEntryRoute() {
  const result = await ensurePageAccess();
  return result.redirectTo || "/pages/dashboard/index";
}
async function completeOnboarding(profile) {
  const nextProfileInput = {
    ...(getPendingPublicProfile() || {}),
    ...(getProfile() || {}),
    ...(profile || {}),
  };
  if (!canUseCloud()) {
    throw new Error("当前环境未启用云开发，无法保存 onboarding 档案。");
  }
  const data = await cloudService.saveOnboarding(nextProfileInput, getSettings());
  const nextProfile = (data && data.profile) || nextProfileInput;
  saveProfile(nextProfile);
  persistSettings(nextProfile.settings || getSettings());
  saveUser({ ...(getUser() || {}), nickname: nextProfile.nickname || "", avatarUrl: nextProfile.avatarUrl || "" });
  savePendingPublicProfile(null);
  saveIdentitySession(true);
  return nextProfile;
}
async function updateGoal(goal) {
  const nextProfile = { ...(getProfile() || appData.createDefaultProfile()), goal };
  saveProfile(nextProfile);
  if (canUseCloud()) {
    try {
      cacheBundle(await cloudService.updateProfile({ goal }, getSettings()));
    } catch (error) {
      console.error("[store] updateGoal sync failed", error);
    }
  }
  return getProfile() || nextProfile;
}
function analyzeMealPreview(imagePath, voiceNote) {
  const profile = getProfile() || appData.createDefaultProfile();
  const summary = appData.getTodaySummary(getMealLogs());
  const result = appData.analyzeMeal({ imagePath, voiceNote: voiceNote || "", context: { goal: profile.goal, activityFactor: profile.activityFactor, isTrainingDay: /训练/.test(voiceNote || ""), isTakeout: /外卖/.test(voiceNote || ""), lowOilTag: /少油/.test(voiceNote || ""), consumedCaloriesToday: summary.calories } });
  saveLastAnalysis(result);
  return result;
}
async function saveAnalyzedMeal(result, voiceNote, imagePath, mealType) {
  if (!canUseCloud()) {
    throw new Error("当前环境未启用云开发，无法保存饮食记录。");
  }
  const eatenAt = Date.now();
  const selectedMealType = normalizeMealType(mealType, eatenAt);
  try {
    const data = await cloudService.createMealRecord({ name: result.guessedMealName, guessedMealName: result.guessedMealName, note: voiceNote || "", nutrition: result.nutrition, scoreTitle: result.scoreTitle, identifiedFoods: result.identifiedFoods || [], confidence: result.confidence || null, warnings: result.warnings || [], notes: result.notes || [], suggestion: result.suggestion || "", eatenAt, mealType: selectedMealType }, imagePath);
    const meal = mapCloudMeal((data && data.meal) || { ...result, eatenAt, mealType: selectedMealType, note: voiceNote || "", imageFileId: imagePath || "" });
    saveMealLogs([meal, ...getMealLogs().filter((item) => item.id !== meal.id)]);
    saveLatestSuggestion((data && data.latestSuggestion) || result.suggestion || "");
    saveLastAnalysis(result);
    return meal;
  } catch (error) {
    console.error("[store] saveAnalyzedMeal failed", error);
    throw error;
  }
}
function addCoachMessage(text, fromUser) { const nextMessages = [...getCoachMessages(), { id: `${Date.now()}_${fromUser ? "u" : "b"}`, text, fromUser, date: Date.now() }]; saveCoachMessages(nextMessages); return nextMessages; }
async function buildDashboardViewModel() {
  if (canUseCloud()) {
    try {
      const data = await cloudService.getDashboard();
      if (data && data.profile) {
        cacheBundle(data);
        const profile = data.profile;
        const goal = appData.getGoalOption(profile.goal);
        const todayMeals = (data.todayMeals || []).map(mapCloudMeal);
        const todaySummary = normalizeSummary(data.todaySummary, todayMeals);
        const dailyCalorieTarget = appData.buildProfileMetrics(profile).dailyCalorieTarget;
        const remainingCalories = dailyCalorieTarget - Number(todaySummary.calories || 0);
        return { profile, goal, streakDays: Number(data.streakDays || 0), todayMeals, todaySummary, todayMealTypeStatus: buildMealTypeStatus(todaySummary), remainingCalories, goalHeadline: goal.supportiveTitle, goalSubtitle: goal.supportiveSubtitle, latestSuggestion: data.latestSuggestion || "", calorieProgress: Math.min(100, Math.round((Number(todaySummary.calories || 0) / Math.max(dailyCalorieTarget, 1)) * 100)), macroTargets: appData.buildMacroTargets(profile, todaySummary), dailyCalorieTarget };
      }
    } catch (error) {
      console.error("[store] buildDashboardViewModel cloud fallback", error);
    }
  }
  return buildDashboardLocal();
}
async function buildTrendViewModel() {
  if (canUseCloud()) {
    try {
      const data = await cloudService.getTrend();
      if (data && data.profile) {
        saveProfile(data.profile);
        persistSettings(data.profile.settings || getSettings());
        const summaries = data.dailySummaries || [];
        const logs = summaries.map((item) => ({ timestamp: new Date(`${item.dateKey}T12:00:00`).getTime(), nutrition: { calories: Number(item.calories || 0) } }));
        const target = Number(data.dailyCalorieTarget || appData.buildProfileMetrics(data.profile).dailyCalorieTarget);
        const weeklyTrend = appData.buildWeeklyCalorieTrend(logs, target);
        const weeklyAverageCalories = weeklyTrend.length ? Math.round(weeklyTrend.reduce((sum, item) => sum + item.calories, 0) / weeklyTrend.length) : 0;
        const todaySummary = normalizeSummary(data.todaySummary || summaries[summaries.length - 1]);
        return { streakDays: Number(data.streakDays || 0), weeklyTrend, weeklyAverageCalories, weeklyInsight: appData.buildWeeklyInsight(weeklyAverageCalories, target), goalSubtitle: appData.getGoalOption(data.profile.goal).supportiveSubtitle, hasTrendData: weeklyTrend.some((item) => item.calories > 0), todayMealTypeStatus: buildMealTypeStatus(todaySummary) };
      }
    } catch (error) {
      console.error("[store] buildTrendViewModel cloud fallback", error);
    }
  }
  return buildTrendLocal();
}
async function buildProfileViewModel() {
  if (canUseCloud()) {
    try {
      const data = await cloudService.getProfile();
      if (data && data.profile) {
        cacheBundle(data);
        const todayMeals = (data.todayMeals || []).map(mapCloudMeal);
        return { profile: data.profile, goal: appData.getGoalOption(data.profile.goal), goalOptions: appData.GOAL_OPTIONS, metrics: appData.buildProfileMetrics(data.profile), streakDays: Number(data.streakDays || 0), todayMeals, todaySummary: normalizeSummary(data.todaySummary, todayMeals), settings: data.profile.settings || getSettings() };
      }
    } catch (error) {
      console.error("[store] buildProfileViewModel cloud fallback", error);
    }
  }
  return buildProfileLocal();
}
async function saveSettings(settings) { const next = persistSettings(settings); if (canUseCloud() && getProfile()) { try { await cloudService.updateProfile({}, next); } catch (error) { console.error("[store] saveSettings sync failed", error); } } return next; }
function buildCoachRequestContext() { const dashboard = buildDashboardLocal(); return { profile: dashboard.profile, todaySummary: dashboard.todaySummary, latestSuggestion: dashboard.latestSuggestion, recentMeals: dashboard.todayMeals.slice(0, 3), settings: getSettings() }; }
function buildStatsViewModelLocal(range) {
  range = range || "week";
  var profile = getProfile() || appData.createDefaultProfile();
  var mealLogs = getMealLogs().map(mapCloudMeal);

  // ── DEMO DATA: 无真实数据时注入示例，方便 UI 预览 ──
  if (mealLogs.length === 0) {
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var demoCalories = [1350, 1520, 1680, 1410, 1580, 0, 0];
    var demoNames = ["酸奶燕麦碗", "鸡胸肉藜麦沙拉", "三文鱼饭+番茄牛肉意面", "全麦三明治+轻盈便当", "鸡胸沙拉+三文鱼饭", "", ""];
    var demoNotes = [
      { calories: 320, protein: 19, carbs: 42, fat: 9 },
      { calories: 405, protein: 33, carbs: 31, fat: 13 },
      { calories: 1098, protein: 64, carbs: 107, fat: 48 },
      { calories: 828, protein: 48, carbs: 86, fat: 28 },
      { calories: 945, protein: 67, carbs: 76, fat: 37 },
    ];
    var demoTimestamps = [];
    for (var di = 6; di >= 0; di--) { var dd = new Date(now); dd.setDate(dd.getDate() - di); demoTimestamps.push(dd.getTime()); }
    demoTimestamps.forEach(function (ts, idx) {
      if (demoCalories[idx] > 0) {
        mealLogs.push({ timestamp: ts, mealType: "午餐", name: demoNames[idx], note: "", nutrition: demoNotes[idx], score: "不错", aiAnalysis: "均衡的一餐" });
      }
    });
  }
  // ── END DEMO DATA ──

  var target = appData.buildProfileMetrics(profile).dailyCalorieTarget;
  var trend = appData.buildCalorieTrend(mealLogs, target, range);
  var avgCal = trend.length ? Math.round(trend.reduce(function (s, i) { return s + i.calories; }, 0) / trend.length) : 0;
  var todaySummary = normalizeSummary(appData.getTodaySummary(mealLogs), appData.getTodayMeals(mealLogs));
  var now2 = new Date(); now2.setHours(0, 0, 0, 0);
  var totalDays = range === "week" ? 7 : range === "month" ? 30 : 365;
  var startTime = now2.getTime() - (totalDays - 1) * 86400000;
  var recordingDays = new Set(mealLogs.filter(function (i) { return i.timestamp >= startTime; }).map(function (i) { return new Date(i.timestamp).toDateString(); })).size;
  var weightLogs = getWeightLogs();

  // ── DEMO DATA: 无体重记录时注入示例 ──
  if (weightLogs.length === 0) {
    var wn = new Date();
    var demoWeights = [62.5, 62.3, 62.1, 61.8, 61.6, 61.4, 61.2];
    for (var wi = 6; wi >= 0; wi--) {
      var wd = new Date(wn); wd.setDate(wd.getDate() - wi);
      weightLogs.push({ weight: demoWeights[6 - wi], date: wd.toISOString().slice(0, 10) });
    }
  }
  // ── END DEMO DATA ──

  var weightTrend = appData.buildWeightTrendData(weightLogs, range);
  var sortedWeights = weightLogs.slice().sort(function (a, b) { return String(a.date || a.timestamp).localeCompare(String(b.date || b.timestamp)); });
  var latestWeight = sortedWeights.length ? sortedWeights[sortedWeights.length - 1].weight : 0;
  return {
    streakDays: appData.getStreakDays(mealLogs),
    calorieTrend: trend,
    averageCalories: avgCal,
    dailyCalorieTarget: target,
    calorieDeviation: avgCal - target,
    recordingRate: recordingDays + "/" + totalDays,
    insight: appData.buildRangeInsight(avgCal, target, range),
    goalSubtitle: appData.getGoalOption(profile.goal).supportiveSubtitle,
    hasTrendData: trend.some(function (i) { return i.calories > 0; }),
    todayMealTypeStatus: buildMealTypeStatus(todaySummary),
    timeRange: range,
    weightTrend: weightTrend,
    latestWeight: latestWeight,
    hasWeightData: weightTrend.length > 0,
  };
}
async function buildStatsViewModel(range) { range = range || "week"; return buildStatsViewModelLocal(range); }
function saveWeightRecord(weight, dateStr) {
  if (!weight || weight <= 0) return false;
  var logs = getWeightLogs();
  dateStr = dateStr || new Date().toISOString().slice(0, 10);
  var idx = logs.findIndex(function (l) { return l.date === dateStr; });
  if (idx >= 0) logs[idx].weight = weight;
  else logs.push({ weight: weight, date: dateStr });
  logs.sort(function (a, b) { return String(a.date || a.timestamp).localeCompare(String(b.date || b.timestamp)); });
  saveWeightLogs(logs);
  return true;
}

module.exports = { ensureState, initUser, loginWithWechat, ensurePageAccess, resolveEntryRoute, hasIdentitySession, getPendingPublicProfile, getUser, getProfile, saveProfile, getMealLogs, saveMealLogs, getLatestSuggestion, saveLatestSuggestion, getLastAnalysis, saveLastAnalysis, getCoachMessages, saveCoachMessages, getSettings, saveSettings, completeOnboarding, updateGoal, analyzeMealPreview, saveAnalyzedMeal, addCoachMessage, buildDashboardViewModel, buildTrendViewModel, buildProfileViewModel, buildStatsViewModel, saveWeightRecord, buildCoachRequestContext, appData, inferMealType, MEAL_TYPE_OPTIONS };
