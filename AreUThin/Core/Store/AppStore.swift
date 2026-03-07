import Foundation

@MainActor
final class AppStore: ObservableObject {
    @Published var userProfile: UserProfile?
    @Published var mealLogs: [MealLog] = []
    @Published var latestSuggestion: String = ""

    private let service: AIAnalysisService

    init(service: AIAnalysisService) {
        self.service = service
    }

    var todaySummary: Nutrition {
        let calendar = Calendar.current
        return mealLogs
            .filter { calendar.isDateInToday($0.timestamp) }
            .reduce(.zero) { partial, item in
                Nutrition(
                    calories: partial.calories + item.nutrition.calories,
                    protein: partial.protein + item.nutrition.protein,
                    carbs: partial.carbs + item.nutrition.carbs,
                    fat: partial.fat + item.nutrition.fat
                )
            }
    }

    var calorieProgress: Double {
        guard let target = userProfile?.dailyCalorieTarget, target > 0 else { return 0 }
        return min(1.0, Double(todaySummary.calories) / Double(target))
    }

    func completeOnboarding(profile: UserProfile) {
        userProfile = profile
    }

    func addMockDataIfNeeded() {
        guard mealLogs.isEmpty else { return }
        mealLogs = [
            MealLog(
                timestamp: Date().addingTimeInterval(-3600 * 4),
                name: "鸡胸肉沙拉",
                note: "午餐",
                nutrition: Nutrition(calories: 350, protein: 33, carbs: 18, fat: 14),
                scoreTitle: "完美一餐"
            )
        ]
    }

    func analyzeAndSaveMeal(imageData: Data?, voiceNote: String) async throws {
        let result = try await service.analyzeMeal(imageData: imageData, voiceNote: voiceNote)
        let log = MealLog(
            timestamp: Date(),
            name: result.guessedName,
            note: voiceNote,
            nutrition: result.nutrition,
            scoreTitle: result.scoreTitle
        )
        mealLogs.insert(log, at: 0)
        latestSuggestion = result.suggestion
    }
}
