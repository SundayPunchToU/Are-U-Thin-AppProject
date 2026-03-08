import PhotosUI
import SwiftUI
import UIKit

struct MealRecordView: View {
    @EnvironmentObject private var store: AppStore

    @State private var pickedItem: PhotosPickerItem?
    @State private var imageData: Data?
    @State private var voiceNote = ""
    @State private var isLoading = false
    @State private var progressText = ""
    @State private var errorText = ""

    private let loadingHints = [
        "正在数米粒...",
        "正在判断烹饪方式...",
        "正在估算隐藏热量..."
    ]

    private let quickTags = ["少油", "外卖", "训练后", "加餐"]

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 14) {
                        titleBar
                        uploadCard
                        noteCard
                        actionArea
                        historyCard
                    }
                    .padding(16)
                    .padding(.bottom, 20)
                }
            }
            .navigationBarHidden(true)
            .onChange(of: pickedItem) { _, newValue in
                guard let newValue else { return }
                Task {
                    imageData = try? await newValue.loadTransferable(type: Data.self)
                }
            }
        }
    }

    private var titleBar: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Meal Capture")
                    .font(.appDisplay(30))
                    .foregroundStyle(AppTheme.ink)
                Text("拍照 + 语音补充，2 秒得到反馈")
                    .font(.appBody(14))
                    .foregroundStyle(AppTheme.softGray)
            }
            Spacer()
            Circle()
                .fill(AppTheme.heroGradient)
                .frame(width: 48, height: 48)
                .overlay(Image(systemName: "camera.fill").foregroundStyle(.white))
        }
    }

    private var uploadCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("餐食图片")
                    .font(.appTitle(16))

                if let imageData, let uiImage = UIImage(data: imageData) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFill()
                        .frame(height: 190)
                        .frame(maxWidth: .infinity)
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                } else {
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(LinearGradient(colors: [Color.white.opacity(0.9), Color.white.opacity(0.6)], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(height: 190)
                        .overlay(
                            VStack(spacing: 8) {
                                Image(systemName: "photo.on.rectangle.angled")
                                    .font(.system(size: 30, weight: .medium))
                                    .foregroundStyle(AppTheme.softGray)
                                Text("添加你这餐的照片")
                                    .font(.appBody(13))
                                    .foregroundStyle(AppTheme.softGray)
                            }
                        )
                }

                PhotosPicker(selection: $pickedItem, matching: .images) {
                    Text("从相册选择")
                        .font(.appTitle(14))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(Capsule().fill(AppTheme.mint))
                }
            }
        }
    }

    private var noteCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("语音补充")
                    .font(.appTitle(16))

                TextEditor(text: $voiceNote)
                    .font(.appBody(15))
                    .frame(height: 88)
                    .padding(8)
                    .background(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .fill(Color.white.opacity(0.75))
                    )
                    .overlay(alignment: .topLeading) {
                        if voiceNote.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                            Text("例如：牛肉约100g，米饭半碗，零度可乐")
                                .font(.appBody(14))
                                .foregroundStyle(AppTheme.softGray)
                                .padding(.top, 16)
                                .padding(.leading, 14)
                                .allowsHitTesting(false)
                        }
                    }

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(quickTags, id: \.self) { tag in
                            Button {
                                if voiceNote.isEmpty {
                                    voiceNote = "#\(tag)"
                                } else {
                                    voiceNote += " #\(tag)"
                                }
                            } label: {
                                Text("#\(tag)")
                                    .font(.appBody(13))
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(Capsule().fill(Color.white.opacity(0.82)))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
        }
    }

    private var actionArea: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 10) {
                Button {
                    Task { await analyzeMeal() }
                } label: {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Image(systemName: "sparkles")
                        }

                        Text(isLoading ? "识别中..." : "AI 解析并记录")
                            .font(.appTitle(16))
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(AppTheme.heroGradient))
                }
                .buttonStyle(.plain)
                .disabled(isLoading || voiceNote.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                if !progressText.isEmpty {
                    Text(progressText)
                        .font(.appBody(13))
                        .foregroundStyle(AppTheme.softGray)
                }

                if !errorText.isEmpty {
                    Text(errorText)
                        .font(.appBody(13))
                        .foregroundStyle(.red)
                }

                if let result = store.lastAnalysis {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(result.guessedName)
                            .font(.appTitle(15))
                        Text("\(result.nutrition.calories) kcal · P\(Int(result.nutrition.protein)) C\(Int(result.nutrition.carbs)) F\(Int(result.nutrition.fat))")
                            .font(.appMono(12))
                            .foregroundStyle(AppTheme.softGray)
                        Text(result.suggestion)
                            .font(.appBody(13))
                            .foregroundStyle(AppTheme.softGray)
                    }
                    .padding(10)
                    .background(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(Color.white.opacity(0.72)))
                }
            }
        }
    }

    private var historyCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 10) {
                Text("今日记录")
                    .font(.appTitle(16))
                ForEach(store.mealLogs.prefix(3)) { meal in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(meal.name)
                                .font(.appBody(14))
                            Text(meal.scoreTitle)
                                .font(.appBody(12))
                                .foregroundStyle(AppTheme.softGray)
                        }
                        Spacer()
                        Text("\(meal.nutrition.calories) kcal")
                            .font(.appMono(12))
                            .foregroundStyle(AppTheme.softGray)
                    }
                    .padding(.vertical, 2)
                }
            }
        }
    }

    private func analyzeMeal() async {
        isLoading = true
        errorText = ""
        progressText = loadingHints.randomElement() ?? "正在识别..."

        do {
            try await store.analyzeAndSaveMeal(imageData: imageData, voiceNote: voiceNote)
            voiceNote = ""
            pickedItem = nil
            imageData = nil
            progressText = "已识别并同步到今日看板"
        } catch {
            errorText = "识别失败，请稍后重试"
        }

        isLoading = false
    }
}
