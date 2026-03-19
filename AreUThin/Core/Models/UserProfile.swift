import Foundation

enum GoalType: String, CaseIterable, Identifiable {
    case rapidCut = "极速减脂"
    case steadyCut = "稳健减脂"
    case build = "增肌"
    case maintain = "维持"

    var id: String { rawValue }

    var calorieDelta: Int {
        switch self {
        case .rapidCut: return -500
        case .steadyCut: return -300
        case .build: return 300
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
        case .rapidCut, .steadyCut:
            return MacroPlan(proteinRatio: 0.35, carbRatio: 0.35, fatRatio: 0.30)
        case .build:
            return MacroPlan(proteinRatio: 0.30, carbRatio: 0.45, fatRatio: 0.25)
        case .maintain:
            return MacroPlan(proteinRatio: 0.30, carbRatio: 0.40, fatRatio: 0.30)
        }
    }
}

struct MacroPlan {
    let proteinRatio: Double
    let carbRatio: Double
    let fatRatio: Double
}
