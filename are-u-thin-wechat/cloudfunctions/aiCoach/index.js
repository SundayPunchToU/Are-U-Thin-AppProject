const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

// 使用 CloudBase 内置 AI 模型
const MODEL = "hunyuan-2.0-instruct-20251111";

function sanitizeMessages(messages) {
  return (messages || [])
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim()
    )
    .slice(-12)
    .map((item) => ({
      role: item.role,
      content: item.content.trim(),
    }));
}

function buildContextText(context) {
  const safeContext = context || {};
  const profile = safeContext.profile || {};
  const todaySummary = safeContext.todaySummary || {};
  const recentMeals = safeContext.recentMeals || [];
  const settings = safeContext.settings || {};
  const mealSummary = recentMeals.length
    ? recentMeals
        .map(
          (meal, index) =>
            `${index + 1}. ${meal.name}，${meal.nutrition?.calories || 0} kcal，备注：${meal.note || "无"}，评价：${meal.scoreTitle || "无"}`
        )
        .join("\n")
    : "暂无最近餐食记录";

  return [
    "用户健康画像：",
    `昵称：${profile.nickname || "用户"}`,
    `年龄：${profile.age || "未知"} 岁`,
    `身高：${profile.heightCm || "未知"} cm`,
    `体重：${profile.weightKg || "未知"} kg`,
    `活动系数：${profile.activityFactor || "未知"}`,
    `目标：${profile.goal || "未设置"}`,
    "",
    "今日摄入：",
    `热量：${todaySummary.calories || 0} kcal`,
    `蛋白质：${todaySummary.protein || 0} g`,
    `碳水：${todaySummary.carbs || 0} g`,
    `脂肪：${todaySummary.fat || 0} g`,
    `最近建议：${safeContext.latestSuggestion || "暂无"}`,
    "",
    "最近餐食记录：",
    mealSummary,
    "",
    "功能开关：",
    `晚间提醒：${settings.reminderAtNight ? "开" : "关"}`,
    `语音增强：${settings.useVoiceEnhancement ? "开" : "关"}`,
    `分享海报：${settings.socialPosterEnabled ? "开" : "关"}`,
  ].join("\n");
}

function buildSystemPrompt(context) {
  return [
    "你是「瘦了吗」的 AI 营养师，负责回答饮食、体重管理、训练后补给、外卖选择和习惯养成问题。",
    "回答要求：",
    "1. 默认用简体中文回答，语气温和、直接、可执行。",
    "2. 结合提供的用户画像、今日摄入和最近餐食记录给出建议，不要忽略上下文。",
    "3. 优先给出具体替换方案、份量建议和下一餐行动，而不是泛泛而谈。",
    "4. 如果信息不足，先说明缺口，再给出保守建议。",
    "5. 不要假装医生；涉及疾病、药物、孕期、严重不适时，明确建议咨询医生或营养师。",
    "6. 避免夸张承诺，不要鼓励极端节食。",
    "",
    "以下是当前用户上下文：",
    buildContextText(context),
  ].join("\n");
}

function buildMealAnalysisSystemPrompt(context) {
  return [
    "你是一位专业的营养师，擅长根据用户描述分析餐食的营养成分。",
    "请根据用户提供的餐食描述，估算热量和营养成分，并给出个性化建议。",
    "",
    "用户信息：",
    buildContextText(context),
    "",
    "回复格式要求：",
    "请严格按照以下 JSON 格式回复，不要添加任何额外文字：",
    '{"mealName":"餐食名称","calories":热量数值,"protein":蛋白质克数,"carbs":碳水克数,"fat":脂肪克数,"scoreTitle":"简短评价","suggestion":"具体建议","identifiedFoods":[{"name":"食物名称","portion":"份量估计","cookingMethod":"烹饪方式"}]}',
  ].join("\n");
}

async function callAI(systemPrompt, messages) {
  // 使用 wx-server-sdk 内置的 AI 能力
  const ai = cloud.ai();
  
  const response = await ai.generateText({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages,
    ],
  });

  return response?.text?.trim();
}

exports.main = async (event) => {
  // 餐食分析
  if (event.action === "analyzeMeal") {
    const messages = sanitizeMessages(event.messages);
    if (!messages.length) {
      return {
        success: false,
        code: "INVALID_MESSAGES",
        message: "请提供餐食描述",
      };
    }

    try {
      const reply = await callAI(
        buildMealAnalysisSystemPrompt(event.context),
        messages
      );

      if (!reply) {
        return {
          success: false,
          code: "EMPTY_REPLY",
          message: "AI 分析返回空结果",
        };
      }

      return {
        success: true,
        reply,
        model: MODEL,
      };
    } catch (error) {
      console.error("[aiCoach] analyzeMeal failed:", error);
      return {
        success: false,
        code: "AI_ERROR",
        message: error.message || "AI 服务调用失败",
      };
    }
  }

  // 对话聊天
  if (event.action === "chat") {
    const messages = sanitizeMessages(event.messages);
    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return {
        success: false,
        code: "INVALID_MESSAGES",
        message: "The latest message must be from the user.",
      };
    }

    try {
      const reply = await callAI(
        buildSystemPrompt(event.context),
        messages
      );

      if (!reply) {
        return {
          success: false,
          code: "EMPTY_REPLY",
          message: "AI service returned an empty reply.",
        };
      }

      return {
        success: true,
        reply,
        model: MODEL,
        usage: null,
      };
    } catch (error) {
      console.error("[aiCoach] chat failed:", error);
      return {
        success: false,
        code: "AI_ERROR",
        message: error.message || "AI 服务调用失败",
      };
    }
  }

  return {
    success: false,
    code: "UNSUPPORTED_ACTION",
    message: "Unsupported action",
  };
};
