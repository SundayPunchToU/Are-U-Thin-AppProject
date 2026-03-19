import SwiftUI

@main
struct AreUThinApp: App {
    @StateObject private var store = AppStore(service: MockAIAnalysisService())

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
        }
    }
}
