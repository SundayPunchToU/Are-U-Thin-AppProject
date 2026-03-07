import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject private var store: AppStore

    @State private var age = 28
    @State private var heightCm = 170.0
    @State private var weightKg = 65.0
    @State private var activityFactor = 1.4
    @State private var goal: GoalType = .steadyCut

    var body: some View {
        NavigationStack {
            Form {
                Section("基础档案") {
                    Stepper("年龄: \(age)", value: $age, in: 16...80)
                    HStack {
                        Text("身高")
                        Spacer()
                        TextField("cm", value: $heightCm, format: .number)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 90)
                        Text("cm")
                    }
                    HStack {
                        Text("体重")
                        Spacer()
                        TextField("kg", value: $weightKg, format: .number)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 90)
                        Text("kg")
                    }
                }

                Section("活动系数") {
                    Slider(value: $activityFactor, in: 1.2...1.9, step: 0.1)
                    Text("当前: \(activityFactor, specifier: "%.1f")")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Section("目标") {
                    Picker("计划", selection: $goal) {
                        ForEach(GoalType.allCases) { item in
                            Text(item.rawValue).tag(item)
                        }
                    }
                }

                Section {
                    Button("开始使用") {
                        let profile = UserProfile(
                            age: age,
                            heightCm: heightCm,
                            weightKg: weightKg,
                            activityFactor: activityFactor,
                            goal: goal
                        )
                        store.completeOnboarding(profile: profile)
                    }
                }
            }
            .navigationTitle("欢迎来到瘦了吗")
        }
    }
}
