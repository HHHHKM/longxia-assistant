'use strict'

const { app, BrowserWindow, Tray, Menu, ipcMain, shell, dialog, nativeImage } = require('electron')
const path = require('path')
const { spawn, exec } = require('child_process')
const http = require('http')
const fs = require('fs')
const os = require('os')

const {
  checkAndInstallNode,
  checkAndInstallOpenClaw,
  hasConfig,
  readConfig,
  saveConfig,
  saveConfigFull,
  getConfigPath,
  runCommand,
} = require('./installer.cjs')

const {
  isGatewayRunning,
  startGateway,
  stopGateway,
  initWorkspace,
  getGatewayUrl,
  GATEWAY_PORT,
} = require('./ocManager.cjs')

// ─── 平台检测 ────────────────────────────────────────
const isMac = process.platform === 'darwin'
const isWindows = process.platform === 'win32'

// ─── 全局变量 ────────────────────────────────────────
let mainWindow = null
let splashWindow = null
let tray = null
let serviceRunning = false

// OpenClaw gateway 端口 18789
const SERVICE_PORT = GATEWAY_PORT        // 18789
const SERVICE_URL = getGatewayUrl()      // http://localhost:18789

// ─── 启动画面 ────────────────────────────────────────

function showSplash() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 360,
    frame: false,
    transparent: false,
    resizable: false,
    alwaysOnTop: true,
    center: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })
  splashWindow.loadFile(path.join(__dirname, 'splash.html'))
  splashWindow.show()
}

function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close()
    splashWindow = null
  }
}

/**
 * 更新启动画面的状态文字和进度条
 * @param {string} text - 状态文字
 * @param {number} percent - 进度百分比 0-100
 * @param {number} step - 当前步骤 0-4
 */
function updateSplash(text, percent = 0, step = 0) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.executeJavaScript(
      `window.updateStatus && window.updateStatus(${JSON.stringify(text)}, ${percent}, ${step})`
    ).catch(() => {})
  }
  console.log(`[启动] ${text}`)
}

// ─── 错误展示 ────────────────────────────────────────

function showError(msg) {
  closeSplash()
  dialog.showErrorBox('龙虾助手启动失败', `${msg}\n\n请截图发给技术支持。`)
}

// ─── 主窗口 ──────────────────────────────────────────

function createMainWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: '龙虾助手',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  })

  mainWindow.loadURL(url)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  // 关闭时最小化到托盘而非退出
  mainWindow.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault()
      mainWindow.hide()
      if (tray) {
        tray.displayBalloon && tray.displayBalloon({
          title: '龙虾助手',
          content: '程序仍在后台运行，点击托盘图标可重新打开',
        })
      }
    }
  })

  mainWindow.on('closed', () => { mainWindow = null })
  return mainWindow
}

function showMainPanel() {
  const url = `${SERVICE_URL}`
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.loadURL(url)
    mainWindow.show()
    mainWindow.focus()
  } else {
    createMainWindow(url)
  }
}

function showSetupWizard() {
  // 向导页：在本地 React 应用的 /setup 路由
  // 开发时：Vite 热更新服务器；打包后：dist/index.html#/setup
  let url
  if (process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL) {
    const base = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
    url = `${base}/#/setup`
  } else {
    url = `file://${path.join(__dirname, '..', 'dist', 'index.html')}#/setup`
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.loadURL(url)
    mainWindow.show()
    mainWindow.focus()
  } else {
    // 向导窗口尺寸适中，适合老年人操作
    mainWindow = new BrowserWindow({
      width: 860,
      height: 760,
      minWidth: 720,
      minHeight: 640,
      title: '龙虾助手 - 初次设置',
      show: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false,
      },
    })
    mainWindow.loadURL(url)
    mainWindow.once('ready-to-show', () => {
      mainWindow.show()
      mainWindow.focus()
    })
    mainWindow.on('close', (e) => {
      if (!app.isQuiting) {
        e.preventDefault()
        mainWindow.hide()
      }
    })
    mainWindow.on('closed', () => { mainWindow = null })
  }
}

// ─── 系统托盘 ────────────────────────────────────────

function setupTray() {
  let iconPath = path.join(__dirname, '..', 'public', 'icon.png')
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, '..', 'public', 'tray-icon.png')
    if (!fs.existsSync(iconPath)) {
      const buf = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      )
      fs.writeFileSync(iconPath, buf)
    }
  }

  try {
    tray = new Tray(iconPath)
  } catch (e) {
    console.warn('托盘图标加载失败:', e.message)
    return
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '🦞 打开龙虾助手',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        } else {
          showMainPanel()
        }
      },
    },
    { type: 'separator' },
    {
      label: '🔄 重启服务',
      click: async () => {
        await stopGateway()
        await new Promise(r => setTimeout(r, 1000))
        await startGateway({ onLog: console.log })
      },
    },
    {
      label: '📋 查看日志',
      click: () => {
        shell.openExternal(`${SERVICE_URL}/api/logs`)
      },
    },
    { type: 'separator' },
    {
      label: '❌ 退出',
      click: () => {
        app.isQuiting = true
        stopGateway()
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)
  tray.setToolTip('龙虾助手 🦞')

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    } else {
      showMainPanel()
    }
  })
}

// ─── 健康检查 ─────────────────────────────────────────

function checkServiceHealth() {
  return new Promise((resolve) => {
    const url = new URL(`${SERVICE_URL}/health`)
    const req = http.get(
      { host: url.hostname, port: Number(url.port) || SERVICE_PORT, path: url.pathname },
      (res) => {
        resolve(res.statusCode === 200 || res.statusCode === 404)
      }
    )
    req.on('error', () => resolve(false))
    req.setTimeout(3000, () => { req.destroy(); resolve(false) })
  })
}

/**
 * 等待服务就绪
 * @param {number} maxSeconds
 */
async function waitForService(maxSeconds = 60) {
  for (let i = 0; i < maxSeconds; i++) {
    const ok = await checkServiceHealth()
    if (ok) {
      serviceRunning = true
      return true
    }
    await new Promise(r => setTimeout(r, 1000))
  }
  console.warn(`[警告] 服务在 ${maxSeconds}s 内未响应，继续启动`)
  return false
}

// ─── IPC 处理 ─────────────────────────────────────────

ipcMain.handle('get-status', async () => {
  const ok = await checkServiceHealth()
  return {
    serviceRunning: ok,
    configExists: hasConfig(),
    config: readConfig(),
    gatewayUrl: SERVICE_URL,
  }
})

ipcMain.handle('is-first-run', async () => {
  return !hasConfig()
})

ipcMain.handle('save-config', async (event, { provider, apiKey, telegramBotToken }) => {
  try {
    saveConfig(provider, apiKey, telegramBotToken)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('save-config-full', async (event, opts) => {
  try {
    saveConfigFull(opts)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('get-config', async () => {
  return readConfig()
})

ipcMain.handle('restart-service', async () => {
  await stopGateway()
  await new Promise(r => setTimeout(r, 1000))
  await startGateway({ onLog: console.log })
  await waitForService(30)
  return { ok: true }
})

ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url)
  return { ok: true }
})

/**
 * 向导完成后：
 * 1. 初始化 workspace
 * 2. 如果配置了飞书，安装飞书插件
 * 3. 启动 Gateway
 * 4. 等待就绪
 * 5. 展示主面板
 */
ipcMain.handle('setup-complete', async () => {
  try {
    // 初始化 workspace
    await initWorkspace({ onLog: console.log })
  } catch (e) {
    console.warn('[setup-complete] initWorkspace 失败，继续:', e.message)
  }

  // 检查是否配置了飞书，安装飞书插件
  try {
    const config = readConfig()
    if (config && config.channels && config.channels.feishu) {
      console.log('[setup-complete] 检测到飞书配置，安装飞书插件...')
      await installFeishuPlugin()
    }
  } catch (e) {
    console.warn('[setup-complete] 飞书插件安装失败（非致命）:', e.message)
  }

  // 启动 Gateway（如未运行）
  const running = await checkServiceHealth()
  if (!running) {
    await startGateway({ onLog: console.log })
    await waitForService(30)
  }

  showMainPanel()
  return { ok: true }
})

// ── Gateway 连接信息 IPC ──────────────────────────────

ipcMain.handle('get-gateway-url', () => {
  return SERVICE_URL
})

ipcMain.handle('get-gateway-token', () => {
  try {
    const cfg = readConfig()
    return cfg?.gateway?.auth?.token || ''
  } catch {
    return ''
  }
})

// ── Permissions 页面：写入完整配置 ──
ipcMain.handle('save-full-config', async (event, newConfig) => {
  try {
    const configPath = getConfigPath()
    // 深度合并：保留现有字段，覆盖传入字段
    const existing = readConfig() || {}
    function deepMerge(base, override) {
      const result = { ...base }
      for (const key of Object.keys(override)) {
        if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
          result[key] = deepMerge(base[key] || {}, override[key])
        } else {
          result[key] = override[key]
        }
      }
      return result
    }
    const merged = deepMerge(existing, newConfig)
    fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf8')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

// ── DevMode 终端：执行系统命令 ──
ipcMain.handle('run-command', async (event, cmd) => {
  const { exec } = require('child_process')
  return new Promise((resolve) => {
    exec(cmd, { timeout: 30000, maxBuffer: 1024 * 512 }, (err, stdout, stderr) => {
      resolve({
        exitCode: err ? (err.code || 1) : 0,
        stdout: stdout || '',
        stderr: stderr || '',
      })
    })
  })
})

/**
 * 安装飞书插件：openclaw plugins install @openclaw/feishu
 */
async function installFeishuPlugin() {
  const cmd = `openclaw plugins install @openclaw/feishu --registry=https://registry.npmmirror.com`
  console.log('[feishu] 安装插件:', cmd)
  const result = await runCommand(cmd, { timeout: 120000 })
  if (result.ok) {
    console.log('[feishu] 插件安装成功')
  } else {
    // 尝试官方源
    const result2 = await runCommand(
      `openclaw plugins install @openclaw/feishu`,
      { timeout: 120000 }
    )
    if (!result2.ok) {
      throw new Error(`飞书插件安装失败：${result2.stderr || result2.stdout}`)
    }
    console.log('[feishu] 插件安装成功（官方源）')
  }
}

// ─── 应用事件 ─────────────────────────────────────────

app.on('window-all-closed', () => {
  // 保留托盘，不退出
})

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show()
  } else {
    showMainPanel()
  }
})

app.on('before-quit', () => {
  app.isQuiting = true
  stopGateway()
})

// ─── 主入口 ───────────────────────────────────────────

async function main() {
  await app.whenReady()

  // 防止多开
  const gotLock = app.requestSingleInstanceLock()
  if (!gotLock) {
    dialog.showMessageBoxSync({ message: '龙虾助手已在运行，请在任务栏找到它！', type: 'info' })
    app.quit()
    return
  }

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  showSplash()

  try {
    // 步骤 0: 检查电脑环境（Node.js）
    updateSplash('检查电脑环境...', 10, 0)
    await checkAndInstallNode((msg) => updateSplash(msg, 20, 0))

    // 步骤 1: 安装 AI 引擎（OpenClaw）
    updateSplash('安装 AI 引擎...', 30, 1)
    await checkAndInstallOpenClaw((msg) => updateSplash(msg, 45, 1))

    // 步骤 2: 检查配置
    updateSplash('初始化工作区...', 55, 2)
    const firstRun = !hasConfig()

    if (!firstRun) {
      // 步骤 3: 启动 AI 服务
      // 先检查 daemon 是否已在系统层面运行
      updateSplash('启动 AI 服务...', 65, 3)

      const alreadyRunning = await isGatewayRunning()
      if (alreadyRunning) {
        console.log('[main] Gateway 已在系统级运行，跳过启动')
        serviceRunning = true
      } else {
        // 初始化 workspace，然后启动
        await initWorkspace({ onLog: console.log })
        await startGateway({ onLog: (msg) => updateSplash(msg, 75, 3) })
        updateSplash('等待 AI 服务就绪...', 80, 4)
        await waitForService(60)
      }
    }

    updateSplash('准备完成！', 100, 4)
    await new Promise(r => setTimeout(r, 600))

    closeSplash()

    if (firstRun) {
      showSetupWizard()
    } else {
      showMainPanel()
    }

    setupTray()
  } catch (err) {
    console.error('[main] 启动失败:', err)
    showError(err.message || '未知错误')
  }
}

main()
