import SwiftUI

struct NutrientProgressCard: View {
    let title: String
    let current: Double
    let target: Double
    let tint: Color

    private var progress: Double {
        guard target > 0 else { return 0 }
        return min(1.0, current / target)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack {
                Text(title)
                    .font(.appBody(14))
                    .foregroundStyle(AppTheme.ink)
                Spacer()
                Text("\(Int(current))/\(Int(target)) g")
                    .font(.appMono(12))
                    .foregroundStyle(AppTheme.softGray)
            }
            ProgressView(value: progress)
                .tint(tint)
        }
    }
}
