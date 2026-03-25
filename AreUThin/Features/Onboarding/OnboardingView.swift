import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject private var store: AppStore
    @State private var age = 27
    @State private var heightCm = 165.0
    @State private var weightKg = 58.0
    @State private var activityFactor = 1.4
    @State private var goal: GoalType = .cut

    private var previewProfile: UserProfile {
        UserProfile(age: age, heightCm: heightCm, weightKg: weightKg, activityFactor: activityFactor, goal: goal)
    }

    var body: some View {
        ZStack {
            AppBackground()
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    Text("瘦了吗")
                        .font(.appDisplay(34))
                        .foregroundStyle(AppTheme.ink)
                    Text("先选一个健康目标，我们会用更温和的方式陪你记录每一餐。")
                        .font(.appBody(16))
                        .foregroundStyle(AppTheme.softGray)

                    SoftCard {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("1. 你的目标")
                                .font(.appTitle(18))
                            ForEach(GoalType.allCases) { item in
                                Button { goal = item } label: {
                                    HStack(spacing: 12) {
                                        Text(item.emoji).font(.system(size: 24))
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(item.rawValue).font(.appTitle(16))
                                            Text(item.supportiveSubtitle).font(.appBody(13)).foregroundStyle(goal == item ? Color.white.opacity(0.9) : AppTheme.softGray)
                                        }
                                        Spacer()
                                    }
                                    .padding(14)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(goal == item ? AppTheme.coral : Color.white.opacity(0.75)))
                                    .foregroundStyle(goal == item ? .white : AppTheme.ink)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }

                    SoftCard {
                        VStack(alignment: .leading, spacing: 14) {
                            Text("2. 你的基础信息")
                                .font(.appTitle(18))
                            Stepper("年龄 \(age)", value: $age, in: 16...80)
                                .font(.appBody(16))
                            metricField(title: "身高", value: $heightCm, unit: "cm")
                            metricField(title: "体重", value: $weightKg, unit: "kg")
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text("日常活动")
                                    Spacer()
                                    Text(activityText)
                                        .foregroundStyle(AppTheme.softGray)
                                }
                                .font(.appBody(14))
                                Slider(value: $activityFactor, in: 1.2...1.9, step: 0.1)
                                    .tint(AppTheme.mint)
                            }
                        }
                    }

                    SoftCard {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("3. 今日建议")
                                .font(.appTitle(18))
                            Text("≈ \(previewProfile.dailyCalorieTarget) kcal / 天")
                                .font(.appMono(26))
                            Text("蛋白 \(Int(previewProfile.proteinTarget))g · 碳水 \(Int(previewProfile.carbTarget))g · 脂肪 \(Int(previewProfile.fatTarget))g")
                                .font(.appBody(14))
                                .foregroundStyle(AppTheme.softGray)
                            Text(goal.supportiveTitle + "，从第一餐开始慢慢建立节奏就很好。")
                                .font(.appBody(14))
                                .foregroundStyle(AppTheme.softGray)
                        }
                    }

                    Button(action: saveProfile) {
                        Text("开始记录今天")
                            .font(.appTitle(17))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(AppTheme.heroGradient))
                    }
                    .buttonStyle(.plain)
                }
                .padding(20)
                .padding(.top, 28)
            }
        }
    }

    private var activityText: String {
        activityFactor < 1.4 ? "久坐为主" : activityFactor < 1.7 ? "轻度活跃" : "运动较多"
    }

    private func saveProfile() {
        store.completeOnboarding(profile: previewProfile)
        store.addMockDataIfNeeded()
    }

    private func metricField(title: String, value: Binding<Double>, unit: String) -> some View {
        HStack {
            Text(title).font(.appBody(16))
            Spacer()
            TextField("", value: value, format: .number)
                .font(.appBody(16))
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
                .frame(width: 80)
            Text(unit).font(.appBody(16)).foregroundStyle(AppTheme.softGray)
        }
    }
}
