import Foundation

protocol AIAnalysisService {
    func analyzeMeal(request: MealAnalysisRequest) async throws -> MealAnalysisResult
}
