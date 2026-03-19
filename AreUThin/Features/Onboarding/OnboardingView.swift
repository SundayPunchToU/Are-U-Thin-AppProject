import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject private var store: AppStore

    @State private var age = 27
    @State private var heightCm = 165.0
    @State private var weightKg = 58.0
    @State private var activityFactor = 1.4
    @State private var goal: GoalType = .steadyCut

    var body: some View {
        ZStack {
            AppBackground()

            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    Text("瘦了吗")
                        .font(.appDisplay(34))
                        .foregroundStyle(AppTheme.ink)

                    Text("先用 30 秒建立你的健康画像")
                        .font(.appBody(16))
                        .foregroundStyle(AppTheme.softGray)

                    SoftCard {
                        VStack(alignment: .leading, spacing: 14) {
                            Text("基础信息")
                                .font(.appTitle(18))
                                .foregroundStyle(AppTheme.ink)

                            Stepper("年龄 \(age)", value: $age, in: 16...80)
                                .font(.appBody(16))

                            metricField(title: "身高", value: $heightCm, unit: "cm")
                            metricField(title: "体重", value: $weightKg, unit: "kg")
                        }
                    }

                    SoftCard {
                        VStack(alignment: .leading, spacing: 14) {
                            Text("日常活动")
                                .font(.appTitle(18))
                            Slider(value: $activityFactor, in: 1.2...1.9, step: 0.1)
                                .tint(AppTheme.mint)
                            Text("活动系数 \(activityFactor, specifier: "%.1f")")
                                .font(.appBody(13))
                                .foregroundStyle(AppTheme.softGray)
                        }
                    }

                    SoftCard {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("目标模式")
                                .font(.appTitle(18))
                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                                ForEach(GoalType.allCases) { item in
                                    Button {
                                        goal = item
                                    } label: {
                                        Text(item.rawValue)
                                            .font(.appTitle(14))
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 12)
                                            .background(
                                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                                    .fill(goal == item ? AppTheme.coral : Color.white.opacity(0.7))
                                            )
                                            .foregroundStyle(goal == item ? Color.white : AppTheme.ink)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }

                    Button {
                        let profile = UserProfile(
                            age: age,
                            heightCm: heightCm,
                            weightKg: weightKg,
                            activityFactor: activityFactor,
                            goal: goal
                        )
                        store.completeOnboarding(profile: profile)
                        store.addMockDataIfNeeded()
                    } label: {
                        Text("进入 App")
                            .font(.appTitle(17))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                RoundedRectangle(cornerRadius: 18, style: .continuous)
                                    .fill(AppTheme.heroGradient)
                            )
                    }
                    .buttonStyle(.plain)
                    .padding(.top, 6)
                }
                .padding(20)
                .padding(.top, 28)
            }
        }
    }

    private func metricField(title: String, value: Binding<Double>, unit: String) -> some View {
        HStack {
            Text(title)
                .font(.appBody(16))
            Spacer()
            TextField("", value: value, format: .number)
                .font(.appBody(16))
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
                .frame(width: 80)
            Text(unit)
                .font(.appBody(16))
                .foregroundStyle(AppTheme.softGray)
        }
    }
}
