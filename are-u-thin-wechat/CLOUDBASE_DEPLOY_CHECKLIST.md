# CloudBase 部署清单

## 1. 小程序端环境 ID
在 `miniprogram/app.js` 里填入你的云开发环境 ID：

```js
this.globalData = {
  env: "你的云开发环境ID",
  store,
};
```

如果不填写，`wx.cloud.init` 仍可能初始化，但在多环境或未默认绑定时容易导致调用失败。

## 2. 部署云函数
在微信开发者工具中部署云函数目录：
- `cloudfunctions/dietData`
- `cloudfunctions/aiCoach`（如你仍要使用 Coach）

建议至少执行一次：
- 安装依赖
- 上传并部署：云端安装依赖

## 3. 创建数据库集合
请在云开发控制台创建以下集合：
- `users`
- `profiles`
- `meal_records`
- `daily_summaries`
- `coach_context`（当前阶段可先建空表，供后续扩展）

## 4. 建议索引
建议创建这些索引：
- `users.openid` 唯一
- `profiles.openid` 唯一
- `daily_summaries.openid + dateKey`
- `meal_records.openid + dateKey + eatenAt`

如果暂时不建索引，小数据量下也能跑，但查询性能和稳定性会差一些。

## 5. 云存储目录
record 页保存餐食时会上传图片到：
- `meal-images/`

该目录无需手工预创建，首次上传会自动生成。

## 6. 数据库权限建议
建议将业务集合权限设为：
- 客户端不直接写
- 主要读写通过云函数 `dietData`

当前实现默认是通过云函数按 `OPENID` 进行隔离。

## 7. 当前真实接入范围
已接入真实云端：
- 首次进入身份初始化：`initUser`
- onboarding 持久化：`saveOnboarding`
- 第一条 meal record 保存：`createMealRecord`
- dashboard 今日数据读取：`getDashboard`
- trend 最近 7 天读取：`getTrend`
- profile 读写：`getProfile` / `updateProfile`

仍保留 mock / 本地占位：
- record 页“分析预览”
- Coach 对话历史本地缓存
- Coach 上下文持久化

## 8. 建议验证顺序
1. 清空本地缓存后首次打开小程序
2. 完成 onboarding
3. 进入 dashboard，确认已非空白态
4. 在 record 保存一条带图片或不带图片的餐食
5. 返回 dashboard 查看今日热量/餐次
6. 进入 trend 查看最近 7 天趋势
7. 进入 profile 修改目标并返回确认已生效

## 9. 若调用失败优先排查
- `app.js` 中 env 是否正确
- `dietData` 是否已部署成功
- 数据库集合是否已创建
- 小程序基础库是否支持 `wx.cloud`
- 云环境权限是否允许当前小程序访问

