'use strict'

/**
 * ocManager.cjs — OpenClaw 进程管理器
 * 统一管理 OpenClaw gateway 的启动、停止、检查，以及 workspace 初始化
 */

const { exec, spawn } = require('child_process')
const http = require('http')
const os = require('os')
const path = require('path')
const fs = require('fs')

const GATEWAY_PORT = 18789
const GATEWAY_URL = `http://localhost:${GATEWAY_PORT}`
const isMac = process.platform === 'darwin'
const isWindows = process.platform === 'win32'

// ─── 工具 ────────────────────────────────────────────

function runCmd(cmd, opts = {}) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 60000, shell: true, ...opts }, (err, stdout, stderr) => {
      resolve({
        ok: !err,
        stdout: (stdout || '').trim(),
        stderr: (stderr || '').trim(),
        code: err ? err.code : 0,
      })
    })
  })
}

// 获取 openclaw 命令路径
function getOpenClawCmd() {
  const candidates = ['openclaw']
  if (isWindows) {
    const appData = process.env.APPDATA || ''
    candidates.push('openclaw.cmd')
    candidates.push(path.join(appData, 'npm', 'openclaw.cmd'))
    candidates.push('C:\\Program Files\\nodejs\\openclaw.cmd')
  } else if (isMac) {
    candidates.push('/usr/local/bin/openclaw')
    candidates.push('/opt/homebrew/bin/openclaw')
  }
  candidates.push(path.join(os.homedir(), '.npm-global', 'bin', 'openclaw'))
  candidates.push(path.join(os.homedir(), '.local', 'bin', 'openclaw'))
  return candidates[0] // 先用系统 PATH 中的
}

// ─── Gateway URL ─────────────────────────────────────

/**
 * 返回 OpenClaw Gateway URL
 * @returns {string}
 */
function getGatewayUrl() {
  return GATEWAY_URL
}

// ─── 检查 Gateway 是否在运行 ─────────────────────────

/**
 * 先用 openclaw gateway status 命令检查，再 HTTP 探测
 * @returns {Promise<boolean>}
 */
async function isGatewayRunning() {
  // 方式1：命令行检查
  try {
    const cmd = getOpenClawCmd()
    const result = await runCmd(`"${cmd}" gateway status`, { timeout: 8000 })
    if (result.ok && (
      result.stdout.includes('running') ||
      result.stdout.includes('active') ||
      result.stdout.includes('在运行')
    )) {
      return true
    }
  } catch {}

  // 方式2：HTTP 探测
  return await httpProbeGateway()
}

/**
 * HTTP 探测 Gateway /health 端点
 * @returns {Promise<boolean>}
 */
function httpProbeGateway() {
  return new Promise((resolve) => {
    const url = new URL(`${GATEWAY_URL}/health`)
    const req = http.get(
      { host: url.hostname, port: Number(url.port) || GATEWAY_PORT, path: url.pathname },
      (res) => {
        // 200 或 404 都说明服务在运行
        resolve(res.statusCode === 200 || res.statusCode === 404)
      }
    )
    req.on('error', () => resolve(false))
    req.setTimeout(3000, () => { req.destroy(); resolve(false) })
  })
}

// ─── 启动 Gateway ─────────────────────────────────────

let _gatewayProcess = null

/**
 * 启动 OpenClaw Gateway
 * 优先检查是否已运行；优先 daemon 模式，回退 foreground
 * @param {{ onLog?: (msg:string)=>void }} [opts]
 * @returns {Promise<{ ok: boolean, daemon: boolean }>}
 */
async function startGateway(opts = {}) {
  const log = opts.onLog || (() => {})

  // 已运行则直接返回
  if (await isGatewayRunning()) {
    log('[ocManager] Gateway 已在运行，跳过启动')
    return { ok: true, daemon: true }
  }

  const cmd = getOpenClawCmd()
  log(`[ocManager] 尝试以 daemon 模式启动 Gateway...`)

  // 尝试 daemon 模式 (openclaw gateway start)
  const daemonResult = await runCmd(`"${cmd}" gateway start`, { timeout: 15000 })
  if (daemonResult.ok) {
    // 给 daemon 几秒启动
    await sleep(2000)
    if (await isGatewayRunning()) {
      log('[ocManager] Gateway daemon 启动成功')
      return { ok: true, daemon: true }
    }
  }

  // 回退：foreground 模式 (spawn)
  log('[ocManager] Daemon 模式失败，回退到 foreground 模式...')
  try {
    const fgProcess = spawn(cmd, ['gateway', 'run', '--port', String(GATEWAY_PORT)], {
      shell: isWindows,
      env: { ...process.env },
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    fgProcess.stdout && fgProcess.stdout.on('data', (d) => {
      log(`[gateway] ${d.toString().trim()}`)
    })
    fgProcess.stderr && fgProcess.stderr.on('data', (d) => {
      const t = d.toString().trim()
      if (t) log(`[gateway stderr] ${t}`)
    })
    fgProcess.on('error', (e) => log(`[gateway error] ${e.message}`))
    fgProcess.on('exit', (code) => {
      log(`[gateway exit] code=${code}`)
      _gatewayProcess = null
    })

    _gatewayProcess = fgProcess
    await sleep(3000)

    const running = await isGatewayRunning()
    log(running ? '[ocManager] Foreground Gateway 启动成功' : '[ocManager] Foreground Gateway 未响应')
    return { ok: running, daemon: false }
  } catch (e) {
    log(`[ocManager] startGateway 失败: ${e.message}`)
    return { ok: false, daemon: false }
  }
}

// ─── 停止 Gateway ─────────────────────────────────────

/**
 * 停止 OpenClaw Gateway
 * @returns {Promise<void>}
 */
async function stopGateway() {
  // 先用命令停止 daemon
  try {
    const cmd = getOpenClawCmd()
    await runCmd(`"${cmd}" gateway stop`, { timeout: 10000 })
  } catch {}

  // 杀掉 foreground 进程
  if (_gatewayProcess) {
    try { _gatewayProcess.kill('SIGTERM') } catch {}
    await sleep(2000)
    try { _gatewayProcess.kill('SIGKILL') } catch {}
    _gatewayProcess = null
  }

  // 备用：系统级杀进程
  if (isWindows) {
    await runCmd('taskkill /F /IM openclaw.exe').catch(() => {})
  } else {
    await runCmd('pkill -f "openclaw gateway"').catch(() => {})
  }
}

// ─── 初始化 Workspace ─────────────────────────────────

/**
 * 运行 openclaw setup（非交互式）初始化 workspace
 * @param {{ onLog?: (msg:string)=>void }} [opts]
 * @returns {Promise<{ ok: boolean, output: string }>}
 */
async function initWorkspace(opts = {}) {
  const log = opts.onLog || (() => {})
  const cmd = getOpenClawCmd()

  log('[ocManager] 初始化 OpenClaw workspace...')

  // 尝试 openclaw setup（跳过交互）
  const result = await runCmd(
    `"${cmd}" setup`,
    { timeout: 30000, env: { ...process.env, OPENCLAW_NON_INTERACTIVE: '1' } }
  )

  if (result.ok) {
    log('[ocManager] Workspace 初始化成功')
    return { ok: true, output: result.stdout }
  }

  // 忽略非零退出（已初始化的情况）
  if (
    result.stderr.includes('already') ||
    result.stderr.includes('exists') ||
    result.stdout.includes('already')
  ) {
    log('[ocManager] Workspace 已初始化，跳过')
    return { ok: true, output: result.stdout || result.stderr }
  }

  log(`[ocManager] initWorkspace 警告: ${result.stderr || result.stdout}`)
  // 不强制失败，避免阻断启动流程
  return { ok: false, output: result.stderr || result.stdout }
}

// ─── 辅助 ─────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// ─── 导出 ─────────────────────────────────────────────

module.exports = {
  getGatewayUrl,
  isGatewayRunning,
  startGateway,
  stopGateway,
  initWorkspace,
  httpProbeGateway,
  GATEWAY_PORT,
  GATEWAY_URL,
}
