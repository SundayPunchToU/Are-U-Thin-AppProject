import SwiftUI

struct TrendView: View {
    @EnvironmentObject private var store: AppStore

    private var trend: [DayTrend] { store.weeklyCalorieTrend }
    private var hasTrendData: Bool { trend.contains { $0.calories > 0 } }

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 14) {
                        titleBar
                        summaryCard
                        chartCard
                        weeklyInsightCard
                    }
                    .padding(16)
                    .padding(.bottom, 24)
                }
            }
            .navigationBarHidden(true)
        }
    }

    private var titleBar: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("这一周的节奏")
                .font(.appDisplay(30))
                .foregroundStyle(AppTheme.ink)
            Text("连续 \(store.streakDays) 天有记录，慢慢看清身体反馈。")
                .font(.appBody(14))
                .foregroundStyle(AppTheme.softGray)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var summaryCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 10) {
                Text("本周概览")
                    .font(.appTitle(17))
                Text("周均 \(store.weeklyAverageCalories) kcal / 天")
                    .font(.appMono(26))
                Text(store.userProfile?.goal.supportiveSubtitle ?? "先设定目标，再开始记录你的饮食节奏。")
                    .font(.appBody(14))
                    .foregroundStyle(AppTheme.softGray)
            }
        }
    }

    private var chartCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("本周热量趋势")
                    .font(.appTitle(17))
                if hasTrendData {
                    HStack(alignment: .bottom, spacing: 10) {
                        ForEach(trend) { day in
                            let ratio = max(0.14, min(1, Double(day.calories) / Double(max(day.target, 1))))
                            VStack(spacing: 6) {
                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                    .fill(day.calories <= day.target ? AppTheme.mint : AppTheme.coral.opacity(0.85))
                                    .frame(width: 26, height: 122 * ratio)
                                Text(day.label)
                                    .font(.appMono(10))
                                    .foregroundStyle(AppTheme.softGray)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, minHeight: 138, alignment: .bottom)
                    Text("浅绿色表示更接近建议范围，珊瑚色表示这天吃得更丰盛一点。")
                        .font(.appBody(12))
                        .foregroundStyle(AppTheme.softGray)
                } else {
                    Text("还没有足够的数据形成趋势，先去记录今天的第一餐吧。")
                        .font(.appBody(14))
                        .foregroundStyle(AppTheme.softGray)
                }
            }
        }
    }

    private var weeklyInsightCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 10) {
                Text("温和提醒")
                    .font(.appTitle(17))
                Text(store.weeklyInsight)
                    .font(.appBody(14))
                    .foregroundStyle(AppTheme.softGray)
                PillButton(title: "去记录一餐", icon: "camera.fill", tint: AppTheme.coral) {
                    store.selectedTab = .log
                }
            }
        }
    }
}
