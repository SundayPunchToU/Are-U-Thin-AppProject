import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var store: AppStore

    var body: some View {
        NavigationStack {
            List {
                if let profile = store.userProfile {
                    Section("目标信息") {
                        Text("目标：\(profile.goal.rawValue)")
                        Text("日热量目标：\(profile.dailyCalorieTarget) kcal")
                    }
                }

                Section("阶段规划") {
                    Text("MVP 目标：跑通拍照 + 语音补全 + 当日进度追踪")
                    Text("下一阶段：多轮追问、记忆偏好、教练看板")
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("我的")
        }
    }
}
