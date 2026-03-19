import Foundation
import SwiftUI

@MainActor
final class AppStore: ObservableObject {
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

    var streakDays: Int {
        max(7, min(30, mealLogs.count * 3))
    }

    func completeOnboarding(profile: UserProfile) {
        userProfile = profile
    }

    func addMockDataIfNeeded() {
        guard mealLogs.isEmpty else { return }
        mealLogs = [
            MealLog(
                timestamp: Date().addingTimeInterval(-3600 * 8),
                name: "酸奶燕麦碗",
                note: "早餐",
                nutrition: Nutrition(calories: 310, protein: 18, carbs: 41, fat: 9),
                scoreTitle: "控糖友好"
            ),
            MealLog(
                timestamp: Date().addingTimeInterval(-3600 * 4),
                name: "鸡胸肉藜麦沙拉",
                note: "午餐",
                nutrition: Nutrition(calories: 390, protein: 34, carbs: 29, fat: 12),
                scoreTitle: "高蛋白一餐"
            )
        ]

        if latestSuggestion.isEmpty {
            latestSuggestion = "今天做得很稳，晚餐优先蒸煮类，睡前补 15g 蛋白质会更好。"
        }
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
        lastAnalysis = result
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
