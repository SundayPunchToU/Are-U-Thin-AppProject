const GOAL_OPTIONS = [
  { value: "cut", label: "减脂", emoji: "🔥", supportiveTitle: "轻盈减脂中", supportiveSubtitle: "关注热量缺口，也别忘了吃得舒服。", calorieDelta: -300 },
  { value: "build", label: "增肌", emoji: "💪", supportiveTitle: "稳定增肌中", supportiveSubtitle: "优先保证蛋白质和训练日能量。", calorieDelta: 250 },
  { value: "maintain", label: "维持", emoji: "🌿", supportiveTitle: "保持平衡中", supportiveSubtitle: "保持节奏感，让健康更轻松。", calorieDelta: 0 },
];

const DEFAULT_SETTINGS = { reminderAtNight: true, useVoiceEnhancement: true, socialPosterEnabled: true };

function getGoalOption(goal) { return GOAL_OPTIONS.find((item) => item.value === goal) || GOAL_OPTIONS[0]; }
function getMacroPlan(goal) {
  if (goal === "cut") return { proteinRatio: 0.33, carbRatio: 0.37, fatRatio: 0.3 };
  if (goal === "build") return { proteinRatio: 0.3, carbRatio: 0.45, fatRatio: 0.25 };
  return { proteinRatio: 0.3, carbRatio: 0.4, fatRatio: 0.3 };
}
function createDefaultProfile() { return { nickname: "微信用户", avatarUrl: "", age: 27, heightCm: 165, weightKg: 58, activityFactor: 1.4, goal: "cut" }; }
function calculateDailyCalorieTarget(profile) {
  const safe = { ...createDefaultProfile(), ...(profile || {}) };
  const goal = getGoalOption(safe.goal);
  const bmr = 10 * Number(safe.weightKg) + 6.25 * Number(safe.heightCm) - 5 * Number(safe.age) + 5;
  return Math.max(1200, Math.round(bmr * Number(safe.activityFactor)) + goal.calorieDelta);
}
function getActivityText(factor) { return factor < 1.4 ? "久坐为主" : factor < 1.7 ? "轻度活跃" : "运动较多"; }
function buildProfileMetrics(profile) {
  const safe = { ...createDefaultProfile(), ...(profile || {}) };
  const target = calculateDailyCalorieTarget(safe);
  const macro = getMacroPlan(safe.goal);
  return { dailyCalorieTarget: target, proteinTarget: Math.round((target * macro.proteinRatio) / 4), carbTarget: Math.round((target * macro.carbRatio) / 4), fatTarget: Math.round((target * macro.fatRatio) / 9) };
}

function makeLog(id, dayOffset, hour, name, note, nutrition, scoreTitle) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return { id: `${Date.now()}_${id}`, timestamp: date.getTime(), name, note, nutrition, scoreTitle, imagePath: "" };
}
function getDefaultMealLogs() {
  return [
    makeLog(1, 0, 8, "酸奶燕麦碗", "早餐，蓝莓和奇亚籽", { calories: 320, protein: 19, carbs: 42, fat: 9 }, "早餐开得很稳"),
    makeLog(2, 0, 13, "鸡胸肉藜麦沙拉", "午餐，少油", { calories: 405, protein: 33, carbs: 31, fat: 13 }, "高蛋白一餐"),
    makeLog(3, -1, 19, "三文鱼饭", "晚餐，训练后", { calories: 540, protein: 34, carbs: 45, fat: 24 }, "恢复友好"),
    makeLog(4, -2, 12, "番茄牛肉意面", "午餐，外卖", { calories: 598, protein: 30, carbs: 62, fat: 24 }, "饱腹感不错"),
    makeLog(5, -3, 8, "全麦三明治", "早餐", { calories: 360, protein: 20, carbs: 37, fat: 13 }, "节奏平稳"),
    makeLog(6, -5, 18, "轻盈便当", "晚餐，少油", { calories: 468, protein: 28, carbs: 49, fat: 15 }, "整体均衡"),
  ].sort((a, b) => b.timestamp - a.timestamp);
}
function getDefaultCoachMessages() { return [{ id: `${Date.now()}`, text: "嗨，我是你的 AI 营养师。虽然主 tab 先聚焦记录流程，但我仍然可以继续给你温和建议。", fromUser: false, date: Date.now() }]; }
function getDefaultLatestSuggestion() { return "今天已经有个不错的开始了，下一餐继续优先蔬菜和蛋白质就很好。"; }
function getTodayMeals(mealLogs) {
  const today = new Date().toDateString();
  return (mealLogs || []).filter((item) => new Date(item.timestamp).toDateString() === today).sort((a, b) => b.timestamp - a.timestamp);
}
function getTodaySummary(mealLogs) {
  return getTodayMeals(mealLogs).reduce((sum, item) => ({ calories: sum.calories + Number(item.nutrition.calories || 0), protein: sum.protein + Number(item.nutrition.protein || 0), carbs: sum.carbs + Number(item.nutrition.carbs || 0), fat: sum.fat + Number(item.nutrition.fat || 0) }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}
function getStreakDays(mealLogs) { return new Set((mealLogs || []).map((item) => new Date(item.timestamp).toDateString())).size; }
function buildMacroTargets(profile, summary) {
  const metrics = buildProfileMetrics(profile);
  return [
    { title: "蛋白质", current: summary.protein, target: metrics.proteinTarget, tint: "#69B8A3" },
    { title: "碳水", current: summary.carbs, target: metrics.carbTarget, tint: "#FABC5F" },
    { title: "脂肪", current: summary.fat, target: metrics.fatTarget, tint: "#FA725D" },
  ].map((item) => ({ ...item, currentText: Math.round(item.current), targetText: Math.round(item.target), progress: Math.min(100, Math.round((item.current / Math.max(item.target, 1)) * 100)) }));
}
function buildWeeklyCalorieTrend(mealLogs, target) {
  const labels = ["日", "一", "二", "三", "四", "五", "六"];
  return [...Array(7)].map((_, index) => {
    const date = new Date(); date.setDate(date.getDate() - (6 - index)); date.setHours(0, 0, 0, 0);
    const calories = (mealLogs || []).filter((item) => new Date(item.timestamp).toDateString() === date.toDateString()).reduce((sum, item) => sum + Number(item.nutrition.calories || 0), 0);
    const ratio = Math.max(0.14, Math.min(1, calories / Math.max(target || 1, 1)));
    return { label: `周${labels[date.getDay()]}`, calories, target, hitTarget: calories <= target, barHeight: Math.round(ratio * 122) };
  });
}
function buildWeeklyInsight(avg, target) {
  const delta = avg - target;
  if (Math.abs(delta) <= 120) return "这周整体很稳，继续保持现在的记录节奏就很好。";
  if (delta < 0) return "这周摄入整体偏轻一些，记得给自己留出足够能量和恢复空间。";
  return "这周比目标多一点点也没关系，下一餐回到蔬菜和蛋白质优先就好。";
}
function buildAnalysis(base, request) {
  const warnings = [];
  const notes = [];
  if (request.context.isTakeout) warnings.push("外卖的隐藏油盐可能更高，晚些时候记得补水。");
  if (/奶茶|甜|炸/.test(request.voiceNote)) warnings.push("这餐里可能有额外糖和油，下一餐清爽一点会更平衡。");
  if (request.context.lowOilTag) notes.push("你标记了少油，这会让估算更接近真实摄入。");
  if (request.context.isTrainingDay) notes.push("训练日优先保证蛋白质和适量碳水，恢复会更稳。");
  const confidence = request.imagePath && request.voiceNote.length > 8 ? { level: "high", reason: "有照片也有补充描述，这次估算会更稳一些。" } : { level: "medium", reason: "本次结果为实用估算，实际份量和用油会带来少量波动。" };
  return { ...base, analysisStatus: "ok", confidence, warnings, notes, nutrition: { calories: base.calories, protein: base.protein, carbs: base.carbs, fat: base.fat }, needsMoreInfo: false };
}
function analyzeMeal(request) {
  if (!request.imagePath) return { analysisStatus: "need_more_info", guessedMealName: "还需要更清晰一点", identifiedFoods: [], calories: null, protein: null, carbs: null, fat: null, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 }, confidence: { level: "low", reason: "没有照片时我很难判断份量，先补一张图会更靠谱。" }, scoreTitle: "信息不足", suggestion: "先补一张照片，或者再描述主食、蛋白质和烹饪方式，我再继续帮你看。", warnings: [], notes: ["当前结果没有保存，需要你补充后再确认。"], needsMoreInfo: true };
  const lower = (request.voiceNote || "").toLowerCase();
  if (lower.includes("牛肉")) return buildAnalysis({ guessedMealName: "黑椒牛肉饭", identifiedFoods: [{ name: "牛肉", estimatedPortion: "约100g", cookingMethod: "煎炒" }, { name: "米饭", estimatedPortion: "半碗", cookingMethod: "蒸" }, { name: "西兰花", estimatedPortion: "一份", cookingMethod: "焯/炒" }], calories: 486, protein: 29, carbs: 44, fat: 18, scoreTitle: "训练后友好", suggestion: "主食量控制得不错，如果这是晚餐，可以再加一份深绿色蔬菜。" }, request);
  if (lower.includes("沙拉") || lower.includes("鸡胸")) return buildAnalysis({ guessedMealName: "轻盈能量沙拉", identifiedFoods: [{ name: "鸡胸肉", estimatedPortion: "约120g", cookingMethod: "煎/舒肥" }, { name: "生菜", estimatedPortion: "一大碗", cookingMethod: "生食" }, { name: "杂粮", estimatedPortion: "小半份", cookingMethod: "熟制" }], calories: 362, protein: 31, carbs: 22, fat: 14, scoreTitle: "高蛋白一餐", suggestion: "这一餐相对稳，下午如果容易饿，可以补一点水果和酸奶。" }, request);
  if (lower.includes("奶茶") || lower.includes("甜")) return buildAnalysis({ guessedMealName: "奶茶加餐", identifiedFoods: [{ name: "奶茶", estimatedPortion: "中杯", cookingMethod: "饮品" }, { name: "小料", estimatedPortion: "一份", cookingMethod: "加料" }], calories: 410, protein: 6, carbs: 57, fat: 17, scoreTitle: "糖分偏高", suggestion: "这杯饮料热量不低，下一餐把主食减半并优先补蛋白质更合适。" }, request);
  return buildAnalysis({ guessedMealName: "均衡便当", identifiedFoods: [{ name: "主菜", estimatedPortion: "一份", cookingMethod: "家常" }, { name: "米饭", estimatedPortion: "半到一碗", cookingMethod: "蒸" }, { name: "蔬菜", estimatedPortion: "一份", cookingMethod: "清炒" }], calories: 428, protein: 24, carbs: 48, fat: 14, scoreTitle: "结构均衡", suggestion: "整体在可控范围内，晚间注意补水，避免额外高糖零食。" }, request);
}
function generateCoachReply(input) {
  if (input.includes("夜宵")) return "想吃夜宵时先喝一杯温水，再选希腊酸奶或低脂奶，控制在 150 kcal 内。";
  if (input.includes("外卖")) return "外卖优先顺序：蒸煮蛋白质 > 绿叶菜 > 主食半份，这样更容易守住今天的节奏。";
  if (input.includes("增肌")) return "增肌日建议每餐至少 25g 蛋白质，训练后 1 小时内补充碳水 + 蛋白会更高效。";
  return "这顿不用焦虑，你已经在可控范围内。下一餐多一点蛋白和蔬菜，就能慢慢拉回平衡。";
}

module.exports = { GOAL_OPTIONS, DEFAULT_SETTINGS, getGoalOption, getMacroPlan, createDefaultProfile, calculateDailyCalorieTarget, getActivityText, buildProfileMetrics, getDefaultMealLogs, getDefaultCoachMessages, getDefaultLatestSuggestion, getTodayMeals, getTodaySummary, getStreakDays, buildMacroTargets, buildWeeklyCalorieTrend, buildWeeklyInsight, analyzeMeal, generateCoachReply };
