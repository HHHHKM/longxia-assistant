'use strict'

const { exec, execSync, spawn } = require('child_process')
const https = require('https')
const http = require('http')
const fs = require('fs')
const os = require('os')
const path = require('path')

// Node 22 LTS
const NODE_VERSION = 'v22.14.0'
const GIT_RELEASES_API = 'https://api.github.com/repos/git-for-windows/git/releases/latest'
const MINGIT_FALLBACK_URL = 'https://github.com/git-for-windows/git/releases/download/v2.45.2.windows.1/MinGit-2.45.2-64-bit.zip'
const MINGIT_MIRROR_ENV = 'LONGXIA_MINGIT_MIRRORS'
const MINGIT_SINGLE_URL_ENV = 'LONGXIA_MINGIT_URL'
const isMac = process.platform === 'darwin'
const isWindows = process.platform === 'win32'
const isLinux = process.platform === 'linux'

// ─── 工具函数 ───────────────────────────────────────

/**
 * 执行命令，返回 { ok, stdout, stderr }
 */
function runCommand(cmd, opts = {}) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 120000, shell: true, ...opts }, (err, stdout, stderr) => {
      resolve({ ok: !err, stdout: (stdout || '').trim(), stderr: (stderr || '').trim(), err })
    })
  })
}

function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const request = protocol.get(url, { headers }, (response) => {
      // 处理重定向
      if (response.statusCode === 301 || response.statusCode === 302) {
        return fetchJson(response.headers.location, headers).then(resolve).catch(reject)
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`请求失败（${response.statusCode}）`))
      }
      const chunks = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => {
        try {
          const text = Buffer.concat(chunks).toString('utf8')
          resolve(JSON.parse(text))
        } catch (e) {
          reject(e)
        }
      })
      response.on('error', reject)
    })
    request.on('error', reject)
    request.setTimeout(15000, () => {
      request.destroy()
      reject(new Error('请求超时'))
    })
  })
}

function findGitExe(rootDir) {
  const directPath = path.join(rootDir, 'cmd', 'git.exe')
  if (fs.existsSync(directPath)) return directPath

  if (!fs.existsSync(rootDir)) return null

  const stack = [rootDir]
  while (stack.length > 0) {
    const current = stack.pop()
    let entries = []
    try {
      entries = fs.readdirSync(current, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(fullPath)
        continue
      }
      if (entry.isFile() && entry.name.toLowerCase() === 'git.exe') {
        return fullPath
      }
    }
  }
  return null
}

function normalizeUrlList(raw) {
  if (!raw) return []
  return String(raw)
    .split(/[,\n;\r]/)
    .map((item) => item.trim())
    .filter((item) => {
      if (!item) return false
      try {
        const parsed = new URL(item)
        return parsed.protocol === 'https:' || parsed.protocol === 'http:'
      } catch {
        return false
      }
    })
}

function deriveFilenameFromUrl(url, fallback = 'MinGit-64-bit.zip') {
  try {
    const parsed = new URL(url)
    const name = path.basename(parsed.pathname || '')
    if (name && /\.zip$/i.test(name)) return name
  } catch {}
  return fallback
}

function readInstallerMirrorConfig() {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local')
  const programData = process.env.ProgramData || 'C:\\ProgramData'
  const configPaths = [
    path.join(localAppData, 'longxia-assistant', 'installer.json'),
    path.join(programData, 'longxia-assistant', 'installer.json'),
  ]

  const urls = []
  for (const configPath of configPaths) {
    if (!fs.existsSync(configPath)) continue
    try {
      const raw = fs.readFileSync(configPath, 'utf8')
      const json = JSON.parse(raw)
      if (json && typeof json.minGitUrl === 'string') {
        urls.push(...normalizeUrlList(json.minGitUrl))
      }
      if (json && Array.isArray(json.minGitMirrors)) {
        urls.push(...json.minGitMirrors.flatMap((item) => normalizeUrlList(item)))
      }
    } catch {
      // 配置文件无效时忽略，继续其他来源
    }
  }
  return urls
}

function getCustomMinGitSources() {
  const urls = [
    ...normalizeUrlList(process.env[MINGIT_MIRROR_ENV] || ''),
    ...normalizeUrlList(process.env[MINGIT_SINGLE_URL_ENV] || ''),
    ...readInstallerMirrorConfig(),
  ]

  const dedup = new Set()
  const sources = []
  for (const url of urls) {
    if (dedup.has(url)) continue
    dedup.add(url)
    sources.push({
      url,
      filename: deriveFilenameFromUrl(url, `MinGit-custom-${Date.now()}-64-bit.zip`),
      source: 'mirror',
    })
  }
  return sources
}

async function resolveMinGitSources() {
  const sources = [...getCustomMinGitSources()]

  try {
    const release = await fetchJson(
      GIT_RELEASES_API,
      { 'User-Agent': 'longxia-assistant-installer' }
    )
    const assets = Array.isArray(release.assets) ? release.assets : []
    const minGitAsset = assets.find((asset) => {
      const name = asset && asset.name ? String(asset.name) : ''
      return /^MinGit-.*-64-bit\.zip$/i.test(name)
    })
    if (minGitAsset && minGitAsset.browser_download_url) {
      sources.push({
        url: minGitAsset.browser_download_url,
        filename: minGitAsset.name || 'MinGit-latest-64-bit.zip',
        source: 'github-latest',
      })
    }
  } catch {
    // 静默继续，后续会走 fallback
  }

  sources.push({
    url: MINGIT_FALLBACK_URL,
    filename: path.basename(MINGIT_FALLBACK_URL),
    source: 'github-fallback',
  })

  // 去重，保持优先级：镜像 > latest > fallback
  const dedup = new Set()
  return sources.filter((item) => {
    if (dedup.has(item.url)) return false
    dedup.add(item.url)
    return true
  })
}

async function ensureGitForNpm(onProgress) {
  const hasGit = await runCommand('git --version', { timeout: 10000 })
  if (hasGit.ok) {
    return { ...process.env }
  }

  if (!isWindows) {
    throw new Error('系统缺少 git 命令，请先安装 Git 后再试。')
  }

  if (onProgress) onProgress('检测到系统缺少 Git，正在准备运行时依赖...')

  const toolsRoot = path.join(os.homedir(), 'AppData', 'Local', 'longxia-assistant', 'tools')
  const minGitRoot = path.join(toolsRoot, 'mingit')

  let gitExe = findGitExe(minGitRoot)
  if (!gitExe) {
    const minGitSources = await resolveMinGitSources()
    let lastError = null

    for (const source of minGitSources) {
      const zipPath = path.join(
        os.tmpdir(),
        source.filename || `MinGit-${Date.now()}-64-bit.zip`
      )
      try {
        if (onProgress) onProgress(`正在下载 Git 运行时（${source.source}）...`)
        await downloadFile(source.url, zipPath, (pct) => {
          if (onProgress) onProgress(`下载 Git 运行时 ${pct}%...`)
        })

        if (onProgress) onProgress('正在解压 Git 运行时...')
        fs.rmSync(minGitRoot, { recursive: true, force: true })
        fs.mkdirSync(minGitRoot, { recursive: true })

        const escapedZip = zipPath.replace(/'/g, "''")
        const escapedDest = minGitRoot.replace(/'/g, "''")
        const extractCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '${escapedZip}' -DestinationPath '${escapedDest}' -Force"`
        const extractResult = await runCommand(extractCmd, { timeout: 180000 })

        if (!extractResult.ok) {
          throw new Error(`Git 运行时解压失败：${extractResult.stderr || extractResult.stdout}`)
        }

        gitExe = findGitExe(minGitRoot)
        if (gitExe) break
        throw new Error('Git 运行时解压完成，但未找到 git.exe')
      } catch (e) {
        lastError = e
      } finally {
        fs.unlink(zipPath, () => {})
      }
    }

    if (!gitExe) {
      throw new Error(
        `Git 运行时准备失败：${lastError && lastError.message ? lastError.message : '未知错误'}`
      )
    }
  }

  if (!gitExe) {
    throw new Error(
      `Git 运行时准备失败，请手动安装 Git 后重试。` +
      `（可配置镜像：环境变量 ${MINGIT_MIRROR_ENV} 或 ${MINGIT_SINGLE_URL_ENV}）`
    )
  }

  const gitRoot = path.dirname(path.dirname(gitExe))
  const pathEntries = [
    path.dirname(gitExe),
    path.join(gitRoot, 'mingw64', 'bin'),
    path.join(gitRoot, 'usr', 'bin'),
    path.join(gitRoot, 'bin'),
  ].filter((p) => fs.existsSync(p))

  const env = {
    ...process.env,
    PATH: `${pathEntries.join(path.delimiter)}${path.delimiter}${process.env.PATH || ''}`,
    GIT_TERMINAL_PROMPT: '0',
  }

  const verifyGit = await runCommand('git --version', { timeout: 10000, env })
  if (!verifyGit.ok) {
    const verifyGitExe = await runCommand(`"${gitExe}" --version`, { timeout: 10000, env })
    if (!verifyGitExe.ok) {
      throw new Error(`Git 运行时不可用：${verifyGit.stderr || verifyGitExe.stderr}`)
    }
  }

  return env
}

/**
 * 下载文件到指定路径
 */
function downloadFile(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    const protocol = url.startsWith('https') ? https : http

    const request = protocol.get(url, (response) => {
      // 处理重定向
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close()
        fs.unlink(dest, () => {})
        return downloadFile(response.headers.location, dest, onProgress).then(resolve).catch(reject)
      }

      if (response.statusCode !== 200) {
        file.close()
        fs.unlink(dest, () => {})
        return reject(new Error(`下载失败，状态码：${response.statusCode}`))
      }

      const totalBytes = parseInt(response.headers['content-length'], 10) || 0
      let downloadedBytes = 0

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length
        if (onProgress && totalBytes > 0) {
          onProgress(Math.round((downloadedBytes / totalBytes) * 100))
        }
      })

      response.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
      file.on('error', (err) => { fs.unlink(dest, () => {}); reject(err) })
    })

    request.on('error', (err) => { fs.unlink(dest, () => {}); reject(err) })
    request.setTimeout(120000, () => { request.destroy(); reject(new Error('下载超时')) })
  })
}

// ─── 检测 Node.js ───────────────────────────────────

async function isNodeInstalled() {
  // 尝试直接执行
  const result = await runCommand('node --version')
  if (result.ok && result.stdout.startsWith('v')) {
    // 检查版本是否 >= 22
    const match = result.stdout.match(/^v(\d+)\./)
    if (match && parseInt(match[1], 10) >= 22) return true
    // 版本太低，需要升级
    console.warn(`[installer] Node ${result.stdout} < v22，需要升级`)
    return false
  }

  // Windows：尝试常见安装路径
  if (isWindows) {
    const paths = [
      'C:\\Program Files\\nodejs\\node.exe',
      'C:\\Program Files (x86)\\nodejs\\node.exe',
      path.join(os.homedir(), 'AppData\\Roaming\\nvm\\current\\node.exe'),
    ]
    for (const p of paths) {
      if (fs.existsSync(p)) {
        // 检查版本
        const vResult = await runCommand(`"${p}" --version`)
        if (vResult.ok && vResult.stdout.startsWith('v')) {
          const m = vResult.stdout.match(/^v(\d+)\./)
          if (m && parseInt(m[1], 10) >= 22) return true
        }
      }
    }
  }

  // Mac：尝试 brew 安装路径
  if (isMac) {
    for (const p of ['/usr/local/bin/node', '/opt/homebrew/bin/node']) {
      const r = await runCommand(`"${p}" --version`)
      if (r.ok && r.stdout.startsWith('v')) {
        const m = r.stdout.match(/^v(\d+)\./)
        if (m && parseInt(m[1], 10) >= 22) return true
      }
    }
  }

  return false
}

// ─── 安装 Node.js ────────────────────────────────────

async function installNodeWindows(onProgress) {
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
  const filename = `node-${NODE_VERSION}-${arch}.msi`
  // 优先 npmmirror
  const url = `https://npmmirror.com/mirrors/node/${NODE_VERSION}/${filename}`
  const tmpPath = path.join(os.tmpdir(), filename)

  if (onProgress) onProgress(`正在下载 Node.js ${NODE_VERSION}...`)
  await downloadFile(url, tmpPath, (pct) => {
    if (onProgress) onProgress(`下载 Node.js ${pct}%...`)
  })

  if (onProgress) onProgress('正在安装 Node.js，请稍候...')
  const result = await runCommand(
    `msiexec /i "${tmpPath}" /quiet /norestart ADDLOCAL=ALL`,
    { timeout: 300000 }
  )

  fs.unlink(tmpPath, () => {})

  if (!result.ok) {
    throw new Error(`Node.js 安装失败：${result.stderr || result.stdout}`)
  }

  // Windows：从注册表读取新的 PATH，而不是硬编码
  await refreshWindowsPath()
}

/**
 * Windows 专用：从注册表刷新系统 PATH
 */
async function refreshWindowsPath() {
  try {
    // 读取系统级 Path
    const sysResult = await runCommand(
      'reg query "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment" /v Path',
      { timeout: 10000 }
    )
    // 读取用户级 Path
    const userResult = await runCommand(
      'reg query "HKCU\\Environment" /v PATH',
      { timeout: 10000 }
    )

    let combinedPath = process.env.PATH || ''

    if (sysResult.ok) {
      const m = sysResult.stdout.match(/Path\s+REG_(?:SZ|EXPAND_SZ)\s+(.+)/)
      if (m) combinedPath = `${m[1].trim()}${path.delimiter}${combinedPath}`
    }
    if (userResult.ok) {
      const m = userResult.stdout.match(/PATH\s+REG_(?:SZ|EXPAND_SZ)\s+(.+)/)
      if (m) combinedPath = `${m[1].trim()}${path.delimiter}${combinedPath}`
    }

    process.env.PATH = combinedPath
    console.log('[installer] Windows PATH 已从注册表刷新')
  } catch (e) {
    // 回退：手动加入常见 nodejs 路径
    process.env.PATH = `C:\\Program Files\\nodejs${path.delimiter}${process.env.PATH || ''}`
    console.warn('[installer] PATH 刷新失败，已使用回退路径:', e.message)
  }
}

async function installNodeMac(onProgress) {
  // 优先尝试 brew
  const hasBrew = await runCommand('which brew')
  if (hasBrew.ok) {
    if (onProgress) onProgress('正在通过 Homebrew 安装 Node.js 22...')
    const result = await runCommand(
      '/opt/homebrew/bin/brew install node@22 || /usr/local/bin/brew install node@22',
      { timeout: 300000 }
    )
    if (result.ok) {
      process.env.PATH = `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ''}`
      return
    }
  }

  // 备选：下载 .pkg
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
  const filename = `node-${NODE_VERSION}-${arch}.pkg`
  const url = `https://npmmirror.com/mirrors/node/${NODE_VERSION}/${filename}`
  const tmpPath = path.join(os.tmpdir(), filename)

  if (onProgress) onProgress(`正在下载 Node.js ${NODE_VERSION}...`)
  await downloadFile(url, tmpPath, (pct) => {
    if (onProgress) onProgress(`下载 Node.js ${pct}%...`)
  })

  if (onProgress) onProgress('正在安装 Node.js，请稍候...')
  const result = await runCommand(`sudo installer -pkg "${tmpPath}" -target /`, { timeout: 300000 })

  fs.unlink(tmpPath, () => {})

  if (!result.ok) {
    throw new Error(`Node.js 安装失败。请手动安装：https://nodejs.org/zh-cn/download`)
  }

  process.env.PATH = `/usr/local/bin:${process.env.PATH || ''}`
}

async function installNodeLinux(onProgress) {
  if (onProgress) onProgress('正在安装 Node.js 22...')

  // 方式1：NodeSource
  const nsResult = await runCommand(
    `curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash - && sudo apt-get install -y nodejs`,
    { timeout: 300000 }
  )
  if (nsResult.ok) return

  // 方式2：snap
  const snapResult = await runCommand('sudo snap install node --classic --channel=22', { timeout: 300000 })
  if (snapResult.ok) return

  // 方式3：下载二进制
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
  const filename = `node-${NODE_VERSION}-linux-${arch}.tar.xz`
  const url = `https://npmmirror.com/mirrors/node/${NODE_VERSION}/${filename}`
  const tmpPath = path.join(os.tmpdir(), filename)

  if (onProgress) onProgress(`正在下载 Node.js ${NODE_VERSION}...`)
  await downloadFile(url, tmpPath, (pct) => {
    if (onProgress) onProgress(`下载 Node.js ${pct}%...`)
  })

  const installDir = path.join(os.homedir(), '.local', 'node')
  await runCommand(`mkdir -p "${installDir}" && tar -xf "${tmpPath}" -C "${installDir}" --strip-components=1`)
  fs.unlink(tmpPath, () => {})

  process.env.PATH = `${installDir}/bin${path.delimiter}${process.env.PATH || ''}`
}

async function checkAndInstallNode(onProgress) {
  const installed = await isNodeInstalled()
  if (installed) return

  if (isWindows) {
    await installNodeWindows(onProgress)
  } else if (isMac) {
    await installNodeMac(onProgress)
  } else {
    await installNodeLinux(onProgress)
  }

  // 再次验证
  const verify = await isNodeInstalled()
  if (!verify) {
    throw new Error('Node.js 安装完成，但仍无法检测到。请重启电脑后再试。')
  }
}

// ─── 检测 & 安装 OpenClaw ────────────────────────────

async function isOpenClawInstalled() {
  const result = await runCommand('openclaw --version')
  if (result.ok) return true

  // 检查常见全局 bin 路径
  const bins = [
    path.join(os.homedir(), '.npm-global', 'bin', 'openclaw'),
    path.join(os.homedir(), '.local', 'bin', 'openclaw'),
  ]
  if (isWindows) {
    const appData = process.env.APPDATA || ''
    bins.push(path.join(appData, 'npm', 'openclaw.cmd'))
  }
  for (const b of bins) {
    if (fs.existsSync(b)) return true
  }

  return false
}

async function checkAndInstallOpenClaw(onProgress) {
  const installed = await isOpenClawInstalled()
  if (installed) return

  if (onProgress) onProgress('正在安装龙虾助手服务（openclaw）...')

  const npmCmd = isWindows ? 'npm.cmd' : 'npm'
  const mirror = '--registry=https://registry.npmmirror.com'
  const npmEnv = await ensureGitForNpm(onProgress)

  // 先尝试 openclaw（标准包名）
  const result = await runCommand(
    `${npmCmd} install -g openclaw ${mirror}`,
    { timeout: 180000, env: npmEnv }
  )

  if (!result.ok) {
    // 降级：官方 registry
    if (onProgress) onProgress('正在从官方源安装 openclaw...')
    const result2 = await runCommand(
      `${npmCmd} install -g openclaw`,
      { timeout: 180000, env: npmEnv }
    )
    if (!result2.ok) {
      const details = `${result2.stderr || ''}\n${result2.stdout || ''}`
      if (/spawn git|syscall spawn git|enoent.*git|path git/i.test(details)) {
        throw new Error(
          'OpenClaw 安装失败：系统缺少可用的 Git 运行时。\n' +
          '请先安装 Git 后重试，或检查网络后重启安装程序。'
        )
      }
      throw new Error(
        `OpenClaw 安装失败：${result2.stderr || result2.stdout}\n` +
        '请手动执行：npm install -g openclaw'
      )
    }
  }

  // 更新 PATH
  const npmBinResult = await runCommand(`${npmCmd} bin -g`)
  if (npmBinResult.ok && npmBinResult.stdout) {
    process.env.PATH = `${npmBinResult.stdout}${path.delimiter}${process.env.PATH || ''}`
  }

  // 验证
  const verify = await isOpenClawInstalled()
  if (!verify) {
    throw new Error('OpenClaw 安装完成，但无法启动。请重启后重试。')
  }
}

// ─── 配置文件管理 ────────────────────────────────────

function getConfigPath() {
  return path.join(os.homedir(), '.openclaw', 'openclaw.json')
}

function hasConfig() {
  return fs.existsSync(getConfigPath())
}

function readConfig() {
  try {
    const raw = fs.readFileSync(getConfigPath(), 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// ─── 服务商映射表 ────────────────────────────────────

const PROVIDER_MAP = {
  deepseek: {
    providerKey: 'deepseek',
    model: 'deepseek/deepseek-chat',
    modelId: 'deepseek-chat',
    modelName: 'DeepSeek Chat',
    baseUrl: 'https://api.deepseek.com/v1',
    api: 'openai-completions',
  },
  siliconflow: {
    providerKey: 'siliconflow',
    model: 'siliconflow/Qwen/Qwen2.5-7B-Instruct',
    modelId: 'Qwen/Qwen2.5-7B-Instruct',
    modelName: 'Qwen 2.5 7B Instruct',
    baseUrl: 'https://api.siliconflow.cn/v1',
    api: 'openai-completions',
  },
  qwen: {
    providerKey: 'alibaba',
    model: 'alibaba/qwen-plus',
    modelId: 'qwen-plus',
    modelName: 'Qwen Plus',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    api: 'openai-completions',
  },
  openai: {
    providerKey: 'openai',
    model: 'openai/gpt-4o-mini',
    modelId: 'gpt-4o-mini',
    modelName: 'GPT-4o mini',
    baseUrl: 'https://api.openai.com/v1',
    api: 'openai-completions',
  },
  claude: {
    providerKey: 'anthropic',
    model: 'anthropic/claude-3-5-haiku',
    modelId: 'claude-3-5-haiku',
    modelName: 'Claude 3.5 Haiku',
    baseUrl: 'https://api.anthropic.com',
    api: 'anthropic-messages',
  },
  openrouter: {
    providerKey: 'openrouter',
    model: 'openrouter/auto',
    modelId: 'auto',
    modelName: 'OpenRouter Auto',
    baseUrl: 'https://openrouter.ai/api/v1',
    api: 'openai-completions',
  },
}

// ─── 写配置辅助 ──────────────────────────────────────

function ensureConfigDir() {
  const configDir = path.join(os.homedir(), '.openclaw')
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }
}

function loadExistingConfig() {
  try {
    const raw = fs.readFileSync(getConfigPath(), 'utf8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function buildBaseConfig(provider, apiKey) {
  const pm = PROVIDER_MAP[provider] || PROVIDER_MAP.deepseek
  return {
    gateway: {
      mode: 'local',
    },
    models: {
      mode: 'merge',
      providers: {
        [pm.providerKey]: {
          baseUrl: pm.baseUrl,
          apiKey,
          api: pm.api,
          models: [
            {
              id: pm.modelId,
              name: pm.modelName,
            },
          ],
        },
      },
    },
    agents: {
      defaults: {
        model: pm.model,
        workspace: `~/.openclaw/workspace`,
      },
    },
    session: {
      dmScope: 'per-channel-peer',
    },
  }
}

function mergeBaseConfig(existingConfig, base) {
  return {
    ...existingConfig,
    ...base,
    gateway: {
      ...(existingConfig.gateway || {}),
      ...(base.gateway || {}),
      auth: {
        ...(existingConfig.gateway?.auth || {}),
        ...(base.gateway?.auth || {}),
      },
    },
    models: {
      ...(existingConfig.models || {}),
      ...(base.models || {}),
      providers: {
        ...(existingConfig.models?.providers || {}),
        ...(base.models?.providers || {}),
      },
    },
    agents: {
      ...(existingConfig.agents || {}),
      ...(base.agents || {}),
      defaults: {
        ...(existingConfig.agents?.defaults || {}),
        ...(base.agents?.defaults || {}),
      },
    },
    session: {
      ...(existingConfig.session || {}),
      ...(base.session || {}),
    },
  }
}

/**
 * 保存配置文件 — 仅 AI 服务商 + 可选 Telegram
 *
 * 正确的 OpenClaw 格式：
 * {
 *   "models": { "providers": { "<name>": { "apiKey": "..." } } },
 *   "agents": { "defaults": { "model": "...", "workspace": "~/.openclaw/workspace" } },
 *   "session": { "dmScope": "per-channel-peer" },
 *   "channels": { "telegram": { "botToken": "...", "dmPolicy": "pairing" } }
 * }
 *
 * @param {string} provider - 服务商 ID
 * @param {string} apiKey   - API Key
 * @param {string} [telegramBotToken] - Telegram Bot Token (可选)
 */
function saveConfig(provider, apiKey, telegramBotToken) {
  ensureConfigDir()

  const existingConfig = loadExistingConfig()
  const base = buildBaseConfig(provider, apiKey)

  const config = mergeBaseConfig(existingConfig, base)

  if (telegramBotToken && telegramBotToken.trim()) {
    config.channels = {
      ...(existingConfig.channels || {}),
      telegram: {
        botToken: telegramBotToken.trim(),
        dmPolicy: 'pairing',
      },
    }
  } else if (existingConfig.channels) {
    config.channels = existingConfig.channels
  }

  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf8')
}

/**
 * 保存完整配置 — 支持飞书渠道（saveConfigFull）
 *
 * 飞书渠道格式：
 * {
 *   "channels": {
 *     "feishu": {
 *       "enabled": true,
 *       "dmPolicy": "pairing",
 *       "accounts": {
 *         "main": { "appId": "cli_xxx", "appSecret": "xxx" }
 *       }
 *     }
 *   }
 * }
 *
 * @param {object} opts
 * @param {string} opts.provider          - 服务商 ID
 * @param {string} opts.apiKey            - API Key
 * @param {string} [opts.telegramBotToken] - Telegram Bot Token
 * @param {string} [opts.feishuAppId]     - 飞书 App ID
 * @param {string} [opts.feishuAppSecret] - 飞书 App Secret
 */
function saveConfigFull({ provider, apiKey, telegramBotToken, feishuAppId, feishuAppSecret }) {
  ensureConfigDir()

  const existingConfig = loadExistingConfig()
  const base = buildBaseConfig(provider, apiKey)

  const config = mergeBaseConfig(existingConfig, base)
  const channels = { ...(existingConfig.channels || {}) }

  // Telegram 渠道
  if (telegramBotToken && telegramBotToken.trim()) {
    channels.telegram = {
      botToken: telegramBotToken.trim(),
      dmPolicy: 'pairing',
    }
  }

  // 飞书渠道
  if (feishuAppId && feishuAppId.trim() && feishuAppSecret && feishuAppSecret.trim()) {
    channels.feishu = {
      enabled: true,
      dmPolicy: 'pairing',
      accounts: {
        main: {
          appId: feishuAppId.trim(),
          appSecret: feishuAppSecret.trim(),
        },
      },
    }
  }

  if (Object.keys(channels).length > 0) {
    config.channels = channels
  }

  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf8')
}

module.exports = {
  checkAndInstallNode,
  checkAndInstallOpenClaw,
  hasConfig,
  readConfig,
  saveConfig,
  saveConfigFull,
  getConfigPath,
  isNodeInstalled,
  isOpenClawInstalled,
  runCommand,
  refreshWindowsPath,
  NODE_VERSION,
  buildBaseConfig,
}
