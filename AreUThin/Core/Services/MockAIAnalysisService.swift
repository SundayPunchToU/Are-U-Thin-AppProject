import Foundation

struct MockAIAnalysisService: AIAnalysisService {
    func analyzeMeal(imageData: Data?, voiceNote: String) async throws -> MealAnalysisResult {
        try await Task.sleep(nanoseconds: 1_000_000_000)

        let lower = voiceNote.lowercased()
        if lower.contains("牛肉") {
            return MealAnalysisResult(
                guessedName: "西兰花炒牛肉",
                nutrition: Nutrition(calories: 460, protein: 35, carbs: 22, fat: 24),
                scoreTitle: "高蛋白一餐",
                suggestion: "今天蛋白质完成度不错，下一餐尽量少油。"
            )
        }

        if lower.contains("炸鸡") || lower.contains("蛋糕") {
            return MealAnalysisResult(
                guessedName: "高热量加餐",
                nutrition: Nutrition(calories: 520, protein: 18, carbs: 48, fat: 28),
                scoreTitle: "热量刺客",
                suggestion: "没关系，饭后走路 15 分钟，下一餐选清淡。"
            )
        }

        return MealAnalysisResult(
            guessedName: "家常餐",
            nutrition: Nutrition(calories: 380, protein: 24, carbs: 42, fat: 13),
            scoreTitle: "均衡一餐",
            suggestion: "整体不错，晚餐优先补一点优质蛋白。"
        )
    }
}
