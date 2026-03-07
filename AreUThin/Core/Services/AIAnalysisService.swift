import Foundation

protocol AIAnalysisService {
    func analyzeMeal(imageData: Data?, voiceNote: String) async throws -> MealAnalysisResult
}
