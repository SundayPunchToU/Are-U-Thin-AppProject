import Foundation

struct Nutrition: Hashable {
    var calories: Int
    var protein: Double
    var carbs: Double
    var fat: Double

    static let zero = Nutrition(calories: 0, protein: 0, carbs: 0, fat: 0)
}

struct MealLog: Identifiable, Hashable {
    let id = UUID()
    let timestamp: Date
    let name: String
    let note: String
    let nutrition: Nutrition
    let scoreTitle: String
}
