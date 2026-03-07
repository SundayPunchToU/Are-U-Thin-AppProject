import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var store: AppStore

    var body: some View {
        NavigationStack {
            List {
                if let profile = store.userProfile {
                    Section("今日进度") {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("热量 \(store.todaySummary.calories)/\(profile.dailyCalorieTarget) kcal")
                            ProgressView(value: store.calorieProgress)
                                .tint(.green)
                        }

                        NutrientProgressCard(
                            title: "蛋白质",
                            current: store.todaySummary.protein,
                            target: proteinTarget(profile: profile)
                        )

                        NutrientProgressCard(
                            title: "碳水",
                            current: store.todaySummary.carbs,
                            target: carbTarget(profile: profile)
                        )

                        NutrientProgressCard(
                            title: "脂肪",
                            current: store.todaySummary.fat,
                            target: fatTarget(profile: profile)
                        )
                    }
                }

                Section("AI建议") {
                    Text(store.latestSuggestion.isEmpty ? "记录一餐后，这里会给你建设性建议。" : store.latestSuggestion)
                        .foregroundStyle(.secondary)
                }

                Section("最近记录") {
                    ForEach(store.mealLogs.prefix(5)) { item in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.name).font(.headline)
                            Text(item.scoreTitle).font(.subheadline).foregroundStyle(.secondary)
                            Text("\(item.nutrition.calories) kcal · P\(Int(item.nutrition.protein)) C\(Int(item.nutrition.carbs)) F\(Int(item.nutrition.fat))")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .navigationTitle("今日看板")
            .onAppear {
                store.addMockDataIfNeeded()
            }
        }
    }

    private func proteinTarget(profile: UserProfile) -> Double {
        Double(profile.dailyCalorieTarget) * profile.macroPlan.proteinRatio / 4.0
    }

    private func carbTarget(profile: UserProfile) -> Double {
        Double(profile.dailyCalorieTarget) * profile.macroPlan.carbRatio / 4.0
    }

    private func fatTarget(profile: UserProfile) -> Double {
        Double(profile.dailyCalorieTarget) * profile.macroPlan.fatRatio / 9.0
    }
}
