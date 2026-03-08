import SwiftUI

struct TrendView: View {
    @EnvironmentObject private var store: AppStore

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 14) {
                        titleBar
                        chartCard
                        badgeCard
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
            Text("Weekly Insights")
                .font(.appDisplay(30))
                .foregroundStyle(AppTheme.ink)
            Text("连续 \(store.streakDays) 天保持记录")
                .font(.appBody(14))
                .foregroundStyle(AppTheme.softGray)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var chartCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("本周热量趋势")
                    .font(.appTitle(17))

                HStack(alignment: .bottom, spacing: 10) {
                    ForEach(store.weeklyTrend) { day in
                        let ratio = max(0.15, min(1, Double(day.calories) / Double(max(day.target, 1))))
                        VStack(spacing: 6) {
                            RoundedRectangle(cornerRadius: 7, style: .continuous)
                                .fill(day.calories <= day.target ? AppTheme.mint : AppTheme.coral)
                                .frame(width: 24, height: 120 * ratio)
                            Text(day.label)
                                .font(.appMono(10))
                                .foregroundStyle(AppTheme.softGray)
                        }
                    }
                }
                .frame(maxWidth: .infinity, minHeight: 138, alignment: .bottom)

                Text("绿色表示达标，红色表示超配额")
                    .font(.appBody(12))
                    .foregroundStyle(AppTheme.softGray)
            }
        }
    }

    private var badgeCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("成就徽章")
                    .font(.appTitle(17))

                ForEach(store.badges) { badge in
                    HStack(spacing: 10) {
                        Text(badge.emoji)
                            .font(.system(size: 24))
                            .frame(width: 36)

                        VStack(alignment: .leading, spacing: 4) {
                            Text(badge.title)
                                .font(.appBody(14))
                            Text(badge.subtitle)
                                .font(.appMono(11))
                                .foregroundStyle(AppTheme.softGray)
                        }

                        Spacer()

                        if badge.unlocked {
                            Text("已解锁")
                                .font(.appBody(12))
                                .foregroundStyle(AppTheme.mint)
                        } else {
                            ProgressView(value: badge.progress)
                                .tint(AppTheme.amber)
                                .frame(width: 74)
                        }
                    }
                }
            }
        }
    }

    private var weeklyInsightCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 10) {
                Text("本周总结")
                    .font(.appTitle(17))

                Text("你的周均热量低于目标约 6%，控制相对稳定。建议下周保持工作日晚餐的蔬菜比例，周末提前准备低卡零食。")
                    .font(.appBody(14))
                    .foregroundStyle(AppTheme.softGray)

                PillButton(title: "生成打卡海报", icon: "sparkles.rectangle.stack") {}
            }
        }
    }
}
