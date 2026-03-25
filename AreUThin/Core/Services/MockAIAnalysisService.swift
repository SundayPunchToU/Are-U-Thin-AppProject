import Foundation

struct MealAnalysisPromptSet: Hashable {
    let system: String
    let context: String
    let task: String
}

enum MealAnalysisPromptBuilder {
    static let systemPrompt = """
    你是 Are-U-Thin 的 AI 营养分析 Agent，一位懂营养、会看图、语气温和的陪伴型健康助手。
    你的任务是结合餐食图片与用户补充说明，识别主要食物、估计分量和做法，输出热量与三大营养素估算，并结合用户目标生成温和、非评判性的反馈。

    规则：
    1. 优先参考用户补充说明；若图片与文字冲突，以用户描述为准，并在 notes 中说明。
    2. 允许对中式复合菜、外卖和隐藏油脂做保守估算，但不要假装精确。
    3. 如果图片不清晰或信息不足，必须承认不确定性，可返回 need_more_info。
    4. 不要输出羞辱、责备、焦虑化表达，不要做医学诊断。
    5. 最终只输出合法 JSON，不要输出 markdown 或额外解释。
    """

    static func buildPromptSet(for request: MealAnalysisRequest) -> MealAnalysisPromptSet {
        MealAnalysisPromptSet(
            system: systemPrompt,
            context: contextPrompt(from: request.context),
            task: taskPrompt(for: request)
        )
    }

    static func contextPrompt(from context: MealAnalysisUserContext) -> String {
        """
        【用户上下文】
        - goal: \(context.goal.rawValue)
        - age: \(context.age)
        - heightCm: \(Int(context.heightCm))
        - weightKg: \(Int(context.weightKg))
        - activityLevel: \(context.activityLevel)
        - activityFactor: \(context.activityFactor)
        - dailyCalorieTarget: \(context.dailyCalorieTarget)
        - dailyProteinTarget: \(Int(context.dailyProteinTarget))
        - dailyCarbTarget: \(Int(context.dailyCarbTarget))
        - dailyFatTarget: \(Int(context.dailyFatTarget))
        - consumedCaloriesToday: \(context.consumedCaloriesToday)
        - consumedProteinToday: \(Int(context.consumedProteinToday))
        - consumedCarbsToday: \(Int(context.consumedCarbsToday))
        - consumedFatToday: \(Int(context.consumedFatToday))
        - mealType: \(context.mealType.rawValue)
        - isTrainingDay: \(boolLabel(context.isTrainingDay))
        - isTakeout: \(boolLabel(context.isTakeout))
        - lowOilTag: \(boolLabel(context.lowOilTag))
        - extraTags: \(tagList(context.extraTags))

        请结合用户目标与今天整体节奏生成温和、支持式、非焦虑化的反馈。
        """
    }

    static func taskPrompt(for request: MealAnalysisRequest) -> String {
        """
        【任务】
        请分析当前这餐的图片，并结合用户补充说明完成营养分析。
        当前这餐补充说明：\(request.mealDescriptionText)

        输出要求：
        - 只输出 JSON；
        - 优先参考用户文字说明；
        - 若无法可靠识别，可返回 need_more_info，并在 notes 中温和说明需要更多信息。
        """
    }

    private static func boolLabel(_ value: Bool) -> String {
        value ? "true" : "false"
    }

    private static func tagList(_ tags: [String]) -> String {
        tags.isEmpty ? "[]" : "[" + tags.joined(separator: ", ") + "]"
    }
}


struct MockAIAnalysisService: AIAnalysisService {
    func analyzeMeal(request: MealAnalysisRequest) async throws -> MealAnalysisResult {
        try await Task.sleep(nanoseconds: 1_000_000_000)

        _ = MealAnalysisPromptBuilder.buildPromptSet(for: request)
        let lower = request.mealDescriptionText.lowercased()
        let goal = request.context.goal

        if request.imageData == nil {
            return MealAnalysisResult(
                analysisStatus: .needMoreInfo,
                guessedMealName: "需要更多信息",
                calories: nil,
                protein: nil,
                carbs: nil,
                fat: nil,
                confidence: MealAnalysisConfidence(
                    level: .low,
                    reason: "当前缺少清晰图片，暂时无法给出稳定估算。"
                ),
                scoreTitle: "再补一点信息会更准",
                suggestion: "这次我先不勉强给数字啦，补一张更清晰的照片或多说一点分量，会更容易得到靠谱结果。",
                warnings: ["图片信息不足，当前无法可靠识别。"],
                notes: ["当前返回为 need_more_info，避免假装精确。"]
            )
        }

        if lower.contains("牛肉") {
            return MealAnalysisResult(
                guessedMealName: "西兰花炒牛肉",
                identifiedFoods: [
                    IdentifiedFood(name: "牛肉", estimatedPortion: "约120g", cookingMethod: "炒"),
                    IdentifiedFood(name: "西兰花", estimatedPortion: "约100g", cookingMethod: "清炒/焯水"),
                    IdentifiedFood(name: "米饭", estimatedPortion: "半碗", cookingMethod: "蒸")
                ],
                nutrition: Nutrition(calories: 460, protein: 35, carbs: 22, fat: 24),
                confidence: MealAnalysisConfidence(
                    level: .medium,
                    reason: "结合用户描述做了实用估算，炒菜用油和牛肉肥瘦会带来少量波动。"
                ),
                scoreTitle: scoreTitle(for: goal, positive: "蛋白质补得不错"),
                suggestion: suggestion(for: goal, kind: .beefMeal),
                notes: buildNotes(from: request)
            )
        }

        if lower.contains("炸鸡") || lower.contains("蛋糕") {
            return MealAnalysisResult(
                guessedMealName: "高能量加餐",
                identifiedFoods: [
                    IdentifiedFood(name: lower.contains("炸鸡") ? "炸鸡" : "蛋糕", estimatedPortion: "1份", cookingMethod: "即食/油炸/烘焙")
                ],
                nutrition: Nutrition(calories: 520, protein: 18, carbs: 48, fat: 28),
                confidence: MealAnalysisConfidence(
                    level: .medium,
                    reason: "这类食物的酱料和实际份量差异较大，当前为保守估算。"
                ),
                scoreTitle: scoreTitle(for: goal, positive: "这一餐能量更充足"),
                suggestion: suggestion(for: goal, kind: .treatMeal),
                warnings: ["油炸或甜点类食物的实际用油和糖量可能带来误差。"],
                notes: buildNotes(from: request, extra: "对隐藏油脂和糖分做了保守估算。")
            )
        }

        return MealAnalysisResult(
            guessedMealName: "家常均衡餐",
            identifiedFoods: [
                IdentifiedFood(name: "主菜", estimatedPortion: "1份", cookingMethod: "家常烹调"),
                IdentifiedFood(name: "米饭", estimatedPortion: "约1碗", cookingMethod: "蒸")
            ],
            nutrition: Nutrition(calories: 380, protein: 24, carbs: 42, fat: 13),
            confidence: MealAnalysisConfidence(
                level: .medium,
                reason: "当前根据图片主体和文字说明做了实用估算，适合前端演示与节奏追踪。"
            ),
            scoreTitle: scoreTitle(for: goal, positive: "轻松平衡的一餐"),
            suggestion: suggestion(for: goal, kind: .balancedMeal),
            notes: buildNotes(from: request)
        )
    }
}

private extension MockAIAnalysisService {
    enum MockMealKind {
        case beefMeal
        case treatMeal
        case balancedMeal
    }

    func scoreTitle(for goal: GoalType, positive: String) -> String {
        switch goal {
        case .cut:
            return positive
        case .build:
            return positive.replacingOccurrences(of: "不错", with: "很稳")
        case .maintain:
            return positive
        }
    }

    func suggestion(for goal: GoalType, kind: MockMealKind) -> String {
        switch (goal, kind) {
        case (.cut, .beefMeal):
            return "这餐蛋白质补得不错，整体节奏也比较稳，很适合减脂阶段。后面按平常节奏吃就好，下一餐清爽一点会更舒服。"
        case (.cut, .treatMeal):
            return "这一餐能量稍微充足一些也没关系，接下来回到蔬菜和蛋白质优先就很好，不用急着苛责自己。"
        case (.cut, .balancedMeal):
            return "整体是轻松稳定的一餐，继续把饱腹感和节奏感放在前面，就已经做得很好了。"
        case (.build, .beefMeal):
            return "这餐对补蛋白和恢复都挺友好，作为增肌阶段的一餐很稳。训练日继续把能量吃够，比纠结小误差更重要。"
        case (.build, .treatMeal):
            return "这餐能量会更足一些，如果今天有训练，其实也能提供恢复支持。接下来把蛋白质补齐，整体节奏就会更舒服。"
        case (.build, .balancedMeal):
            return "这一餐比较平衡，适合继续稳稳地给身体供能。后面如果还有训练，可以再补一点蛋白质或主食。"
        case (.maintain, .beefMeal):
            return "蛋白质补得挺不错，整体也不算太重，作为维持阶段的一餐很合适。继续保持这种轻松稳定的节奏就很好。"
        case (.maintain, .treatMeal):
            return "偶尔吃到能量更足的一餐也很正常，不需要紧张。后面回到平常节奏，身体会自己慢慢找回平衡。"
        case (.maintain, .balancedMeal):
            return "这餐整体比较平稳，作为日常记录很合适。维持阶段更重要的是长期轻松、不过度波动，你现在的节奏就不错。"
        }
    }

    func buildNotes(from request: MealAnalysisRequest, extra: String? = nil) -> [String] {
        var notes: [String] = []
        if request.context.isTakeout {
            notes.append("外卖和酱汁可能带来少量隐藏油脂，已做保守估算。")
        }
        if request.context.lowOilTag {
            notes.append("本次优先参考了用户提供的少油说明。")
        }
        if !request.context.extraTags.isEmpty {
            notes.append("已结合标签信息进行估算：\(request.context.extraTags.joined(separator: "、"))。")
        }
        if let extra {
            notes.append(extra)
        }
        if notes.isEmpty {
            notes.append("当前结果为实用估算，适合用于今日节奏追踪。")
        }
        return notes
    }
}
