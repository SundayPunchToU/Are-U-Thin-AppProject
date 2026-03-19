const GOAL_OPTIONS = [
  { value: "rapidCut", label: "极速减脂", calorieDelta: -500 },
  { value: "steadyCut", label: "稳健减脂", calorieDelta: -300 },
  { value: "build", label: "增肌", calorieDelta: 300 },
  { value: "maintain", label: "维持", calorieDelta: 0 },
];

const DEFAULT_SETTINGS = {
  reminderAtNight: true,
  useVoiceEnhancement: true,
  socialPosterEnabled: true,
};

function getGoalOption(goal) {
  return GOAL_OPTIONS.find((item) => item.value === goal) || GOAL_OPTIONS[1];
}

function getMacroPlan(goal) {
  if (goal === "rapidCut" || goal === "steadyCut") {
    return { proteinRatio: 0.35, carbRatio: 0.35, fatRatio: 0.3 };
  }
  if (goal === "build") {
    return { proteinRatio: 0.3, carbRatio: 0.45, fatRatio: 0.25 };
  }
  return { proteinRatio: 0.3, carbRatio: 0.4, fatRatio: 0.3 };
}

function createDefaultProfile() {
  return {
    nickname: "Lihanjie",
    age: 27,
    heightCm: 165,
    weightKg: 58,
    activityFactor: 1.4,
    goal: "steadyCut",
  };
}

function calculateDailyCalorieTarget(profile) {
  const safeProfile = profile || createDefaultProfile();
  const goalOption = getGoalOption(safeProfile.goal);
  const bmr =
    10 * Number(safeProfile.weightKg) +
    6.25 * Number(safeProfile.heightCm) -
    5 * Number(safeProfile.age) +
    5;
  return Math.max(
    1200,
    Math.round(bmr * Number(safeProfile.activityFactor) + goalOption.calorieDelta)
  );
}

function getStoryProfiles() {
  return [
    { name: "小林", emoji: "🥗" },
    { name: "阿晴", emoji: "🍣" },
    { name: "Kevin", emoji: "🏋️" },
    { name: "Nana", emoji: "🥑" },
    { name: "Mia", emoji: "🍱" },
  ];
}

function getInspirationFeed() {
  return [
    {
      title: "低卡麻辣烫替换法",
      subtitle: "主食半份 + 双份蔬菜 + 去芝麻酱",
      calories: 420,
      badge: "热门",
      colors: ["#ffbf9f", "#ff8e7a"],
    },
    {
      title: "健身日高蛋白晚餐",
      subtitle: "鸡胸 + 土豆泥 + 西兰花",
      calories: 510,
      badge: "推荐",
      colors: ["#abebda", "#69b8a3"],
    },
    {
      title: "办公室控糖下午茶",
      subtitle: "无糖酸奶 + 蓝莓 + 坚果 10g",
      calories: 240,
      badge: "轻食",
      colors: ["#ffe0a8", "#fabc5f"],
    },
  ];
}

function getWeeklyTrend() {
  return [
    { label: "Mon", calories: 1520, target: 1750, weight: 63.6 },
    { label: "Tue", calories: 1690, target: 1750, weight: 63.4 },
    { label: "Wed", calories: 1610, target: 1750, weight: 63.3 },
    { label: "Thu", calories: 1790, target: 1750, weight: 63.5 },
    { label: "Fri", calories: 1570, target: 1750, weight: 63.2 },
    { label: "Sat", calories: 1710, target: 1750, weight: 63.1 },
    { label: "Sun", calories: 1490, target: 1750, weight: 63.0 },
  ];
}

function getBadges() {
  return [
    { title: "连续打卡", subtitle: "7/7", emoji: "🔥", progress: 1, unlocked: true },
    { title: "蛋白达人", subtitle: "4/7", emoji: "💪", progress: 0.57, unlocked: false },
    { title: "控糖挑战", subtitle: "6/7", emoji: "🍵", progress: 0.86, unlocked: false },
  ];
}

function getDefaultMealLogs() {
  const now = Date.now();
  return [
    {
      id: `${now - 1}`,
      timestamp: now - 8 * 60 * 60 * 1000,
      name: "酸奶燕麦碗",
      note: "早餐",
      nutrition: { calories: 310, protein: 18, carbs: 41, fat: 9 },
      scoreTitle: "控糖友好",
    },
    {
      id: `${now - 2}`,
      timestamp: now - 4 * 60 * 60 * 1000,
      name: "鸡胸肉藜麦沙拉",
      note: "午餐",
      nutrition: { calories: 390, protein: 34, carbs: 29, fat: 12 },
      scoreTitle: "高蛋白一餐",
    },
  ];
}

function getDefaultCoachMessages() {
  return [
    {
      id: `${Date.now()}`,
      text: "嗨，我是你的 AI 营养师。你可以直接问我：今天晚餐吃什么更稳？",
      fromUser: false,
      date: Date.now(),
    },
  ];
}

function getDefaultLatestSuggestion() {
  return "今天做得很稳，晚餐优先蒸煮类，睡前补 15g 蛋白质会更好。";
}

function getTodaySummary(mealLogs) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const date = today.getDate();

  return (mealLogs || []).reduce(
    (summary, item) => {
      const time = new Date(item.timestamp);
      if (
        time.getFullYear() === year &&
        time.getMonth() === month &&
        time.getDate() === date
      ) {
        return {
          calories: summary.calories + item.nutrition.calories,
          protein: summary.protein + item.nutrition.protein,
          carbs: summary.carbs + item.nutrition.carbs,
          fat: summary.fat + item.nutrition.fat,
        };
      }
      return summary;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function buildMacroTargets(profile, summary) {
  const target = calculateDailyCalorieTarget(profile);
  const macroPlan = getMacroPlan(profile.goal);
  return [
    {
      title: "蛋白质",
      current: summary.protein,
      target: (target * macroPlan.proteinRatio) / 4,
      tint: "#69b8a3",
    },
    {
      title: "碳水",
      current: summary.carbs,
      target: (target * macroPlan.carbRatio) / 4,
      tint: "#fabc5f",
    },
    {
      title: "脂肪",
      current: summary.fat,
      target: (target * macroPlan.fatRatio) / 9,
      tint: "#fa725d",
    },
  ].map((item) => ({
    ...item,
    currentText: Math.round(item.current),
    targetText: Math.round(item.target),
    progress: Math.min(100, Math.round((item.current / Math.max(item.target, 1)) * 100)),
  }));
}

function buildWeeklyTrendView() {
  return getWeeklyTrend().map((item) => {
    const ratio = Math.max(0.15, Math.min(1, item.calories / Math.max(item.target, 1)));
    return {
      ...item,
      barHeight: Math.round(ratio * 180),
      hitTarget: item.calories <= item.target,
    };
  });
}

function buildBadgeView() {
  return getBadges().map((item) => ({
    ...item,
    progressWidth: Math.round(item.progress * 100),
  }));
}

function analyzeMeal(voiceNote) {
  const note = (voiceNote || "").toLowerCase();
  if (note.includes("牛肉")) {
    return {
      guessedName: "黑椒牛肉饭",
      nutrition: { calories: 486, protein: 29, carbs: 44, fat: 18 },
      scoreTitle: "训练后友好",
      suggestion: "主食量控制得不错，如果这是晚餐，可以再加一份深绿色蔬菜。",
    };
  }
  if (note.includes("沙拉") || note.includes("鸡胸")) {
    return {
      guessedName: "轻盈能量沙拉",
      nutrition: { calories: 362, protein: 31, carbs: 22, fat: 14 },
      scoreTitle: "高蛋白一餐",
      suggestion: "这一餐相对稳，下午如果容易饿，可以补一点水果和酸奶。",
    };
  }
  if (note.includes("奶茶") || note.includes("甜")) {
    return {
      guessedName: "奶茶加餐",
      nutrition: { calories: 410, protein: 6, carbs: 57, fat: 17 },
      scoreTitle: "糖分偏高",
      suggestion: "这杯饮料热量不低，下一餐把主食减半并优先补蛋白质更合适。",
    };
  }
  return {
    guessedName: "均衡便当",
    nutrition: { calories: 428, protein: 24, carbs: 48, fat: 14 },
    scoreTitle: "结构均衡",
    suggestion: "整体在可控范围内，晚间注意补水，避免额外高糖零食。",
  };
}

function generateCoachReply(input) {
  if (input.includes("夜宵")) {
    return "想吃夜宵时先喝一杯温水，再选希腊酸奶或低脂奶，控制在 150 kcal 内。";
  }
  if (input.includes("外卖")) {
    return "外卖优先顺序：蒸煮蛋白质 > 绿叶菜 > 主食半份。这样更容易达成今日目标。";
  }
  if (input.includes("增肌")) {
    return "增肌日建议每餐至少 25g 蛋白质，训练后 1 小时内补充碳水 + 蛋白会更高效。";
  }
  return "这顿不用焦虑，你已经在可控范围内。下一餐多一点蛋白和蔬菜就能拉回平衡。";
}

module.exports = {
  GOAL_OPTIONS,
  DEFAULT_SETTINGS,
  createDefaultProfile,
  calculateDailyCalorieTarget,
  getMacroPlan,
  getGoalOption,
  getStoryProfiles,
  getInspirationFeed,
  getWeeklyTrend,
  getBadges,
  getDefaultMealLogs,
  getDefaultCoachMessages,
  getDefaultLatestSuggestion,
  getTodaySummary,
  buildMacroTargets,
  buildWeeklyTrendView,
  buildBadgeView,
  analyzeMeal,
  generateCoachReply,
};
