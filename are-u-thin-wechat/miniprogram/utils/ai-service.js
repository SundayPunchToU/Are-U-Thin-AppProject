/**
 * AI 服务模块 - 在小程序前端直接调用 CloudBase AI
 */

const MODEL = "hunyuan-2.0-instruct-20251111";
const PROVIDER = "hunyuan-exp";

/**
 * 调用 AI 分析餐食
 * @param {Object} params - 分析参数
 * @param {string} params.imagePath - 图片路径（可选，用于提示）
 * @param {string} params.voiceNote - 语音/文字补充描述
 * @param {string} params.mealType - 餐食类型
 * @param {Object} params.context - 用户上下文
 * @returns {Promise<Object>} - 分析结果
 */
async function analyzeMealWithAI(params) {
  const { voiceNote, mealType, context, imagePath } = params;
  
  const profile = context?.profile || {};
  const todaySummary = context?.todaySummary || {};
  
  const prompt = buildAnalysisPrompt(voiceNote, mealType, profile, todaySummary, !!imagePath);
  
  if (!wx.cloud) {
    throw new Error("当前环境未启用云开发");
  }
  
  try {
    // 使用小程序前端的 AI 能力
    const model = wx.cloud.extend.AI.createModel(PROVIDER);
    
    const response = await model.generateText({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    
    const reply = response?.choices?.[0]?.message?.content;
    
    if (reply) {
      return parseAnalysisResult(reply, voiceNote, mealType);
    }
    
    throw new Error("AI 返回空结果");
  } catch (error) {
    console.error("[ai-service] analyzeMealWithAI failed:", error);
    throw error;
  }
}

/**
 * 构建分析提示词
 */
function buildAnalysisPrompt(voiceNote, mealType, profile, todaySummary, hasImage) {
  const mealTypeLabels = {
    breakfast: "早餐",
    lunch: "午餐",
    dinner: "晚餐",
    snack: "加餐",
  };
  
  const goalLabels = {
    cut: "减脂",
    build: "增肌",
    maintain: "维持体重",
  };
  
  return [
    "你是一位专业的营养师，请分析以下餐食，并按 JSON 格式返回分析结果。",
    "",
    "【用户输入】",
    `描述：${voiceNote || "无描述"}`,
    `餐食类型：${mealTypeLabels[mealType] || mealType}`,
    `是否有图片：${hasImage ? "是" : "否"}`,
    "",
    "【用户信息】",
    `目标：${goalLabels[profile.goal] || "减脂"}`,
    `今日已摄入热量：${todaySummary.calories || 0} kcal`,
    `今日已摄入蛋白质：${todaySummary.protein || 0} g`,
    `今日已摄入碳水：${todaySummary.carbs || 0} g`,
    `今日已摄入脂肪：${todaySummary.fat || 0} g`,
    "",
    "【返回格式要求】",
    "请严格按照以下 JSON 格式返回，不要添加任何额外文字：",
    '{"mealName":"餐食名称","calories":热量数值,"protein":蛋白质克数,"carbs":碳水克数,"fat":脂肪克数,"scoreTitle":"简短评价，如：高蛋白一餐、热量偏高、结构均衡","suggestion":"针对用户目标和今日摄入的具体建议，30-50字","identifiedFoods":[{"name":"食物名称","portion":"份量估计","cookingMethod":"烹饪方式"}]}',
    "",
    "【估算原则】",
    "1. 根据描述估算份量和烹饪方式",
    "2. 热量估算考虑隐藏油盐",
    "3. 建议要结合用户目标和今日已摄入",
  ].join("\n");
}

/**
 * 解析 AI 返回的分析结果
 */
function parseAnalysisResult(reply, voiceNote, mealType) {
  try {
    // 尝试从回复中提取 JSON
    const jsonMatch = reply.match(/```json\s*([\s\S]*?)\s*```/) || 
                      reply.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      
      return {
        guessedMealName: parsed.mealName || "未知餐食",
        nutrition: {
          calories: Number(parsed.calories) || 0,
          protein: Number(parsed.protein) || 0,
          carbs: Number(parsed.carbs) || 0,
          fat: Number(parsed.fat) || 0,
        },
        scoreTitle: parsed.scoreTitle || "分析完成",
        suggestion: parsed.suggestion || "",
        identifiedFoods: parsed.identifiedFoods || [],
        confidence: {
          level: "high",
          reason: "AI 分析完成，结果基于你的描述和用户画像。",
        },
        warnings: [],
        notes: [],
        needsMoreInfo: false,
        aiPowered: true,
      };
    }
  } catch (error) {
    console.error("[ai-service] Failed to parse AI result:", error);
  }
  
  // 如果无法解析 JSON，使用文本作为建议
  return {
    guessedMealName: "餐食分析",
    nutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
    scoreTitle: "AI 分析完成",
    suggestion: reply,
    identifiedFoods: [],
    confidence: {
      level: "medium",
      reason: "AI 返回格式异常，请参考建议。",
    },
    warnings: [],
    notes: ["AI 返回了文本建议，请手动确认营养数据。"],
    needsMoreInfo: true,
    aiPowered: true,
  };
}

/**
 * AI 教练对话
 * @param {string} userMessage - 用户消息
 * @param {Array} history - 历史消息
 * @param {Object} context - 用户上下文
 * @returns {Promise<string>} - AI 回复
 */
async function chatWithCoach(userMessage, history, context) {
  if (!wx.cloud) {
    throw new Error("当前环境未启用云开发");
  }
  
  const profile = context?.profile || {};
  const todaySummary = context?.todaySummary || {};
  
  const systemPrompt = buildCoachSystemPrompt(profile, todaySummary);
  
  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
    ...(history || []).slice(-8),
    {
      role: "user",
      content: userMessage,
    },
  ];
  
  try {
    const model = wx.cloud.extend.AI.createModel(PROVIDER);
    
    const response = await model.generateText({
      model: MODEL,
      messages,
    });
    
    return response?.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("[ai-service] chatWithCoach failed:", error);
    throw error;
  }
}

function buildCoachSystemPrompt(profile, todaySummary) {
  return [
    "你是「瘦了吗」的 AI 营养师，负责回答饮食、体重管理、训练后补给、外卖选择和习惯养成问题。",
    "回答要求：",
    "1. 默认用简体中文回答，语气温和、直接、可执行。",
    "2. 结合用户画像和今日摄入给出建议。",
    "3. 优先给出具体替换方案、份量建议和下一餐行动。",
    "4. 不要假装医生；涉及疾病时，建议咨询医生。",
    "",
    "用户信息：",
    `目标：${profile.goal || "减脂"}`,
    `今日已摄入：${todaySummary.calories || 0} kcal`,
  ].join("\n");
}

module.exports = {
  analyzeMealWithAI,
  chatWithCoach,
};
