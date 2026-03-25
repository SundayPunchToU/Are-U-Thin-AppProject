import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var store: AppStore

    private var profile: UserProfile? { store.userProfile }

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 14) {
                        profileHeader
                        goalSwitcherCard
                        targetCard
                        rhythmCard
                    }
                    .padding(16)
                    .padding(.bottom, 24)
                }
            }
            .navigationBarHidden(true)
        }
    }

    private var profileHeader: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(AppTheme.heroGradient)
                .frame(width: 64, height: 64)
                .overlay(Text(profile?.goal.emoji ?? "🌿").font(.system(size: 28)))
            VStack(alignment: .leading, spacing: 4) {
                Text("你的节奏档案")
                    .font(.appTitle(22))
                    .foregroundStyle(AppTheme.ink)
                Text(profile?.goal.supportiveTitle ?? "先设定目标，再开始记录")
                    .font(.appBody(14))
                    .foregroundStyle(AppTheme.softGray)
            }
            Spacer()
        }
    }

    private var goalSwitcherCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("当前目标")
                    .font(.appTitle(17))
                Text(profile?.goal.supportiveSubtitle ?? "你可以随时调整阶段目标，首页和趋势会同步更新。")
                    .font(.appBody(14))
                    .foregroundStyle(AppTheme.softGray)
                HStack(spacing: 8) {
                    ForEach(GoalType.allCases) { goal in
                        Button { store.updateGoal(goal) } label: {
                            Text("\(goal.emoji) \(goal.rawValue)")
                                .font(.appBody(13))
                                .foregroundStyle(profile?.goal == goal ? .white : AppTheme.ink)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 10)
                                .frame(maxWidth: .infinity)
                                .background(Capsule().fill(profile?.goal == goal ? AppTheme.coral : Color.white.opacity(0.8)))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private var targetCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 10) {
                Text("每日建议")
                    .font(.appTitle(17))
                if let profile {
                    Text("\(profile.dailyCalorieTarget) kcal / 天")
                        .font(.appMono(26))
                    Text("蛋白 \(Int(profile.proteinTarget))g · 碳水 \(Int(profile.carbTarget))g · 脂肪 \(Int(profile.fatTarget))g")
                        .font(.appBody(14))
                        .foregroundStyle(AppTheme.softGray)
                    Text("这些数值会跟着目标自动调整，用来帮助你更温和地把握每天节奏。")
                        .font(.appBody(13))
                        .foregroundStyle(AppTheme.softGray)
                }
            }
        }
    }

    private var rhythmCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("最近状态")
                    .font(.appTitle(17))
                HStack {
                    rhythmStat(title: "连续记录", value: "\(store.streakDays) 天")
                    Spacer()
                    rhythmStat(title: "今天已记", value: "\(store.todayMeals.count) 餐")
                    Spacer()
                    rhythmStat(title: "今日摄入", value: "\(store.todaySummary.calories) kcal")
                }
                Text("mock 说明：当前数据来自本地 store 与 mock 分析服务，后续可平滑替换为真实账号与 AI 能力。")
                    .font(.appBody(12))
                    .foregroundStyle(AppTheme.softGray)
                HStack(spacing: 10) {
                    PillButton(title: "去记录一餐", icon: "camera.fill", tint: AppTheme.coral) {
                        store.selectedTab = .log
                    }
                    PillButton(title: "查看今日概览", icon: "house.fill", tint: AppTheme.mint) {
                        store.selectedTab = .home
                    }
                }
            }
        }
    }

    private func rhythmStat(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.appBody(12))
                .foregroundStyle(AppTheme.softGray)
            Text(value)
                .font(.appTitle(16))
                .foregroundStyle(AppTheme.ink)
        }
    }
}
