# 微信云开发后端方案

## 1. 业务闭环理解
- 首次进入：前端调用云函数 `dietData.initUser`，云端依据 `OPENID` 创建或读取 `users`。
- 若无档案：进入 `onboarding`，填写目标、年龄、身高、体重、活动水平。
- 完成 onboarding：前端调用 `dietData.saveOnboarding`，持久化 `profiles`，并将 `users.onboardingCompleted` 置为 `true`。
- 进入 dashboard：前端调用 `dietData.getDashboard`，读取当前档案、今日记录、今日汇总、连续记录天数。
- 记录第一餐：record 页保留本地 mock 分析预览；确认保存时上传图片到云存储，并调用 `dietData.createMealRecord` 写入数据库。
- 保存成功后：dashboard / trend / profile 分别调用各自查询接口，读取真实云端数据并刷新。

## 2. 云开发资源
- 云数据库：`users`、`profiles`、`meal_records`、`daily_summaries`、`coach_context`
- 云函数：`dietData`
- 云存储：`meal-images/` 目录，用于餐食图片

## 3. 集合设计

### users
- 用途：用户身份初始化
- 关键字段：
  - `openid: string` 必填，唯一
  - `appid: string` 可选
  - `unionid: string` 可选
  - `onboardingCompleted: boolean` 必填
  - `createdAt: number` 必填
  - `updatedAt: number` 必填
- 索引建议：`openid` 唯一索引

### profiles
- 用途：持久化 onboarding 结果和设置
- 关键字段：
  - `openid: string` 必填
  - `nickname: string` 可选
  - `age: number` 必填
  - `heightCm: number` 必填
  - `weightKg: number` 必填
  - `activityFactor: number` 必填
  - `goal: string` 必填，`cut|build|maintain`
  - `settings: object` 可选
  - `createdAt: number` 必填
  - `updatedAt: number` 必填
- 索引建议：`openid` 唯一索引
- 前端映射：直接对应当前 `profile`、`goal`、`settings`

### meal_records
- 用途：每次餐食记录
- 关键字段：
  - `openid: string` 必填
  - `eatenAt: number` 必填
  - `dateKey: string` 必填，格式 `YYYY-MM-DD`
  - `name: string` 必填
  - `note: string` 可选
  - `imageFileId: string` 可选
  - `nutrition: object` 必填，包含 `calories/protein/carbs/fat`
  - `scoreTitle: string` 可选
  - `guessedMealName: string` 可选
  - `identifiedFoods: array` 可选
  - `confidence: object` 可选
  - `warnings: array` 可选
  - `notes: array` 可选
  - `suggestion: string` 可选
  - `createdAt: number` 必填
- 索引建议：`openid + dateKey + eatenAt(desc)` 复合索引
- 前端映射：对应当前 record 页 `previewResult` 确认后落库字段

### daily_summaries
- 用途：dashboard/trend 聚合查询
- 关键字段：
  - `openid: string` 必填
  - `dateKey: string` 必填
  - `calories/protein/carbs/fat: number` 必填
  - `mealCount: number` 必填
  - `latestSuggestion: string` 可选
  - `lastMealAt: number` 可选
  - `updatedAt: number` 必填
- 索引建议：`openid + dateKey` 唯一索引

### coach_context
- 用途：预留给 Coach 云端上下文
- 关键字段：
  - `openid: string` 必填
  - `latestSuggestion: string` 可选
  - `todaySummary: object` 可选
  - `recentMeals: array` 可选
  - `updatedAt: number` 必填
- 当前阶段：仅预留结构，Coach 仍主要使用前端缓存上下文

## 4. 页面依赖
- onboarding：`initUser`、`saveOnboarding`
- dashboard：`getDashboard`
- record：本地 mock `analyzeMealPreview` + 云端 `createMealRecord`
- trend：`getTrend`
- profile：`getProfile`、`updateProfile`
- coach：当前继续走 `aiCoach`，上下文主要来自前端缓存

## 5. 云函数动作
- `initUser`
- `saveOnboarding`
- `getProfile`
- `updateProfile`
- `getTodayMeals`
- `createMealRecord`
- `getDashboard`
- `getTrend`

## 6. 权限与安全策略
- 客户端不直接写业务集合，主数据读写统一走 `dietData` 云函数。
- 云函数通过 `cloud.getWXContext()` 获取 `OPENID`，所有查询和写入都绑定当前用户。
- 图片上传使用云存储，数据库仅保存 `fileID`。
- 建议数据库权限设为：仅创建者可读，禁止客户端直接写；核心写操作通过云函数。

## 7. 当前阶段 mock / 预留说明
- record 页的“分析预览”继续保留本地 mock，优先保证保存落库主链路跑通。
- 后续若接真实 AI 分析，只需将当前 `previewResult` 的生成从本地替换为新的分析云函数或外部 AI 服务。
