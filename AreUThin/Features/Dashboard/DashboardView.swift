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
                            .offset(y: animateIn ? 0 : -18)
                            .opacity(animateIn ? 1 : 0)

                        storyStrip
                            .offset(y: animateIn ? 0 : 14)
                            .opacity(animateIn ? 1 : 0)

                        todayCard
                            .offset(y: animateIn ? 0 : 20)
                            .opacity(animateIn ? 1 : 0)

                        macroCard
                            .offset(y: animateIn ? 0 : 24)
                            .opacity(animateIn ? 1 : 0)

                        feedSection
                            .offset(y: animateIn ? 0 : 28)
                            .opacity(animateIn ? 1 : 0)
                    }
                    .padding(16)
                    .padding(.bottom, 28)
                }
            }
            .navigationBarHidden(true)
            .onAppear {
                store.addMockDataIfNeeded()
                withAnimation(.easeOut(duration: 0.55)) {
                    animateIn = true
                }
            }
        }
    }

    private var header: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Today, you glow")
                    .font(.appDisplay(30))
                    .foregroundStyle(AppTheme.ink)
                Text("连续打卡 \(store.streakDays) 天")
                    .font(.appBody(14))
                    .foregroundStyle(AppTheme.softGray)
            }
            Spacer()
            ZStack {
                Circle()
                    .fill(AppTheme.heroGradient)
                    .frame(width: 52, height: 52)
                Text("🥗")
                    .font(.system(size: 24))
            }
        }
        .padding(.horizontal, 4)
    }

    private var storyStrip: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(store.storyProfiles) { profile in
                    VStack(spacing: 6) {
                        ZStack {
                            Circle()
                                .strokeBorder(AppTheme.heroGradient, lineWidth: 2)
                                .frame(width: 62, height: 62)
                            Circle()
                                .fill(Color.white.opacity(0.82))
                                .frame(width: 54, height: 54)
                            Text(profile.emoji)
                                .font(.system(size: 24))
                        }
                        Text(profile.name)
                            .font(.appBody(12))
                            .foregroundStyle(AppTheme.softGray)
                    }
                }
            }
            .padding(.horizontal, 2)
        }
    }

    private var todayCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("今日目标")
                    .font(.appTitle(17))
                    .foregroundStyle(AppTheme.ink)

                if let profile = store.userProfile {
                    Text("\(store.todaySummary.calories) / \(profile.dailyCalorieTarget) kcal")
                        .font(.appMono(26))
                        .foregroundStyle(AppTheme.ink)

                    ProgressView(value: store.calorieProgress)
                        .tint(AppTheme.coral)

                    Text(store.latestSuggestion.isEmpty ? "记录一餐后会生成 AI 建议" : store.latestSuggestion)
                        .font(.appBody(13))
                        .foregroundStyle(AppTheme.softGray)
                }
            }
        }
    }

    private var macroCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 14) {
                Text("三大营养素")
                    .font(.appTitle(17))

                if let profile = store.userProfile {
                    NutrientProgressCard(
                        title: "蛋白质",
                        current: store.todaySummary.protein,
                        target: proteinTarget(profile: profile),
                        tint: AppTheme.mint
                    )

                    NutrientProgressCard(
                        title: "碳水",
                        current: store.todaySummary.carbs,
                        target: carbTarget(profile: profile),
                        tint: AppTheme.amber
                    )

                    NutrientProgressCard(
                        title: "脂肪",
                        current: store.todaySummary.fat,
                        target: fatTarget(profile: profile),
                        tint: AppTheme.coral
                    )
                }
            }
        }
    }

    private var feedSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("灵感 Feed")
                .font(.appTitle(19))
                .padding(.leading, 4)

            ForEach(store.inspirationFeed) { post in
                VStack(alignment: .leading, spacing: 14) {
                    ZStack(alignment: .topTrailing) {
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .fill(
                                LinearGradient(colors: post.gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                            )
                            .frame(height: 164)

                        Text(post.badge)
                            .font(.appTitle(12))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(.black.opacity(0.2), in: Capsule())
                            .padding(12)
                    }

                    Text(post.title)
                        .font(.appTitle(18))
                    Text(post.subtitle)
                        .font(.appBody(14))
                        .foregroundStyle(AppTheme.softGray)
                    Text("≈ \(post.calories) kcal")
                        .font(.appMono(12))
                        .foregroundStyle(AppTheme.softGray)
                }
                .padding(12)
                .background(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .fill(AppTheme.card)
                        .shadow(color: AppTheme.cardShadow, radius: 16, x: 0, y: 8)
                )
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
