import Foundation

enum GoalType: String, CaseIterable, Identifiable, Codable, Hashable {
    case cut = "减脂"
    case build = "增肌"
    case maintain = "维持"

    var id: String { rawValue }

    var emoji: String {
        switch self {
        case .cut: return "🔥"
        case .build: return "💪"
        case .maintain: return "🌿"
        }
    }

    var supportiveTitle: String {
        switch self {
        case .cut: return "轻盈减脂中"
        case .build: return "稳定增肌中"
        case .maintain: return "保持平衡中"
        }
    }

    var supportiveSubtitle: String {
        switch self {
        case .cut: return "关注热量缺口，也别忘了吃得舒服。"
        case .build: return "优先保证蛋白质和训练日能量。"
        case .maintain: return "保持节奏感，让健康更轻松。"
        }
    }

    var calorieDelta: Int {
        switch self {
        case .cut: return -300
        case .build: return 250
        case .maintain: return 0
        }
    }
}

struct UserProfile {
    var age: Int
    var heightCm: Double
    var weightKg: Double
    var activityFactor: Double
    var goal: GoalType

    var dailyCalorieTarget: Int {
        let bmr = 10.0 * weightKg + 6.25 * heightCm - 5.0 * Double(age) + 5
        return max(1200, Int(bmr * activityFactor) + goal.calorieDelta)
    }

    var macroPlan: MacroPlan {
        switch goal {
        case .cut:
            return MacroPlan(proteinRatio: 0.33, carbRatio: 0.37, fatRatio: 0.30)
        case .build:
            return MacroPlan(proteinRatio: 0.30, carbRatio: 0.45, fatRatio: 0.25)
        case .maintain:
            return MacroPlan(proteinRatio: 0.30, carbRatio: 0.40, fatRatio: 0.30)
        }
    }

    var proteinTarget: Double {
        Double(dailyCalorieTarget) * macroPlan.proteinRatio / 4.0
    }

    var carbTarget: Double {
        Double(dailyCalorieTarget) * macroPlan.carbRatio / 4.0
    }

    var fatTarget: Double {
        Double(dailyCalorieTarget) * macroPlan.fatRatio / 9.0
    }
}

struct MacroPlan {
    let proteinRatio: Double
    let carbRatio: Double
    let fatRatio: Double
}
