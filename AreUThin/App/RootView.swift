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
    @EnvironmentObject private var store: AppStore

    var body: some View {
        TabView(selection: $store.selectedTab) {
            DashboardView()
                .tag(AppTab.home)
                .tabItem {
                    Label("今日", systemImage: "house.fill")
                }

            MealRecordView()
                .tag(AppTab.log)
                .tabItem {
                    Label("记录", systemImage: "plus.circle.fill")
                }

            TrendView()
                .tag(AppTab.trends)
                .tabItem {
                    Label("趋势", systemImage: "chart.line.uptrend.xyaxis")
                }

            ProfileView()
                .tag(AppTab.profile)
                .tabItem {
                    Label("我的", systemImage: "person.crop.circle.fill")
                }
        }
        .tint(AppTheme.coral)
    }
}
