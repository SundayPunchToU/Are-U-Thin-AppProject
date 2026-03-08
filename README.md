# Are-U-Thin iOS Frontend MVP

《瘦了吗》iOS 初版前端工程（SwiftUI，暂不接后端）。

## 当前前端形态

- INS 风视觉系统：浅色渐变背景、圆角卡片、故事流、Feed 卡片、统一字体与色彩规范
- 首页：故事流、今日热量目标、三大营养素进度、灵感 Feed、AI 建议
- 记录：图片上传、语音补充输入、快捷标签、识别状态、结果卡片、记录历史
- 趋势：周热量趋势图、成就徽章、周总结与海报入口
- AI 营养师：多轮聊天 UI、快捷提问 chips、Mock 智能回复
- 我的：目标概览、功能开关、Pro 订阅模块

## 架构

- `AreUThin/App`：应用入口与主导航
- `AreUThin/Core`：模型、服务协议、状态管理（含前端 mock 数据）
- `AreUThin/Features`：按业务拆分页面
- `AreUThin/Shared`：主题与通用组件

## 运行

```bash
xcodegen generate
open AreUThin.xcodeproj
```
