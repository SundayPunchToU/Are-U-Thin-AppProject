import Foundation
import SwiftUI

@MainActor
final class AppStore: ObservableObject {
    @Published var selectedTab: AppTab = .home
    @Published var userProfile: UserProfile?
    @Published var mealLogs: [MealLog] = []
    @Published var latestSuggestion: String = ""
    @Published var lastAnalysis: MealAnalysisResult?

    @Published var storyProfiles: [StoryProfile] = []
    @Published var inspirationFeed: [InspirationPost] = []
    @Published var weeklyTrend: [DayTrend] = []
    @Published var badges: [BadgeItem] = []

    @Published var coachMessages: [CoachMessage] = []
    @Published var reminderAtNight: Bool = true
    @Published var useVoiceEnhancement: Bool = true
    @Published var socialPosterEnabled: Bool = true

    private let service: AIAnalysisService

    init(service: AIAnalysisService) {
        self.service = service
        seedFrontendData()
    }

    var todayMeals: [MealLog] {
        let calendar = Calendar.current
        return mealLogs
            .filter { calendar.isDateInToday($0.timestamp) }
            .sorted { $0.timestamp > $1.timestamp }
    }

    var todaySummary: Nutrition {
        todayMeals.reduce(.zero) { partial, item in
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

    var remainingCalories: Int {
        guard let target = userProfile?.dailyCalorieTarget else { return 0 }
        return target - todaySummary.calories
    }

    var goalHeadline: String {
        userProfile?.goal.supportiveTitle ?? "先设定你的健康目标"
    }

    var goalSubtitle: String {
        userProfile?.goal.supportiveSubtitle ?? "拍照记录每一餐，让身体节奏慢慢清晰起来。"
    }

    var streakDays: Int {
        let calendar = Calendar.current
        return Set(mealLogs.map { calendar.startOfDay(for: $0.timestamp) }).count
    }

    var weeklyCalorieTrend: [DayTrend] {
        let calendar = Calendar.current
        let target = userProfile?.dailyCalorieTarget ?? 0

        return (0..<7).reversed().map { offset in
            let date = calendar.date(byAdding: .day, value: -offset, to: Date()) ?? Date()
            let calories = mealLogs
                .filter { calendar.isDate($0.timestamp, inSameDayAs: date) }
                .reduce(0) { $0 + $1.nutrition.calories }
            return DayTrend(label: dayLabel(for: date), calories: calories, target: target, weight: 0)
        }
    }

    var weeklyAverageCalories: Int {
        let trend = weeklyCalorieTrend
        guard !trend.isEmpty else { return 0 }
        return trend.map(\.calories).reduce(0, +) / trend.count
    }

    var weeklyInsight: String {
        guard let profile = userProfile else {
            return "先设定目标，再开始记录你的每日饮食节奏。"
        }

        let delta = weeklyAverageCalories - profile.dailyCalorieTarget
        if abs(delta) <= 120 {
            return "这周整体很稳，继续保持现在的记录节奏就很好。"
        } else if delta < 0 {
            return "这周摄入整体偏轻一些，记得给自己留出足够能量和恢复空间。"
        } else {
            return "这周比目标多一点点，也没关系，下一餐回到蔬菜和蛋白质优先就好。"
        }
    }

    func completeOnboarding(profile: UserProfile) {
        userProfile = profile
        selectedTab = .home
    }

    func updateGoal(_ goal: GoalType) {
        guard var profile = userProfile else { return }
        profile.goal = goal
        userProfile = profile
    }

    func addMockDataIfNeeded() {
        guard mealLogs.isEmpty else { return }
        let calendar = Calendar.current

        func stamp(dayOffset: Int, hour: Int) -> Date {
            let day = calendar.date(byAdding: .day, value: dayOffset, to: Date()) ?? Date()
            return calendar.date(bySettingHour: hour, minute: 0, second: 0, of: day) ?? day
        }

        let samples: [(Int, Int, String, String, Nutrition, String)] = [
            (-6, 8, "香蕉花生酱吐司", "早餐", Nutrition(calories: 360, protein: 14, carbs: 42, fat: 15), "早餐有满足感"),
            (-6, 13, "照烧鸡腿饭", "午餐", Nutrition(calories: 620, protein: 32, carbs: 68, fat: 22), "补能量的一餐"),
            (-5, 9, "酸奶水果杯", "早餐", Nutrition(calories: 320, protein: 17, carbs: 38, fat: 10), "清爽开场"),
            (-5, 19, "三文鱼牛油果卷", "晚餐", Nutrition(calories: 690, protein: 34, carbs: 52, fat: 28), "脂肪比例更友好"),
            (-4, 12, "番茄牛肉意面", "午餐", Nutrition(calories: 560, protein: 28, carbs: 63, fat: 18), "碳水补得刚好"),
            (-3, 8, "鸡蛋燕麦杯", "早餐", Nutrition(calories: 330, protein: 20, carbs: 36, fat: 11), "蛋白质起步不错"),
            (-3, 18, "轻烤鸡胸能量碗", "晚餐", Nutrition(calories: 640, protein: 39, carbs: 58, fat: 19), "晚餐很稳"),
            (-2, 13, "菌菇牛肉饭", "午餐", Nutrition(calories: 610, protein: 31, carbs: 66, fat: 20), "训练日也适合"),
            (-1, 9, "拿铁加全麦三明治", "早餐", Nutrition(calories: 340, protein: 18, carbs: 35, fat: 13), "外带也能平衡"),
            (-1, 13, "鸡胸肉藜麦沙拉", "午餐", Nutrition(calories: 520, protein: 35, carbs: 34, fat: 17), "高蛋白一餐"),
            (0, 8, "酸奶燕麦碗", "早餐", Nutrition(calories: 310, protein: 18, carbs: 41, fat: 9), "控糖友好"),
            (0, 12, "鸡胸肉藜麦沙拉", "午餐", Nutrition(calories: 390, protein: 34, carbs: 29, fat: 12), "高蛋白一餐")
        ]

        mealLogs = samples.map { sample in
            MealLog(
                timestamp: stamp(dayOffset: sample.0, hour: sample.1),
                name: sample.2,
                note: sample.3,
                nutrition: sample.4,
                scoreTitle: sample.5
            )
        }
        .sorted { $0.timestamp > $1.timestamp }

        if latestSuggestion.isEmpty {
            latestSuggestion = "今天已经有一个不错的开始了，晚餐继续优先蔬菜和蛋白质就很好。"
        }
    }

    func analyzeMealPreview(imageData: Data?, voiceNote: String) async throws -> MealAnalysisResult {
        let request = buildMealAnalysisRequest(imageData: imageData, voiceNote: voiceNote)
        let result = try await service.analyzeMeal(request: request)
        lastAnalysis = result
        return result
    }

    func saveAnalyzedMeal(_ result: MealAnalysisResult, voiceNote: String) {
        let log = MealLog(
            timestamp: Date(),
            name: result.guessedMealName,
            note: voiceNote,
            nutrition: result.nutrition,
            scoreTitle: result.scoreTitle
        )
        mealLogs.insert(log, at: 0)
        latestSuggestion = result.suggestion
        lastAnalysis = result
    }

    func analyzeAndSaveMeal(imageData: Data?, voiceNote: String) async throws {
        let result = try await analyzeMealPreview(imageData: imageData, voiceNote: voiceNote)
        saveAnalyzedMeal(result, voiceNote: voiceNote)
    }

    private func buildMealAnalysisRequest(imageData: Data?, voiceNote: String) -> MealAnalysisRequest {
        let lower = voiceNote.lowercased()
        let tags = detectedTags(from: voiceNote)
        let context = MealAnalysisUserContext(
            goal: userProfile?.goal ?? .maintain,
            age: userProfile?.age ?? 25,
            heightCm: userProfile?.heightCm ?? 165,
            weightKg: userProfile?.weightKg ?? 60,
            activityLevel: activityLevelLabel(for: userProfile?.activityFactor ?? 1.4),
            activityFactor: userProfile?.activityFactor ?? 1.4,
            dailyCalorieTarget: userProfile?.dailyCalorieTarget ?? 1800,
            dailyProteinTarget: userProfile?.proteinTarget ?? 120,
            dailyCarbTarget: userProfile?.carbTarget ?? 180,
            dailyFatTarget: userProfile?.fatTarget ?? 60,
            consumedCaloriesToday: todaySummary.calories,
            consumedProteinToday: todaySummary.protein,
            consumedCarbsToday: todaySummary.carbs,
            consumedFatToday: todaySummary.fat,
            mealType: inferMealType(),
            isTrainingDay: lower.contains("训练"),
            isTakeout: lower.contains("外卖"),
            lowOilTag: lower.contains("少油"),
            extraTags: tags
        )

        return MealAnalysisRequest(
            imageData: imageData,
            mealDescriptionText: voiceNote,
            context: context
        )
    }

    private func inferMealType(from date: Date = Date()) -> MealType {
        let hour = Calendar.current.component(.hour, from: date)
        switch hour {
        case 5..<11: return .breakfast
        case 11..<15: return .lunch
        case 17..<22: return .dinner
        default: return .snack
        }
    }

    private func detectedTags(from text: String) -> [String] {
        let candidates = ["少油", "外卖", "训练后", "加餐", "早餐", "午餐", "晚餐"]
        return candidates.filter { text.contains($0) }
    }

    private func activityLevelLabel(for factor: Double) -> String {
        switch factor {
        case ..<1.35: return "久坐"
        case ..<1.5: return "轻活动"
        case ..<1.7: return "中等活动"
        default: return "高活动"
        }
    }

    func sendCoachMessage(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        coachMessages.append(CoachMessage(text: trimmed, fromUser: true, date: Date()))
        let reply = generateCoachReply(for: trimmed)

        Task {
            try? await Task.sleep(nanoseconds: 650_000_000)
            self.coachMessages.append(CoachMessage(text: reply, fromUser: false, date: Date()))
        }
    }

    func applyQuickPrompt(_ prompt: String) {
        sendCoachMessage(prompt)
    }

    private func generateCoachReply(for input: String) -> String {
        if input.contains("夜宵") {
            return "想吃夜宵时先喝一杯温水，再选希腊酸奶或低脂奶，控制在 150 kcal 内。"
        }
        if input.contains("外卖") {
            return "外卖优先顺序：蒸煮蛋白质 > 绿叶菜 > 主食半份。这样更容易达成今日目标。"
        }
        if input.contains("增肌") {
            return "增肌日建议每餐至少 25g 蛋白质，训练后 1 小时内补充碳水 + 蛋白会更高效。"
        }
        return "这顿不用焦虑，你已经在可控范围内。下一餐多一点蛋白和蔬菜就能拉回平衡。"
    }

    private func dayLabel(for date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "zh_CN")
        formatter.dateFormat = "E"
        return formatter.string(from: date)
    }

    private func seedFrontendData() {
        storyProfiles = [
            StoryProfile(name: "小林", emoji: "🥗"),
            StoryProfile(name: "阿晴", emoji: "🍣"),
            StoryProfile(name: "Kevin", emoji: "🏋️"),
            StoryProfile(name: "Nana", emoji: "🥑"),
            StoryProfile(name: "Mia", emoji: "🍱")
        ]

        inspirationFeed = [
            InspirationPost(
                title: "低卡麻辣烫替换法",
                subtitle: "主食半份 + 双份蔬菜 + 去芝麻酱",
                calories: 420,
                gradient: [Color(red: 1.00, green: 0.75, blue: 0.62), Color(red: 1.00, green: 0.60, blue: 0.55)],
                badge: "热门"
            ),
            InspirationPost(
                title: "健身日高蛋白晚餐",
                subtitle: "鸡胸 + 土豆泥 + 西兰花",
                calories: 510,
                gradient: [Color(red: 0.65, green: 0.89, blue: 0.80), Color(red: 0.45, green: 0.78, blue: 0.73)],
                badge: "推荐"
            ),
            InspirationPost(
                title: "办公室控糖下午茶",
                subtitle: "无糖酸奶 + 蓝莓 + 坚果 10g",
                calories: 240,
                gradient: [Color(red: 1.00, green: 0.88, blue: 0.66), Color(red: 0.99, green: 0.73, blue: 0.45)],
                badge: "轻食"
            )
        ]

        weeklyTrend = [
            DayTrend(label: "Mon", calories: 1520, target: 1750, weight: 63.6),
            DayTrend(label: "Tue", calories: 1690, target: 1750, weight: 63.4),
            DayTrend(label: "Wed", calories: 1610, target: 1750, weight: 63.3),
            DayTrend(label: "Thu", calories: 1790, target: 1750, weight: 63.5),
            DayTrend(label: "Fri", calories: 1570, target: 1750, weight: 63.2),
            DayTrend(label: "Sat", calories: 1710, target: 1750, weight: 63.1),
            DayTrend(label: "Sun", calories: 1490, target: 1750, weight: 63.0)
        ]

        badges = [
            BadgeItem(title: "连续打卡", subtitle: "7/7", emoji: "🔥", progress: 1.0, unlocked: true),
            BadgeItem(title: "蛋白达人", subtitle: "4/7", emoji: "💪", progress: 0.57, unlocked: false),
            BadgeItem(title: "控糖挑战", subtitle: "6/7", emoji: "🍵", progress: 0.86, unlocked: false)
        ]

        coachMessages = [
            CoachMessage(text: "嗨，我是你的 AI 营养师。你可以直接问我：今天晚餐吃什么更稳？", fromUser: false, date: Date())
        ]
    }
}
