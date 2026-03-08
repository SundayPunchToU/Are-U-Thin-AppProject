import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var store: AppStore

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 14) {
                        profileHeader
                        goalCard
                        settingCard
                        proCard
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
                .overlay(Text("L").font(.appDisplay(28)).foregroundStyle(.white))

            VStack(alignment: .leading, spacing: 3) {
                Text("Lihanjie")
                    .font(.appTitle(22))
                    .foregroundStyle(AppTheme.ink)
                Text("饮食管理进行中")
                    .font(.appBody(14))
                    .foregroundStyle(AppTheme.softGray)
            }
            Spacer()
        }
    }

    private var goalCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 10) {
                Text("当前计划")
                    .font(.appTitle(17))

                if let profile = store.userProfile {
                    Text(profile.goal.rawValue)
                        .font(.appDisplay(24))
                        .foregroundStyle(AppTheme.ink)
                    Text("日热量目标 \(profile.dailyCalorieTarget) kcal")
                        .font(.appMono(13))
                        .foregroundStyle(AppTheme.softGray)
                    Text("蛋白 \(Int(profile.macroPlan.proteinRatio * 100))% · 碳水 \(Int(profile.macroPlan.carbRatio * 100))% · 脂肪 \(Int(profile.macroPlan.fatRatio * 100))%")
                        .font(.appBody(13))
                        .foregroundStyle(AppTheme.softGray)
                }
            }
        }
    }

    private var settingCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("功能设置")
                    .font(.appTitle(17))

                Toggle("晚间达标提醒", isOn: $store.reminderAtNight)
                    .font(.appBody(15))
                    .tint(AppTheme.coral)

                Toggle("语音补充增强", isOn: $store.useVoiceEnhancement)
                    .font(.appBody(15))
                    .tint(AppTheme.coral)

                Toggle("自动生成分享海报", isOn: $store.socialPosterEnabled)
                    .font(.appBody(15))
                    .tint(AppTheme.coral)
            }
        }
    }

    private var proCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 10) {
                Text("Pro 会员")
                    .font(.appTitle(17))
                Text("解锁无限识别、深度营养追踪和一周备餐建议")
                    .font(.appBody(14))
                    .foregroundStyle(AppTheme.softGray)

                HStack(spacing: 10) {
                    PillButton(title: "19.9 元/月", icon: "crown.fill", tint: AppTheme.amber) {}
                    PillButton(title: "198 元/年", icon: "sparkles", tint: AppTheme.coral) {}
                }
            }
        }
    }
}
