# 🦞 龙虾助手

> **五分钟学会，不懂电脑也能用！**

OpenClaw 可视化管理面板，专为中国用户设计。界面全中文，字体超大，按钮超大，老年人也能轻松使用。

---

## ✨ 功能一览

| 页面 | 功能 |
|------|------|
| 🏠 **运行状态** | 一眼看清龙虾助手有没有在跑，绿色=正常，红色=没启动 |
| ⚙️ **设置** | 可视化填写 AI 密钥、选模型、填 Telegram 令牌，告别 JSON 文件 |
| 🔧 **功能插件** | 浏览 50+ 插件，一键安装/卸载，带中文说明 |
| 💬 **对话** | 直接和 AI 聊天，和微信一样简单，发消息收回复 |

---

## 🚀 快速启动

```bash
# 第一步：进入项目文件夹
cd longxia-assistant

# 第二步：安装依赖（只需要做一次）
npm install

# 第三步：启动开发服务器
npm run dev
```

然后打开浏览器，访问：**http://localhost:5173**

---

## 📦 打包发布

```bash
npm run build
```

生成的文件在 `dist/` 文件夹，可以放到任意静态服务器上。

---

## 🔗 需要配合后端使用

本面板需要龙虾助手后端服务运行在 `http://localhost:3001`，提供以下接口：

| 接口 | 说明 |
|------|------|
| `GET  /api/status` | 获取服务运行状态 |
| `GET  /api/config` | 读取当前配置 |
| `POST /api/config` | 保存配置 |
| `POST /api/chat`   | 发送消息，获取 AI 回复 |
| `GET  /api/skills/installed` | 获取已安装插件列表 |
| `POST /api/skills/install`   | 安装插件 |
| `POST /api/skills/uninstall` | 卸载插件 |

如果后端未启动，面板会显示友好提示，**不会崩溃**。

---

## 🎨 设计原则（老年友好）

- **字体超大**：正文 17px+，标题 28px+，按钮 18px+
- **按钮超大**：最小触摸高度 52px，不容易点错
- **高对比度**：深色背景 + 近白色文字，老人眼睛也看得清
- **全中文**：零英文术语，API Key 叫「专属口令」，Skill 叫「功能插件」
- **每步有说明**：每个输入框下方有灰色小字解释怎么填
- **❓帮助按钮**：点开有详细中文解释
- **操作确认**：安装/卸载前弹窗确认，防止误操作
- **失败有提示**：错误信息大字显示，✅成功 ❌失败一目了然
- **手机友好**：底部 Tab 导航，大按钮，适配各种屏幕

---

## 🗂 项目结构

```
longxia-assistant/
├── src/
│   ├── pages/
│   │   ├── Status.jsx   # 🏠 运行状态页
│   │   ├── Config.jsx   # ⚙️  设置页
│   │   ├── Skills.jsx   # 🔧 功能插件页
│   │   └── Chat.jsx     # 💬 对话页
│   ├── components/
│   │   ├── Navbar.jsx        # 导航栏（顶部+底部）
│   │   ├── StatusCard.jsx    # 统计卡片
│   │   ├── SkillCard.jsx     # 插件卡片
│   │   ├── HelpButton.jsx    # ❓ 帮助弹窗
│   │   └── ConfirmDialog.jsx # 操作确认弹窗
│   ├── api.js       # 所有 API 调用封装
│   ├── App.jsx      # 路由配置
│   ├── main.jsx     # 入口
│   └── index.css    # 全局样式
├── package.json
├── vite.config.js
└── index.html
```

---

## 📮 反馈与贡献

开源地址：https://github.com/openclaw-cn/longxia-assistant（待建）

有问题欢迎提 Issue，我们会尽快回复！
