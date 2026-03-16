# Are U Thin WeChat

微信小程序版前端，当前包含健康画像引导、首页、记录、趋势、AI 营养师、我的等页面。

## 目录

- `miniprogram/`：小程序前端
- `cloudfunctions/quickstartFunctions`：原始云开发模板函数
- `cloudfunctions/aiCoach`：AI 营养师问答云函数

## AI 营养师接入

营养师页面现在会优先调用 `aiCoach` 云函数，再由云函数请求一个 OpenAI 兼容接口。这样 API Key 不会暴露在小程序端。

你需要完成以下配置：

1. 在 `miniprogram/app.js` 中填入你的云开发环境 `env`，或者在微信开发者工具里绑定默认云环境。
2. 上传并部署 `cloudfunctions/aiCoach`。
3. 在 `aiCoach` 云函数环境变量中配置：
   - `AI_API_KEY`：模型服务密钥
   - `AI_BASE_URL`：Chat Completions 接口地址，例如 `https://api.openai.com/v1/chat/completions`
   - `AI_MODEL`：模型名，例如 `gpt-4o-mini`
   - `AI_TEMPERATURE`：可选，默认 `0.7`

如果云函数未部署或环境变量未配置，前端会自动退回到本地演示回复，并在页面上提示原因。

## 部署

可以继续使用微信开发者工具右键部署，也可以用仓库里的脚本：

```bash
sh uploadCloudFunction.sh
```

脚本现在会同时部署 `quickstartFunctions` 和 `aiCoach`。
