import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var store: AppStore
    @State private var animateIn = false

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 16) {
                        header
                        goalHero
                        macroCard
                        recentMealsCard
                    }
                    .padding(16)
                    .padding(.bottom, 28)
                    .offset(y: animateIn ? 0 : 18)
                    .opacity(animateIn ? 1 : 0)
                }
            }
            .navigationBarHidden(true)
            .onAppear {
                store.addMockDataIfNeeded()
                withAnimation(.easeOut(duration: 0.45)) { animateIn = true }
            }
        }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("今天吃得怎么样？")
                    .font(.appDisplay(30))
                    .foregroundStyle(AppTheme.ink)
                Text(store.goalHeadline)
                    .font(.appBody(14))
                    .foregroundStyle(AppTheme.softGray)
            }
            Spacer()
            Circle()
                .fill(AppTheme.heroGradient)
                .frame(width: 52, height: 52)
                .overlay(Text(store.userProfile?.goal.emoji ?? "🥗").font(.system(size: 24)))
        }
        .padding(.horizontal, 4)
    }

    private var goalHero: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("今日目标感知")
                    .font(.appTitle(17))
                if let profile = store.userProfile {
                    Text(profile.goal.rawValue + " · 连续记录 \(store.streakDays) 天")
                        .font(.appBody(14))
                        .foregroundStyle(AppTheme.softGray)
                    Text("\(store.todaySummary.calories) / \(profile.dailyCalorieTarget) kcal")
                        .font(.appMono(28))
                        .foregroundStyle(AppTheme.ink)
                    ProgressView(value: store.calorieProgress)
                        .tint(AppTheme.coral)
                    Text(store.remainingCalories >= 0 ? "距离今日建议还差 \(store.remainingCalories) kcal，慢慢吃也来得及。" : "今天已经多摄入 \(-store.remainingCalories) kcal，下一餐清爽一点就很好。")
                        .font(.appBody(13))
                        .foregroundStyle(AppTheme.softGray)
                    Text(store.latestSuggestion.isEmpty ? store.goalSubtitle : store.latestSuggestion)
                        .font(.appBody(14))
                        .foregroundStyle(AppTheme.ink)
                    PillButton(title: "记录新的一餐", icon: "plus.circle.fill", tint: AppTheme.coral) {
                        store.selectedTab = .log
                    }
                }
            }
        }
    }

    private var macroCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 14) {
                Text("今日三大营养素")
                    .font(.appTitle(17))
                if let profile = store.userProfile {
                    NutrientProgressCard(title: "蛋白质", current: store.todaySummary.protein, target: profile.proteinTarget, tint: AppTheme.mint)
                    NutrientProgressCard(title: "碳水", current: store.todaySummary.carbs, target: profile.carbTarget, tint: AppTheme.amber)
                    NutrientProgressCard(title: "脂肪", current: store.todaySummary.fat, target: profile.fatTarget, tint: AppTheme.coral)
                }
            }
        }
    }

    private var recentMealsCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("最近记录")
                        .font(.appTitle(17))
                    Spacer()
                    Text("\(store.todayMeals.count) 餐")
                        .font(.appMono(12))
                        .foregroundStyle(AppTheme.softGray)
                }
                if store.todayMeals.isEmpty {
                    Text("还没有记录，先拍第一餐，我们会帮你生成营养分析和温和反馈。")
                        .font(.appBody(14))
                        .foregroundStyle(AppTheme.softGray)
                } else {
                    ForEach(store.todayMeals.prefix(3)) { meal in
                        HStack(alignment: .top) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(meal.name)
                                    .font(.appBody(15))
                                Text(meal.scoreTitle)
                                    .font(.appBody(12))
                                    .foregroundStyle(AppTheme.softGray)
                                if !meal.note.isEmpty {
                                    Text(meal.note)
                                        .font(.appBody(12))
                                        .foregroundStyle(AppTheme.softGray)
                                        .lineLimit(2)
                                }
                            }
                            Spacer()
                            Text("\(meal.nutrition.calories) kcal")
                                .font(.appMono(12))
                                .foregroundStyle(AppTheme.softGray)
                        }
                        .padding(.vertical, 2)
                    }
                }
            }
        }
    }
}
