import SwiftUI

struct NutrientProgressCard: View {
    let title: String
    let current: Double
    let target: Double

    private var progress: Double {
        guard target > 0 else { return 0 }
        return min(1.0, current / target)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("\(title) \(Int(current))/\(Int(target)) g")
            ProgressView(value: progress)
                .tint(.blue)
        }
    }
}
