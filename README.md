# Are-U-Thin iOS MVP

基于《瘦了吗》产品策划书搭建的 iOS 初版工程骨架（SwiftUI）。

## 当前已实现（MVP 骨架）

- 对话式简化建档（年龄、身高、体重、活动系数、目标）
- 饮食记录入口（图片 + 文本补充，后续可替换为语音转写）
- AI 识别服务抽象层（当前使用 `MockAIAnalysisService`）
- 今日热量与三大营养素进度看板
- AI 建议卡片 + 最近记录列表

## 目录

- `AreUThin/App`：应用入口与主导航
- `AreUThin/Core`：模型、服务协议、状态管理
- `AreUThin/Features`：按功能拆分页面
- `AreUThin/Shared`：通用组件

## 启动

```bash
xcodegen generate
open AreUThin.xcodeproj
```
