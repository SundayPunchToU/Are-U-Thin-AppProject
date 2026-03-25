import PhotosUI
import SwiftUI
import UIKit

private enum MealRecordStep: Int {
    case photo = 1
    case voice = 2
    case confirm = 3
}

struct MealRecordView: View {
    @EnvironmentObject private var store: AppStore
    @State private var pickedItem: PhotosPickerItem?
    @State private var imageData: Data?
    @State private var voiceNote = ""
    @State private var previewResult: MealAnalysisResult?
    @State private var currentStep: MealRecordStep = .photo
    @State private var isLoading = false
    @State private var progressText = ""
    @State private var errorText = ""

    private let loadingHints = ["正在数米粒...", "正在判断烹饪方式...", "正在估算隐藏热量..."]
    private let quickTags = ["少油", "外卖", "训练后", "加餐"]

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 14) {
                        titleBar
                        stepCard
                        uploadCard
                        noteCard
                        confirmCard
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
                    previewResult = nil
                    currentStep = imageData == nil ? .photo : .voice
                }
            }
            .onChange(of: voiceNote) { _, _ in
                if previewResult != nil {
                    previewResult = nil
                    currentStep = .voice
                }
            }
        }
    }

    private var titleBar: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("记录这一餐")
                    .font(.appDisplay(30))
                    .foregroundStyle(AppTheme.ink)
                Text("按 3 步完成：拍照 → 语音补充 → 确认保存")
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

    private var stepCard: some View {
        SoftCard {
            HStack {
                stepItem(1, title: "拍照", active: currentStep.rawValue >= 1)
                Spacer()
                stepItem(2, title: "补充", active: currentStep.rawValue >= 2)
                Spacer()
                stepItem(3, title: "确认", active: currentStep.rawValue >= 3)
            }
        }
    }

    private var uploadCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("1. 上传餐食图片")
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
                        .overlay(VStack(spacing: 8) {
                            Image(systemName: "photo.on.rectangle.angled").font(.system(size: 30, weight: .medium)).foregroundStyle(AppTheme.softGray)
                            Text("先添加照片，AI 才能更好理解这餐内容").font(.appBody(13)).foregroundStyle(AppTheme.softGray)
                        })
                }
                PhotosPicker(selection: $pickedItem, matching: .images) {
                    Text(imageData == nil ? "从相册选择" : "更换照片")
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
                Text("2. 语音补充（当前用文字 mock）")
                    .font(.appTitle(16))
                TextEditor(text: $voiceNote)
                    .font(.appBody(15))
                    .frame(height: 88)
                    .padding(8)
                    .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Color.white.opacity(0.75)))
                    .overlay(alignment: .topLeading) {
                        if voiceNote.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                            Text("例如：牛肉约100g，米饭半碗，少油")
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
                            Button { voiceNote = voiceNote.isEmpty ? "#\(tag)" : voiceNote + " #\(tag)" } label: {
                                Text("#\(tag)").font(.appBody(13)).padding(.horizontal, 12).padding(.vertical, 8).background(Capsule().fill(Color.white.opacity(0.82)))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
        }
    }

    private var confirmCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 10) {
                Text("3. 确认 AI 分析")
                    .font(.appTitle(16))
                Button {
                    Task { await analyzeMealPreview() }
                } label: {
                    HStack {
                        if isLoading { ProgressView().tint(.white) } else { Image(systemName: "sparkles") }
                        Text(isLoading ? "分析中..." : "生成本餐分析")
                            .font(.appTitle(16))
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(AppTheme.heroGradient))
                }
                .buttonStyle(.plain)
                .disabled(isLoading || imageData == nil || voiceNote.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

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
                if let result = previewResult {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(result.guessedName)
                            .font(.appTitle(15))
                        Text(result.scoreTitle)
                            .font(.appBody(13))
                            .foregroundStyle(AppTheme.softGray)
                        if result.needsMoreInfo {
                            Text("这次我先保守一点，不急着给你不靠谱的数字。")
                                .font(.appBody(13))
                                .foregroundStyle(AppTheme.ink)
                        } else {
                            Text("\(result.nutrition.calories) kcal · P\(Int(result.nutrition.protein)) C\(Int(result.nutrition.carbs)) F\(Int(result.nutrition.fat))")
                                .font(.appMono(12))
                                .foregroundStyle(AppTheme.softGray)
                        }
                        Text(result.suggestion)
                            .font(.appBody(13))
                            .foregroundStyle(AppTheme.ink)

                        Label(result.confidence.reason, systemImage: "checkmark.seal.text.page")
                            .font(.appBody(12))
                            .foregroundStyle(AppTheme.softGray)

                        if !result.identifiedFoods.isEmpty {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("识别到的食物")
                                    .font(.appBody(12))
                                    .foregroundStyle(AppTheme.softGray)
                                ForEach(result.identifiedFoods, id: \.self) { food in
                                    Text("• \(food.name) · \(food.estimatedPortion) · \(food.cookingMethod)")
                                        .font(.appBody(12))
                                        .foregroundStyle(AppTheme.ink.opacity(0.8))
                                }
                            }
                        }

                        if !result.warnings.isEmpty {
                            VStack(alignment: .leading, spacing: 4) {
                                ForEach(result.warnings, id: \.self) { warning in
                                    Label(warning, systemImage: "exclamationmark.bubble")
                                        .font(.appBody(12))
                                        .foregroundStyle(Color.orange)
                                }
                            }
                        }

                        if !result.notes.isEmpty {
                            VStack(alignment: .leading, spacing: 4) {
                                ForEach(result.notes, id: \.self) { note in
                                    Text(note)
                                        .font(.appBody(12))
                                        .foregroundStyle(AppTheme.softGray)
                                }
                            }
                        }

                        if !result.needsMoreInfo {
                            Button(action: saveMeal) {
                                Text("确认保存到今天")
                                    .font(.appTitle(15))
                                    .foregroundStyle(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(AppTheme.coral))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(12)
                    .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Color.white.opacity(0.75)))
                }
            }
        }
    }

    private var historyCard: some View {
        SoftCard {
            VStack(alignment: .leading, spacing: 10) {
                Text("今日记录")
                    .font(.appTitle(16))
                if store.todayMeals.isEmpty {
                    Text("保存后会立即同步到首页和趋势页。")
                        .font(.appBody(14))
                        .foregroundStyle(AppTheme.softGray)
                } else {
                    ForEach(store.todayMeals.prefix(3)) { meal in
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
    }

    private func stepItem(_ number: Int, title: String, active: Bool) -> some View {
        VStack(spacing: 6) {
            Text("\(number)")
                .font(.appTitle(14))
                .foregroundStyle(active ? .white : AppTheme.softGray)
                .frame(width: 28, height: 28)
                .background(Circle().fill(active ? AppTheme.coral : Color.white.opacity(0.75)))
            Text(title)
                .font(.appBody(12))
                .foregroundStyle(AppTheme.softGray)
        }
    }

    private func analyzeMealPreview() async {
        isLoading = true
        errorText = ""
        progressText = loadingHints.randomElement() ?? "正在识别..."
        do {
            previewResult = try await store.analyzeMealPreview(imageData: imageData, voiceNote: voiceNote)
            currentStep = .confirm
            progressText = "分析完成，确认后会保存到今日。"
        } catch {
            errorText = "识别失败，请换一张照片或稍后再试"
        }
        isLoading = false
    }

    private func saveMeal() {
        guard let previewResult else { return }
        store.saveAnalyzedMeal(previewResult, voiceNote: voiceNote)
        progressText = "已保存到今日看板"
        errorText = ""
        voiceNote = ""
        pickedItem = nil
        imageData = nil
        self.previewResult = nil
        currentStep = .photo
        store.selectedTab = .home
    }
}
