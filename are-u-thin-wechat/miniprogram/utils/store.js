const appData = require("./app-data");

const STORAGE_KEYS = {
  profile: "are_u_thin_profile",
  mealLogs: "are_u_thin_meal_logs",
  latestSuggestion: "are_u_thin_latest_suggestion",
  lastAnalysis: "are_u_thin_last_analysis",
  coachMessages: "are_u_thin_coach_messages",
  settings: "are_u_thin_settings",
};

function read(key, fallback) {
  try {
    const value = wx.getStorageSync(key);
    return value === "" || value === undefined ? fallback : value;
  } catch (error) {
    return fallback;
  }
}

function write(key, value) {
  wx.setStorageSync(key, value);
}

function ensureState() {
  const profile = read(STORAGE_KEYS.profile, null);
  const mealLogs = read(STORAGE_KEYS.mealLogs, []);
  const latestSuggestion = read(
    STORAGE_KEYS.latestSuggestion,
    appData.getDefaultLatestSuggestion()
  );
  const coachMessages = read(
    STORAGE_KEYS.coachMessages,
    appData.getDefaultCoachMessages()
  );
  const settings = read(STORAGE_KEYS.settings, appData.DEFAULT_SETTINGS);

  if (!mealLogs.length && profile) {
    write(STORAGE_KEYS.mealLogs, appData.getDefaultMealLogs());
  }
  if (!latestSuggestion) {
    write(STORAGE_KEYS.latestSuggestion, appData.getDefaultLatestSuggestion());
  }
  if (!coachMessages.length) {
    write(STORAGE_KEYS.coachMessages, appData.getDefaultCoachMessages());
  }
  write(STORAGE_KEYS.settings, { ...appData.DEFAULT_SETTINGS, ...settings });
}

function getProfile() {
  return read(STORAGE_KEYS.profile, null);
}

function saveProfile(profile) {
  write(STORAGE_KEYS.profile, profile);
}

function getMealLogs() {
  return read(STORAGE_KEYS.mealLogs, []);
}

function saveMealLogs(logs) {
  write(STORAGE_KEYS.mealLogs, logs);
}

function getLatestSuggestion() {
  return read(STORAGE_KEYS.latestSuggestion, appData.getDefaultLatestSuggestion());
}

function saveLatestSuggestion(text) {
  write(STORAGE_KEYS.latestSuggestion, text);
}

function getLastAnalysis() {
  return read(STORAGE_KEYS.lastAnalysis, null);
}

function saveLastAnalysis(result) {
  write(STORAGE_KEYS.lastAnalysis, result);
}

function getCoachMessages() {
  return read(STORAGE_KEYS.coachMessages, appData.getDefaultCoachMessages());
}

function saveCoachMessages(messages) {
  write(STORAGE_KEYS.coachMessages, messages);
}

function getSettings() {
  return read(STORAGE_KEYS.settings, appData.DEFAULT_SETTINGS);
}

function saveSettings(settings) {
  write(STORAGE_KEYS.settings, { ...appData.DEFAULT_SETTINGS, ...settings });
}

function completeOnboarding(profile) {
  saveProfile(profile);
  if (!getMealLogs().length) {
    saveMealLogs(appData.getDefaultMealLogs());
  }
  if (!getLatestSuggestion()) {
    saveLatestSuggestion(appData.getDefaultLatestSuggestion());
  }
}

function addMealLog(result, note, imagePath) {
  const logs = getMealLogs();
  const nextLog = {
    id: `${Date.now()}`,
    timestamp: Date.now(),
    name: result.guessedName,
    note,
    imagePath: imagePath || "",
    nutrition: result.nutrition,
    scoreTitle: result.scoreTitle,
  };
  const nextLogs = [nextLog, ...logs];
  saveMealLogs(nextLogs);
  saveLatestSuggestion(result.suggestion);
  saveLastAnalysis(result);
  return nextLog;
}

function addCoachMessage(text, fromUser) {
  const messages = getCoachMessages();
  const nextMessages = [
    ...messages,
    {
      id: `${Date.now()}_${fromUser ? "u" : "b"}`,
      text,
      fromUser,
      date: Date.now(),
    },
  ];
  saveCoachMessages(nextMessages);
  return nextMessages;
}

function buildDashboardViewModel() {
  const profile = getProfile() || appData.createDefaultProfile();
  const mealLogs = getMealLogs();
  const todaySummary = appData.getTodaySummary(mealLogs);
  const dailyTarget = appData.calculateDailyCalorieTarget(profile);
  return {
    profile,
    streakDays: Math.max(7, Math.min(30, mealLogs.length * 3)),
    storyProfiles: appData.getStoryProfiles(),
    inspirationFeed: appData.getInspirationFeed(),
    latestSuggestion: getLatestSuggestion(),
    todayGoal: {
      current: todaySummary.calories,
      target: dailyTarget,
      progress: Math.min(100, Math.round((todaySummary.calories / dailyTarget) * 100)),
    },
    macroTargets: appData.buildMacroTargets(profile, todaySummary),
  };
}

function buildTrendViewModel() {
  const mealLogs = getMealLogs();
  return {
    streakDays: Math.max(7, Math.min(30, mealLogs.length * 3)),
    weeklyTrend: appData.buildWeeklyTrendView(),
    badges: appData.buildBadgeView(),
  };
}

function buildCoachRequestContext() {
  const profile = getProfile() || appData.createDefaultProfile();
  const mealLogs = getMealLogs();
  const latestSuggestion = getLatestSuggestion();
  const todaySummary = appData.getTodaySummary(mealLogs);
  const dailyTarget = appData.calculateDailyCalorieTarget(profile);
  const goalOption = appData.getGoalOption(profile.goal);
  const recentMeals = mealLogs.slice(0, 3).map((item) => ({
    name: item.name,
    note: item.note,
    calories: item.nutrition.calories,
    protein: item.nutrition.protein,
    carbs: item.nutrition.carbs,
    fat: item.nutrition.fat,
    scoreTitle: item.scoreTitle,
  }));

  return {
    profile: {
      nickname: profile.nickname,
      age: profile.age,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      activityFactor: profile.activityFactor,
      goal: goalOption.label,
      dailyCalorieTarget: dailyTarget,
    },
    todaySummary,
    latestSuggestion,
    recentMeals,
    settings: getSettings(),
  };
}

module.exports = {
  ensureState,
  getProfile,
  saveProfile,
  getMealLogs,
  saveMealLogs,
  getLatestSuggestion,
  saveLatestSuggestion,
  getLastAnalysis,
  saveLastAnalysis,
  getCoachMessages,
  saveCoachMessages,
  getSettings,
  saveSettings,
  completeOnboarding,
  addMealLog,
  addCoachMessage,
  buildDashboardViewModel,
  buildTrendViewModel,
  buildCoachRequestContext,
  appData,
};
