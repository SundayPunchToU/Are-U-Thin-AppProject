import Foundation
import SwiftUI

struct StoryProfile: Identifiable {
    let id = UUID()
    let name: String
    let emoji: String
}

struct InspirationPost: Identifiable {
    let id = UUID()
    let title: String
    let subtitle: String
    let calories: Int
    let gradient: [Color]
    let badge: String
}

struct DayTrend: Identifiable {
    let id = UUID()
    let label: String
    let calories: Int
    let target: Int
    let weight: Double
}

struct BadgeItem: Identifiable {
    let id = UUID()
    let title: String
    let subtitle: String
    let emoji: String
    let progress: Double
    let unlocked: Bool
}

struct CoachMessage: Identifiable {
    let id = UUID()
    let text: String
    let fromUser: Bool
    let date: Date
}
