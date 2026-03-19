import SwiftUI

struct RootView: View {
    @EnvironmentObject private var store: AppStore

    var body: some View {
        Group {
            if store.userProfile == nil {
                OnboardingView()
            } else {
                MainTabView()
            }
        }
    }
}

private struct MainTabView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Label("首页", systemImage: "house.fill")
                }

            MealRecordView()
                .tabItem {
                    Label("记录", systemImage: "camera.aperture")
                }

            TrendView()
                .tabItem {
                    Label("趋势", systemImage: "chart.xyaxis.line")
                }

            CoachView()
                .tabItem {
                    Label("营养师", systemImage: "message.fill")
                }

            ProfileView()
                .tabItem {
                    Label("我的", systemImage: "person.crop.circle.fill")
                }
        }
        .tint(AppTheme.coral)
    }
}
