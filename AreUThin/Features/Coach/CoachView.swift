import SwiftUI

struct CoachView: View {
    @EnvironmentObject private var store: AppStore
    @State private var draft = ""

    private let quickPrompts = [
        "今晚外卖怎么点？",
        "训练后加餐建议",
        "夜宵想吃又怕胖"
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()

                VStack(spacing: 12) {
                    header
                    messageList
                    promptRow
                    inputBar
                }
                .padding(16)
                .padding(.bottom, 8)
            }
            .navigationBarHidden(true)
        }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("AI Diet Coach")
                    .font(.appDisplay(28))
                    .foregroundStyle(AppTheme.ink)
                Text("支持多轮追问与温和反馈")
                    .font(.appBody(14))
                    .foregroundStyle(AppTheme.softGray)
            }
            Spacer()
            Text("🤖")
                .font(.system(size: 30))
        }
    }

    private var messageList: some View {
        ScrollView {
            LazyVStack(spacing: 10) {
                ForEach(store.coachMessages) { message in
                    HStack {
                        if message.fromUser { Spacer() }
                        Text(message.text)
                            .font(.appBody(15))
                            .foregroundStyle(message.fromUser ? .white : AppTheme.ink)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 11)
                            .background(
                                RoundedRectangle(cornerRadius: 16, style: .continuous)
                                    .fill(message.fromUser ? AppTheme.coral : Color.white.opacity(0.82))
                            )
                            .frame(maxWidth: 280, alignment: message.fromUser ? .trailing : .leading)
                        if !message.fromUser { Spacer() }
                    }
                }
            }
            .padding(.vertical, 2)
        }
        .frame(maxWidth: .infinity)
    }

    private var promptRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(quickPrompts, id: \.self) { prompt in
                    Button {
                        store.applyQuickPrompt(prompt)
                    } label: {
                        Text(prompt)
                            .font(.appBody(13))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Capsule().fill(Color.white.opacity(0.8)))
                            .foregroundStyle(AppTheme.ink)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var inputBar: some View {
        HStack(spacing: 8) {
            TextField("输入问题", text: $draft)
                .font(.appBody(15))
                .padding(.horizontal, 12)
                .padding(.vertical, 11)
                .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Color.white.opacity(0.84)))

            Button {
                sendDraft()
            } label: {
                Image(systemName: "paperplane.fill")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(12)
                    .background(Circle().fill(AppTheme.mint))
            }
            .buttonStyle(.plain)
        }
    }

    private func sendDraft() {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        store.sendCoachMessage(text)
        draft = ""
    }
}
