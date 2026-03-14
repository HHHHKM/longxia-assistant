'use strict'

const { contextBridge, ipcRenderer } = require('electron')

/**
 * 预加载脚本：在渲染进程中暴露安全的 IPC 接口
 * 前端通过 window.electronAPI.xxx() 调用主进程功能
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ── 状态查询 ──────────────────────────────────────

  /** 获取 openclaw 服务运行状态 */
  getStatus: () => ipcRenderer.invoke('get-status'),

  /** 检查是否首次启动（无配置文件） */
  isFirstRun: () => ipcRenderer.invoke('is-first-run'),

  // ── 配置管理 ──────────────────────────────────────

  /**
   * 保存 AI 服务商配置 + 可选 Telegram Bot Token
   * @param {string} provider - 服务商 ID
   * @param {string} apiKey - API Key
   * @param {string} [telegramBotToken] - Telegram Bot Token（可选）
   */
  saveConfig: (provider, apiKey, telegramBotToken) =>
    ipcRenderer.invoke('save-config', { provider, apiKey, telegramBotToken }),

  /**
   * 保存完整配置（支持飞书等多渠道）
   * @param {object} opts
   * @param {string} opts.provider          - 服务商 ID
   * @param {string} opts.apiKey            - API Key
   * @param {string} [opts.telegramBotToken] - Telegram Bot Token
   * @param {string} [opts.feishuAppId]     - 飞书 App ID (cli_xxx)
   * @param {string} [opts.feishuAppSecret] - 飞书 App Secret
   */
  saveConfigFull: (opts) =>
    ipcRenderer.invoke('save-config-full', opts),

  /** 读取当前配置 */
  getConfig: () => ipcRenderer.invoke('get-config'),

  // ── 服务控制 ──────────────────────────────────────

  /** 重启 openclaw gateway */
  restartService: () => ipcRenderer.invoke('restart-service'),

  /** 打开外部链接（浏览器） */
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // ── 设置向导完成 ──────────────────────────────────

  /**
   * 向导完成后通知主进程：
   * 主进程会：1) 初始化 workspace  2) 启动 openclaw gateway
   */
  setupComplete: () => ipcRenderer.invoke('setup-complete'),

  // ── 事件监听 ──────────────────────────────────────

  /** 监听来自主进程的消息（如服务状态变化） */
  on: (channel, callback) => {
    const allowedChannels = ['service-status', 'error-message', 'update-progress']
    if (allowedChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args))
    }
  },

  /** 取消监听 */
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback)
  },

  // ── 平台信息 ──────────────────────────────────────

  /** 获取平台（darwin / win32 / linux） */
  platform: process.platform,

  /** 是否在 Electron 中运行 */
  isElectron: true,

  // ── Gateway 连接信息 ──────────────────────────────

  /** Gateway 地址（主进程从配置读取后注入） */
  gatewayUrl: () => ipcRenderer.invoke('get-gateway-url'),

  /** Gateway 鉴权 Token（主进程从配置读取后注入） */
  gatewayToken: () => ipcRenderer.invoke('get-gateway-token'),

  // ── Permissions 页面兼容别名 ──────────────────────
  /** 读取完整配置（Permissions 页面用） */
  readConfig: () => ipcRenderer.invoke('get-config'),

  /** 保存完整配置 JSON（Permissions 页面用） */
  saveFullConfig: (config) => ipcRenderer.invoke('save-full-config', config),

  // ── 开发者终端 ────────────────────────────────────
  /** 执行系统命令（DevMode 终端用） */
  runCommand: (cmd) => ipcRenderer.invoke('run-command', cmd),
})
