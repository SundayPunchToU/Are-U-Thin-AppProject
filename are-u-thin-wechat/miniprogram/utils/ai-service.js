/**
 * AI 服务模块 - 在小程序前端直接调用 CloudBase AI
 * 支持图片识别 + AI 营养分析
 */

const MODEL = "hunyuan-2.0-instruct-20251111";
const PROVIDER = "hunyuan-exp";

// 食物营养数据库（嵌入提示词）
const FOOD_DATABASE = `
【食物营养数据库参考】

**主食类**
- 白米饭：1碗(150g)=195kcal，蛋白质4.2g，碳水44.3g，脂肪0.5g
- 白米饭半碗：75g=98kcal
- 糙米饭：1碗=165kcal
- 蛋炒饭：1碗(200g)=350kcal
- 白面条(熟)：1碗(200g)=220kcal
- 炒面：1份(300g)=450kcal
- 意大利面(熟)：1份(200g)=280kcal
- 馒头：1个(100g)=220kcal
- 包子(肉馅)：1个(80g)=180kcal
- 饺子(猪肉)：10个(200g)=420kcal
- 吐司：1片(30g)=80kcal

**肉类**
- 牛肉(瘦)：100g=125kcal，蛋白质20g，脂肪4g
- 牛排(煎)：150g=320kcal，蛋白质35g
- 黑椒牛肉：1份(150g)=280kcal
- 鸡胸肉(生)：100g=115kcal，蛋白质23g，脂肪2g
- 鸡胸肉(煎/烤)：100g=165kcal，蛋白质28g
- 鸡腿肉(带皮)：100g=180kcal
- 炸鸡块：6块(150g)=420kcal
- 猪瘦肉：100g=145kcal，蛋白质20g
- 猪五花：100g=340kcal，脂肪30g
- 红烧肉：1份(150g)=450kcal

**海鲜类**
- 三文鱼(生)：100g=140kcal，蛋白质20g
- 三文鱼(煎)：100g=180kcal
- 鲈鱼(清蒸)：1条(400g)=320kcal
- 虾仁：100g=85kcal，蛋白质18g
- 白灼虾：10只(200g)=180kcal
- 大闸蟹：1只(150g)=120kcal

**蛋类**
- 水煮蛋：1个(50g)=70kcal，蛋白质6g
- 煎蛋：1个(50g)=95kcal
- 炒蛋：2个(100g)=180kcal

**蔬菜类**
- 生菜/白菜：100g=15-18kcal
- 西兰花：100g=35kcal
- 土豆：100g=80kcal
- 酸辣土豆丝：1份(150g)=150kcal
- 红薯：100g=100kcal

**豆制品**
- 豆腐(嫩)：100g=50kcal
- 麻婆豆腐：1份(250g)=280kcal
- 豆浆(无糖)：1杯(300ml)=90kcal

**水果类**
- 苹果：1个(150g)=80kcal
- 香蕉：1根(100g)=90kcal
- 西瓜：200g=60kcal
- 牛油果：1个(150g)=250kcal

**饮品类**
- 牛奶(全脂)：1杯(250ml)=150kcal
- 酸奶(原味)：1杯(150g)=120kcal
- 奶茶(加糖)：1杯(500ml)=350kcal
- 奶茶(无糖)：1杯(500ml)=180kcal
- 咖啡(美式)：1杯=15kcal
- 咖啡(拿铁)：1杯(300ml)=180kcal

**外卖常见菜品**
- 黄焖鸡米饭：1份=650kcal
- 宫保鸡丁盖饭：1份=680kcal
- 鱼香肉丝盖饭：1份=720kcal
- 麻辣烫(素)：1份(400g)=350kcal
- 麻辣烫(加肉)：1份(500g)=520kcal
- 重庆小面：1碗=520kcal
- 卤肉饭：1份=720kcal

**坚果零食**
- 杏仁/核桃：30g=180-200kcal
- 薯片：1包(75g)=380kcal
- 巧克力：1块(40g)=220kcal
`;

/**
 * 上传图片到云存储并获取 fileID
 */
async function uploadImageToCloud(imagePath) {
  if (!imagePath || !wx.cloud) {
    return null;
  }

  try {
    const cloudPath = `meal-images/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
    const result = await wx.cloud.uploadFile({
      cloudPath,
      filePath: imagePath,
    });
    return result.fileID;
  } catch (error) {
    console.error("[ai-service] uploadImage failed:", error);
    return null;
  }
}

/**
 * 图片识别 - 识别食物
 * 由于微信云开发暂无直接的图像识别API，这里使用 AI 来分析图片描述
 */
async function recognizeFoodFromImage(imagePath) {
  if (!imagePath) {
    return null;
  }

  // 当前方案：引导用户描述图片内容
  // 未来可以接入腾讯云图像识别 API
  return {
    success: false,
    message: "请描述图片中的食物内容",
    foods: [],
  };
}

/**
 * 调用 AI 分析餐食
 */
async function analyzeMealWithAI(params) {
  const { voiceNote, mealType, context, imagePath, recognizedFoods } = params;
  
  const profile = context?.profile || {};
  const todaySummary = context?.todaySummary || {};
  
  // 构建提示词，包含图片识别结果（如果有）
  const prompt = buildAnalysisPrompt(voiceNote, mealType, profile, todaySummary, !!imagePath, recognizedFoods);
  
  if (!wx.cloud) {
    throw new Error("当前环境未启用云开发");
  }
  
  try {
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
 * 构建分析提示词（嵌入食物数据库）
 */
function buildAnalysisPrompt(voiceNote, mealType, profile, todaySummary, hasImage, recognizedFoods) {
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

  let foodHint = "";
  if (recognizedFoods && recognizedFoods.length > 0) {
    foodHint = `\n【图片识别结果】\n识别到的食物：${recognizedFoods.map(f => f.name).join("、")}\n`;
  }
  
  return [
    "你是一位专业的营养师，请根据以下食物营养数据库分析用户餐食。",
    "",
    FOOD_DATABASE,
    foodHint,
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
    '{"mealName":"餐食名称","calories":热量数值,"protein":蛋白质克数,"carbs":碳水克数,"fat":脂肪克数,"scoreTitle":"简短评价","suggestion":"针对用户目标和今日摄入的具体建议，30-50字","identifiedFoods":[{"name":"食物名称","portion":"份量估计","cookingMethod":"烹饪方式"}]}',
    "",
    "【估算原则】",
    "1. 根据描述从食物数据库中匹配最接近的食物",
    "2. 多种食材时叠加计算",
    "3. 外卖热量通常比家常菜高20%",
    "4. 油炸食品热量乘以1.3",
    "5. 建议要结合用户目标和今日已摄入",
  ].join("\n");
}

/**
 * 解析 AI 返回的分析结果
 */
function parseAnalysisResult(reply, voiceNote, mealType) {
  try {
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
          reason: "AI 分析完成，基于食物营养数据库估算。",
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
  
  return {
    guessedMealName: "餐食分析",
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    scoreTitle: "AI 分析完成",
    suggestion: reply,
    identifiedFoods: [],
    confidence: { level: "medium", reason: "AI 返回格式异常，请参考建议。" },
    warnings: [],
    notes: ["AI 返回了文本建议，请手动确认营养数据。"],
    needsMoreInfo: true,
    aiPowered: true,
  };
}

/**
 * AI 教练对话
 */
async function chatWithCoach(userMessage, history, context) {
  if (!wx.cloud) {
    throw new Error("当前环境未启用云开发");
  }
  
  const profile = context?.profile || {};
  const todaySummary = context?.todaySummary || {};
  
  const systemPrompt = [
    "你是「瘦了吗」的 AI 营养师，负责回答饮食、体重管理、训练后补给、外卖选择和习惯养成问题。",
    "回答要求：",
    "1. 默认用简体中文回答，语气温和、直接、可执行。",
    "2. 结合用户画像和今日摄入给出建议。",
    "3. 优先给出具体替换方案、份量建议和下一餐行动。",
    "4. 不要假装医生；涉及疾病时，建议咨询医生。",
    "",
    FOOD_DATABASE,
    "",
    "用户信息：",
    `目标：${profile.goal || "减脂"}`,
    `今日已摄入：${todaySummary.calories || 0} kcal`,
  ].join("\n");
  
  const messages = [
    { role: "system", content: systemPrompt },
    ...(history || []).slice(-8),
    { role: "user", content: userMessage },
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

/**
 * 完整的餐食分析流程（图片识别 + AI 分析）
 * @param {Object} params
 * @param {string} params.imagePath - 本地图片路径
 * @param {string} params.voiceNote - 文字描述
 * @param {string} params.mealType - 餐食类型
 * @param {Object} params.context - 用户上下文
 * @returns {Promise<Object>} - 分析结果
 */
async function analyzeMealWithImage(params) {
  const { imagePath, voiceNote, mealType, context } = params;
  
  // 1. 如果有图片，先上传到云存储（用于保存记录）
  let fileID = null;
  if (imagePath) {
    fileID = await uploadImageToCloud(imagePath);
  }
  
  // 2. 调用 AI 分析（当前方案：基于文字描述分析）
  const result = await analyzeMealWithAI({
    voiceNote,
    mealType,
    context,
    imagePath,
    recognizedFoods: null, // 暂不支持图片识别
  });
  
  // 3. 返回结果（包含 fileID 用于后续保存）
  return {
    ...result,
    fileID,
  };
}

module.exports = {
  analyzeMealWithAI,
  analyzeMealWithImage,
  chatWithCoach,
  uploadImageToCloud,
};
