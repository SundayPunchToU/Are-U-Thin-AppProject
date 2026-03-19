const https = require("https");
const { URL } = require("url");
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const DEFAULT_API_URL =
  process.env.AI_BASE_URL || "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = process.env.AI_MODEL || "gpt-4o-mini";
const DEFAULT_TEMPERATURE = Number(process.env.AI_TEMPERATURE || 0.7);

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
            `${index + 1}. ${meal.name}，${meal.calories} kcal，P${meal.protein} C${meal.carbs} F${meal.fat}，备注：${meal.note || "无"}，评价：${meal.scoreTitle || "无"}`
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
    `日热量目标：${profile.dailyCalorieTarget || "未知"} kcal`,
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
    "你是“瘦了吗”的 AI 营养师，负责回答饮食、体重管理、训练后补给、外卖选择和习惯养成问题。",
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

function requestJson(urlText, payload, headers) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlText);
    const body = JSON.stringify(payload);
    const request = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || undefined,
        path: `${url.pathname}${url.search}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          ...headers,
        },
      },
      (response) => {
        let rawData = "";
        response.on("data", (chunk) => {
          rawData += chunk;
        });
        response.on("end", () => {
          try {
            const parsed = rawData ? JSON.parse(rawData) : {};
            if (response.statusCode >= 200 && response.statusCode < 300) {
              resolve(parsed);
              return;
            }

            reject(
              new Error(
                parsed.error && parsed.error.message
                  ? parsed.error.message
                  : `AI service responded with status ${response.statusCode}`
              )
            );
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

exports.main = async (event) => {
  if (event.action !== "chat") {
    return {
      success: false,
      code: "UNSUPPORTED_ACTION",
      message: "Unsupported action",
    };
  }

  if (!process.env.AI_API_KEY) {
    return {
      success: false,
      code: "CONFIG_MISSING",
      message:
        "AI_API_KEY 未配置。请在云函数 aiCoach 中配置 AI_API_KEY、AI_BASE_URL、AI_MODEL 环境变量。",
    };
  }

  const messages = sanitizeMessages(event.messages);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return {
      success: false,
      code: "INVALID_MESSAGES",
      message: "The latest message must be from the user.",
    };
  }

  const response = await requestJson(
    DEFAULT_API_URL,
    {
      model: DEFAULT_MODEL,
      temperature: DEFAULT_TEMPERATURE,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(event.context),
        },
        ...messages,
      ],
    },
    {
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    }
  );

  const choice = response.choices && response.choices[0];
  const reply =
    choice &&
    choice.message &&
    typeof choice.message.content === "string" &&
    choice.message.content.trim();

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
    model: response.model || DEFAULT_MODEL,
    usage: response.usage || null,
  };
};
