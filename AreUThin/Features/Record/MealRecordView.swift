import PhotosUI
import SwiftUI

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
        "正在拆解烹饪方式...",
        "正在估算隐性油脂..."
    ]

    var body: some View {
        NavigationStack {
            List {
                Section("1. 上传餐食图片") {
                    PhotosPicker(selection: $pickedItem, matching: .images) {
                        Label("选择照片", systemImage: "photo")
                    }

                    if imageData != nil {
                        Text("图片已选择")
                            .foregroundStyle(.green)
                    }
                }

                Section("2. 语音补充（先用文本代替）") {
                    TextField("例如：牛肉约100克，喝了零度可乐", text: $voiceNote, axis: .vertical)
                        .lineLimit(2...4)
                }

                Section {
                    Button(isLoading ? "识别中..." : "AI 解析并记录") {
                        Task { await analyzeMeal() }
                    }
                    .disabled(isLoading || voiceNote.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                    if !progressText.isEmpty {
                        Text(progressText)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }

                    if !errorText.isEmpty {
                        Text(errorText)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle("记录饮食")
            .onChange(of: pickedItem) { _, newValue in
                guard let newValue else { return }
                Task {
                    imageData = try? await newValue.loadTransferable(type: Data.self)
                }
            }
        }
    }

    private func analyzeMeal() async {
        isLoading = true
        errorText = ""
        progressText = loadingHints.randomElement() ?? "正在识别..."

        do {
            try await store.analyzeAndSaveMeal(
                imageData: imageData,
                voiceNote: voiceNote
            )
            voiceNote = ""
            pickedItem = nil
            imageData = nil
            progressText = "已完成识别并保存"
        } catch {
            errorText = "识别失败，请稍后重试"
        }

        isLoading = false
    }
}
