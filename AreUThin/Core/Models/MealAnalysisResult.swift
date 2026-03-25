import Foundation

enum MealAnalysisStatus: String, Codable, Hashable {
    case ok
    case needMoreInfo = "need_more_info"
}

enum MealConfidenceLevel: String, Codable, Hashable {
    case high
    case medium
    case low
}

struct IdentifiedFood: Codable, Hashable {
    let name: String
    let estimatedPortion: String
    let cookingMethod: String
}

struct MealAnalysisConfidence: Codable, Hashable {
    let level: MealConfidenceLevel
    let reason: String

    static let mediumDefault = MealAnalysisConfidence(
        level: .medium,
        reason: "本次结果为实用估算，实际份量和用油会带来少量波动。"
    )
}

enum MealType: String, Codable, Hashable {
    case breakfast = "早餐"
    case lunch = "午餐"
    case dinner = "晚餐"
    case snack = "加餐"
    case unknown = "未知"
}

struct MealAnalysisUserContext: Codable, Hashable {
    let goal: GoalType
    let age: Int
    let heightCm: Double
    let weightKg: Double
    let activityLevel: String
    let activityFactor: Double
    let dailyCalorieTarget: Int
    let dailyProteinTarget: Double
    let dailyCarbTarget: Double
    let dailyFatTarget: Double
    let consumedCaloriesToday: Int
    let consumedProteinToday: Double
    let consumedCarbsToday: Double
    let consumedFatToday: Double
    let mealType: MealType
    let isTrainingDay: Bool
    let isTakeout: Bool
    let lowOilTag: Bool
    let extraTags: [String]
}

struct MealAnalysisRequest: Codable, Hashable {
    let imageData: Data?
    let mealDescriptionText: String
    let context: MealAnalysisUserContext
}


struct MealAnalysisResult: Codable, Hashable {
    let analysisStatus: MealAnalysisStatus
    let guessedMealName: String
    let identifiedFoods: [IdentifiedFood]
    let calories: Int?
    let protein: Double?
    let carbs: Double?
    let fat: Double?
    let confidence: MealAnalysisConfidence
    let scoreTitle: String
    let suggestion: String
    let warnings: [String]
    let notes: [String]

    var guessedName: String { guessedMealName }

    var nutrition: Nutrition {
        Nutrition(
            calories: calories ?? 0,
            protein: protein ?? 0,
            carbs: carbs ?? 0,
            fat: fat ?? 0
        )
    }

    var needsMoreInfo: Bool {
        analysisStatus == .needMoreInfo
    }

    init(
        analysisStatus: MealAnalysisStatus = .ok,
        guessedMealName: String,
        identifiedFoods: [IdentifiedFood] = [],
        calories: Int?,
        protein: Double?,
        carbs: Double?,
        fat: Double?,
        confidence: MealAnalysisConfidence = .mediumDefault,
        scoreTitle: String,
        suggestion: String,
        warnings: [String] = [],
        notes: [String] = []
    ) {
        self.analysisStatus = analysisStatus
        self.guessedMealName = guessedMealName
        self.identifiedFoods = identifiedFoods
        self.calories = calories
        self.protein = protein
        self.carbs = carbs
        self.fat = fat
        self.confidence = confidence
        self.scoreTitle = scoreTitle
        self.suggestion = suggestion
        self.warnings = warnings
        self.notes = notes
    }

    init(
        analysisStatus: MealAnalysisStatus = .ok,
        guessedMealName: String,
        identifiedFoods: [IdentifiedFood] = [],
        nutrition: Nutrition,
        confidence: MealAnalysisConfidence = .mediumDefault,
        scoreTitle: String,
        suggestion: String,
        warnings: [String] = [],
        notes: [String] = []
    ) {
        self.init(
            analysisStatus: analysisStatus,
            guessedMealName: guessedMealName,
            identifiedFoods: identifiedFoods,
            calories: nutrition.calories,
            protein: nutrition.protein,
            carbs: nutrition.carbs,
            fat: nutrition.fat,
            confidence: confidence,
            scoreTitle: scoreTitle,
            suggestion: suggestion,
            warnings: warnings,
            notes: notes
        )
    }
}
