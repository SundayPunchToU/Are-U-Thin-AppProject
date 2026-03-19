import SwiftUI

enum AppTheme {
    static let canvasTop = Color(red: 1.00, green: 0.96, blue: 0.92)
    static let canvasBottom = Color(red: 0.96, green: 0.98, blue: 1.00)
    static let card = Color.white.opacity(0.80)
    static let coral = Color(red: 0.98, green: 0.45, blue: 0.36)
    static let mint = Color(red: 0.28, green: 0.72, blue: 0.64)
    static let amber = Color(red: 0.98, green: 0.74, blue: 0.32)
    static let ink = Color(red: 0.16, green: 0.16, blue: 0.18)
    static let softGray = Color(red: 0.45, green: 0.47, blue: 0.52)

    static let pageGradient = LinearGradient(
        colors: [canvasTop, canvasBottom],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let heroGradient = LinearGradient(
        colors: [Color(red: 0.99, green: 0.54, blue: 0.41), Color(red: 1.00, green: 0.73, blue: 0.45)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let cardShadow = Color.black.opacity(0.08)
}

extension Font {
    static func appDisplay(_ size: CGFloat) -> Font {
        .custom("AvenirNext-Bold", size: size)
    }

    static func appTitle(_ size: CGFloat) -> Font {
        .custom("AvenirNext-DemiBold", size: size)
    }

    static func appBody(_ size: CGFloat) -> Font {
        .custom("AvenirNext-Regular", size: size)
    }

    static func appMono(_ size: CGFloat) -> Font {
        .custom("Menlo", size: size)
    }
}

struct AppBackground: View {
    var body: some View {
        ZStack {
            AppTheme.pageGradient.ignoresSafeArea()

            Circle()
                .fill(Color.white.opacity(0.45))
                .frame(width: 240)
                .offset(x: 130, y: -310)

            Circle()
                .fill(AppTheme.coral.opacity(0.16))
                .frame(width: 210)
                .offset(x: -140, y: -220)

            Circle()
                .fill(AppTheme.mint.opacity(0.14))
                .frame(width: 280)
                .offset(x: 140, y: 320)
        }
    }
}

struct SoftCard<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(AppTheme.card)
                    .shadow(color: AppTheme.cardShadow, radius: 18, x: 0, y: 10)
            )
    }
}

struct PillButton: View {
    let title: String
    let icon: String
    var tint: Color = AppTheme.coral
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 13, weight: .semibold))
                Text(title)
                    .font(.appTitle(14))
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(Capsule().fill(tint))
        }
        .buttonStyle(.plain)
    }
}
