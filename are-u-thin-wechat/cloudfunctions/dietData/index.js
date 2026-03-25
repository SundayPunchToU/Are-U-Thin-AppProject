const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const COLL = { users: "users", profiles: "profiles", meals: "meal_records", summaries: "daily_summaries" };
const DEFAULT_SETTINGS = { reminderAtNight: true, useVoiceEnhancement: true, socialPosterEnabled: true };
const GOAL_DELTA = { cut: -300, build: 250, maintain: 0 };
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

const num = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};
const now = () => Date.now();
const dateKeyOf = (value) => {
  const date = new Date(value || now());
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};
const pick = (source, keys) => keys.reduce((acc, key) => (source && source[key] !== undefined ? { ...acc, [key]: source[key] } : acc), {});
const mergeSettings = (settings) => ({ ...DEFAULT_SETTINGS, ...(settings || {}) });
const normalizeProfile = (profile) => {
  const safe = profile || {};
  const goal = ["cut", "build", "maintain"].includes(safe.goal) ? safe.goal : "cut";
  return {
    nickname: typeof safe.nickname === "string" && safe.nickname.trim() ? safe.nickname.trim() : "微信用户",
    avatarUrl: typeof safe.avatarUrl === "string" ? safe.avatarUrl : "",
    age: num(safe.age, 27),
    heightCm: num(safe.heightCm, 165),
    weightKg: num(safe.weightKg, 58),
    activityFactor: num(safe.activityFactor, 1.4),
    goal,
  };
};
const calorieTargetOf = (profile) => {
  const safe = normalizeProfile(profile);
  const bmr = 10 * safe.weightKg + 6.25 * safe.heightCm - 5 * safe.age + 5;
  return Math.max(1200, Math.round(bmr * safe.activityFactor) + (GOAL_DELTA[safe.goal] || 0));
};
const inferMealType = (timestamp) => {
  const date = new Date(num(timestamp, now()));
  const hour = date.getHours();
  if (hour >= 5 && hour < 10) return "breakfast";
  if (hour >= 10 && hour < 15) return "lunch";
  if (hour >= 15 && hour < 21) return "dinner";
  return "snack";
};
const normalizeMealType = (mealType, timestamp) => (MEAL_TYPES.includes(mealType) ? mealType : inferMealType(timestamp));
const emptyMealTypeCounts = () => ({ breakfast: 0, lunch: 0, dinner: 0, snack: 0 });
const normalizeSummaryDoc = (summaryDoc) => {
  const counts = { ...emptyMealTypeCounts(), ...((summaryDoc && summaryDoc.mealTypeCounts) || {}) };
  return {
    calories: num(summaryDoc && summaryDoc.calories),
    protein: num(summaryDoc && summaryDoc.protein),
    carbs: num(summaryDoc && summaryDoc.carbs),
    fat: num(summaryDoc && summaryDoc.fat),
    mealCount: num(summaryDoc && summaryDoc.mealCount),
    mealTypeCounts: counts,
    hasBreakfast: summaryDoc ? !!(summaryDoc.hasBreakfast || counts.breakfast) : false,
    hasLunch: summaryDoc ? !!(summaryDoc.hasLunch || counts.lunch) : false,
    hasDinner: summaryDoc ? !!(summaryDoc.hasDinner || counts.dinner) : false,
    hasSnack: summaryDoc ? !!(summaryDoc.hasSnack || counts.snack) : false,
  };
};

async function getOne(name, where) {
  const result = await db.collection(name).where(where).limit(1).get();
  return result.data[0] || null;
}
async function setOne(name, where, data) {
  const current = await getOne(name, where);
  if (current) {
    const next = {
      ...current,
      ...data,
      createdAt: current.createdAt || data.createdAt || now(),
    };
    delete next._id;
    await db.collection(name).doc(current._id).update({ data: next });
    return { _id: current._id, ...next };
  }
  const created = {
    ...where,
    ...data,
    createdAt: data.createdAt || now(),
  };
  const result = await db.collection(name).add({ data: created });
  return { _id: result._id, ...created };
}
async function listMeals(openid, key) {
  const result = await db.collection(COLL.meals).where({ openid, dateKey: key }).orderBy("eatenAt", "desc").limit(100).get();
  return result.data || [];
}
async function rebuildDailySummary(openid, key) {
  const meals = await listMeals(openid, key);
  const mealTypeCounts = meals.reduce((acc, item) => {
    const mealType = normalizeMealType(item.mealType, item.eatenAt);
    acc[mealType] = num(acc[mealType]) + 1;
    return acc;
  }, emptyMealTypeCounts());
  const summary = meals.reduce((acc, item) => ({
    calories: acc.calories + num(item.nutrition && item.nutrition.calories),
    protein: acc.protein + num(item.nutrition && item.nutrition.protein),
    carbs: acc.carbs + num(item.nutrition && item.nutrition.carbs),
    fat: acc.fat + num(item.nutrition && item.nutrition.fat),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  return setOne(COLL.summaries, { openid, dateKey: key }, {
    ...summary,
    mealCount: meals.length,
    mealTypeCounts,
    hasBreakfast: mealTypeCounts.breakfast > 0,
    hasLunch: mealTypeCounts.lunch > 0,
    hasDinner: mealTypeCounts.dinner > 0,
    hasSnack: mealTypeCounts.snack > 0,
    latestSuggestion: (meals[0] && meals[0].suggestion) || "",
    lastMealAt: (meals[0] && meals[0].eatenAt) || 0,
    updatedAt: now(),
    createdAt: now(),
  });
}
async function getStreakDays(openid) {
  const result = await db.collection(COLL.summaries).where({ openid, mealCount: _.gt(0) }).limit(100).get();
  return (result.data || []).length;
}
async function getProfileBundle(openid) {
  const profileDoc = await getOne(COLL.profiles, { openid });
  const profile = profileDoc ? { ...normalizeProfile(profileDoc), settings: mergeSettings(profileDoc.settings) } : null;
  const todayKey = dateKeyOf();
  const todayMeals = profile
    ? (await listMeals(openid, todayKey)).map((item) => ({
        ...item,
        mealType: normalizeMealType(item.mealType, item.eatenAt),
      }))
    : [];
  const summaryDoc = profile ? await getOne(COLL.summaries, { openid, dateKey: todayKey }) : null;
  return {
    profile,
    todayMeals,
    todaySummary: normalizeSummaryDoc(summaryDoc),
    latestSuggestion: (summaryDoc && summaryDoc.latestSuggestion) || "",
    streakDays: profile ? await getStreakDays(openid) : 0,
  };
}

exports.main = async (event) => {
  const { OPENID: openid, APPID: appid, UNIONID: unionid } = cloud.getWXContext();
  if (!openid) return { success: false, code: "NO_OPENID", message: "无法获取当前用户身份。" };
  if (event.action === "initUser") {
    const profileDoc = await getOne(COLL.profiles, { openid });
    const nextPublicProfile = event.publicProfile || {};
    const hasPublicProfile = !!(nextPublicProfile.nickname || nextPublicProfile.avatarUrl);
    const mergedProfileDoc = profileDoc && hasPublicProfile
      ? await setOne(COLL.profiles, { openid }, {
          ...normalizeProfile({ ...profileDoc, ...nextPublicProfile }),
          settings: mergeSettings(profileDoc.settings),
          updatedAt: now(),
          createdAt: profileDoc.createdAt || now(),
        })
      : profileDoc;
    const user = await setOne(COLL.users, { openid }, {
      appid,
      unionid: unionid || "",
      onboardingCompleted: !!profileDoc,
      nickname: nextPublicProfile.nickname || (mergedProfileDoc && mergedProfileDoc.nickname) || "",
      avatarUrl: nextPublicProfile.avatarUrl || (mergedProfileDoc && mergedProfileDoc.avatarUrl) || "",
      updatedAt: now(),
      createdAt: now(),
    });
    return {
      success: true,
      data: {
        user: pick(user, ["openid", "onboardingCompleted", "nickname", "avatarUrl"]),
        profile: mergedProfileDoc ? { ...normalizeProfile(mergedProfileDoc), settings: mergeSettings(mergedProfileDoc.settings) } : null,
      },
    };
  }
  if (event.action === "saveOnboarding") {
    const current = (await getOne(COLL.profiles, { openid })) || {};
    const profile = normalizeProfile({ ...current, ...(event.profile || {}) });
    const profileDoc = await setOne(COLL.profiles, { openid }, { ...profile, settings: mergeSettings(event.settings), updatedAt: now(), createdAt: current.createdAt || now() });
    await setOne(COLL.users, { openid }, { appid, unionid: unionid || "", onboardingCompleted: true, nickname: profile.nickname || "", avatarUrl: profile.avatarUrl || "", updatedAt: now(), createdAt: now() });
    return { success: true, data: { profile: { ...normalizeProfile(profileDoc), settings: mergeSettings(profileDoc.settings) } } };
  }
  if (event.action === "createMealRecord") {
    const meal = event.meal || {};
    const eatenAt = num(meal.eatenAt, now());
    const dateKey = dateKeyOf(eatenAt);
    const mealType = normalizeMealType(meal.mealType, eatenAt);
    const nutrition = { calories: num(meal.nutrition && meal.nutrition.calories), protein: num(meal.nutrition && meal.nutrition.protein), carbs: num(meal.nutrition && meal.nutrition.carbs), fat: num(meal.nutrition && meal.nutrition.fat) };
    const mealDoc = {
      openid,
      dateKey,
      eatenAt,
      mealType,
      name: meal.name || meal.guessedMealName || "已记录餐食",
      note: meal.note || "",
      imageFileId: meal.imageFileId || "",
      nutrition,
      scoreTitle: meal.scoreTitle || "",
      guessedMealName: meal.guessedMealName || "",
      identifiedFoods: meal.identifiedFoods || [],
      confidence: meal.confidence || null,
      warnings: meal.warnings || [],
      notes: meal.notes || [],
      suggestion: meal.suggestion || "",
      createdAt: now(),
      updatedAt: now(),
    };
    const created = await db.collection(COLL.meals).add({ data: mealDoc });
    const todaySummary = await rebuildDailySummary(openid, dateKey);
    return {
      success: true,
      data: {
        meal: { _id: created._id, ...mealDoc },
        todaySummary: normalizeSummaryDoc(todaySummary),
        latestSuggestion: todaySummary.latestSuggestion || "",
      },
    };
  }
  if (event.action === "getTodayMeals") return { success: true, data: await getProfileBundle(openid) };
  if (event.action === "getDashboard") return { success: true, data: await getProfileBundle(openid) };
  if (event.action === "getProfile") return { success: true, data: await getProfileBundle(openid) };
  if (event.action === "updateProfile") {
    const current = (await getOne(COLL.profiles, { openid })) || {};
    const nextProfile = normalizeProfile({ ...current, ...(event.profile || {}) });
    await setOne(COLL.profiles, { openid }, { ...nextProfile, settings: mergeSettings({ ...(current.settings || {}), ...(event.settings || {}) }), updatedAt: now(), createdAt: current.createdAt || now() });
    await setOne(COLL.users, { openid }, { appid, unionid: unionid || "", onboardingCompleted: true, nickname: nextProfile.nickname || "", avatarUrl: nextProfile.avatarUrl || "", updatedAt: now(), createdAt: now() });
    return { success: true, data: await getProfileBundle(openid) };
  }
  if (event.action === "getTrend") {
    const bundle = await getProfileBundle(openid);
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const startKey = dateKeyOf(start.getTime());
    const dailySummaries = bundle.profile
      ? (((await db.collection(COLL.summaries).where({ openid, dateKey: _.gte(startKey) }).orderBy("dateKey", "asc").limit(20).get()).data || []).map((item) => ({
          ...item,
          ...normalizeSummaryDoc(item),
        })))
      : [];
    return {
      success: true,
      data: {
        profile: bundle.profile,
        streakDays: bundle.streakDays,
        dailySummaries,
        todaySummary: normalizeSummaryDoc(bundle.todaySummary),
        dailyCalorieTarget: bundle.profile ? calorieTargetOf(bundle.profile) : 0,
      },
    };
  }
  return { success: false, code: "UNSUPPORTED_ACTION", message: "Unsupported action" };
};

