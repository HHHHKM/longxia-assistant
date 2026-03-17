import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── AI 服务商数据 ──────────────────────────────────
const PROVIDERS = [
  {
    id: 'deepseek',
    emoji: '🐳',
    name: 'DeepSeek',
    tag: '推荐！最便宜',
    tagColor: '#E84545',
    desc: '国内可用，速度快，价格超便宜',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    signupUrl: 'https://platform.deepseek.com/',
    keyHint: '以 "sk-" 开头，大约 32 位字符',
    rechargeUrl: 'https://platform.deepseek.com/top_up',
    rechargeHint: '充 10 元可用很久，价格非常实惠',
  },
  {
    id: 'siliconflow',
    emoji: '🆓',
    name: '硅基流动',
    tag: '有免费额度',
    tagColor: '#2196F3',
    desc: '注册即有免费额度，适合体验',
    keyUrl: 'https://cloud.siliconflow.cn/account/ak',
    signupUrl: 'https://cloud.siliconflow.cn/',
    keyHint: '以 "sk-" 开头的字符串',
    rechargeUrl: 'https://cloud.siliconflow.cn/account/topup',
    rechargeHint: '注册后有免费额度，无需充值即可体验',
  },
  {
    id: 'qwen',
    emoji: '☁️',
    name: '通义千问',
    tag: '阿里出品',
    tagColor: '#FF6A00',
    desc: '阿里巴巴出品，稳定可靠',
    keyUrl: 'https://bailian.console.aliyun.com/',
    signupUrl: 'https://qianwen.aliyun.com/',
    keyHint: '在阿里云控制台的 API-KEY 管理页面获取',
    rechargeUrl: 'https://billing.console.aliyun.com/cost/recharge',
    rechargeHint: '需要在阿里云账号充值',
  },
  {
    id: 'openai',
    emoji: '🤖',
    name: 'OpenAI ChatGPT',
    tag: '国际版',
    tagColor: '#10A37F',
    desc: '最有名的 AI，需要科学上网',
    keyUrl: 'https://platform.openai.com/api-keys',
    signupUrl: 'https://platform.openai.com/',
    keyHint: '以 "sk-proj-" 或 "sk-" 开头的一串字符',
    rechargeUrl: 'https://platform.openai.com/account/billing',
    rechargeHint: '需要绑定国际信用卡充值',
  },
]


// ── 服务商 API 地址映射 ──────────────────────────────
const PROVIDER_BASE_URLS = {
  deepseek:    'https://api.deepseek.com/v1',
  siliconflow: 'https://api.siliconflow.cn/v1',
  qwen:        'https://dashscope.aliyuncs.com/compatible-mode/v1',
  openai:      'https://api.openai.com/v1',
}

// ── 测试 API 连接（带超时+友好错误） ────────────────────
async function testAPIConnection(provider, apiKey) {
  const baseUrl = PROVIDER_BASE_URLS[provider] || 'https://api.openai.com/v1'
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (res.status === 401 || res.status === 403) {
      return { ok: false, msg: '❌ 专属口令不对，请检查后重试' }
    }
    if (!res.ok) {
      return { ok: false, msg: `❌ 连接失败（${res.status}），请确认口令填写正确` }
    }
    return { ok: true, msg: '✅ 连接成功！口令验证通过' }
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      return { ok: false, msg: '⏱ 连接超时（10秒），请检查网络是否正常' }
    }
    return { ok: false, msg: '❌ 连接失败，请确认口令填写正确' }
  }
}

// ─── 渠道数据 ────────────────────────────────────────
const CHANNELS = [
  {
    id: 'telegram',
    emoji: '✈️',
    name: 'Telegram',
    tag: '最推荐',
    tagColor: '#2196F3',
    desc: '设置最简单，功能最完整',
    guide: '需要先在 Telegram 找到 @BotFather，创建一个机器人，获取 Bot Token',
    fields: [
      {
        key: 'botToken',
        label: 'Bot Token（机器人令牌）',
        placeholder: '例如：1234567890:AABBccdd-xxxxxxxxxxxxx',
        hint: '在 @BotFather 创建机器人后获得，格式如：数字:字母数字',
        type: 'password',
      },
    ],
    helpUrl: 'https://t.me/BotFather',
    helpText: '打开 @BotFather',
  },
  {
    id: 'feishu',
    emoji: '🐦',
    name: '飞书',
    tag: '企业推荐',
    tagColor: '#00B96B',
    desc: '适合公司、团队使用，支持企业微信平替',
    guide: '需要在飞书开放平台创建自建应用，获取 App ID 和 App Secret',
    fields: [
      {
        key: 'appId',
        label: 'App ID（应用 ID）',
        placeholder: '例如：cli_a1b2c3d4e5f6',
        hint: '在飞书开放平台 → 应用详情 → 凭证与基础信息 中获取',
        type: 'text',
      },
      {
        key: 'appSecret',
        label: 'App Secret（应用密钥）',
        placeholder: '32 位字母数字组合',
        hint: '与 App ID 在同一个页面获取',
        type: 'password',
      },
    ],
    helpUrl: 'https://open.feishu.cn/app',
    helpText: '去飞书开放平台',
    installPlugin: true,  // 需要安装插件
    pluginNote: '⚙️ 向导完成后会自动安装飞书插件',
  },
  {
    id: 'skip',
    emoji: '⏭️',
    name: '暂时跳过',
    tag: '之后再设',
    tagColor: '#9E9E9E',
    desc: '先跳过渠道设置，之后随时可以添加',
    guide: '',
    fields: [],
    helpUrl: null,
    helpText: null,
  },
  {
    id: 'dingtalk',
    emoji: '🔔',
    name: '钉钉',
    tag: '企业/家庭',
    tagColor: '#1677FF',
    desc: '适合企业用户和家庭群，国内使用广泛',
    guide: '需要在钉钉开放平台创建机器人，获取 Webhook 地址',
    fields: [
      {
        key: 'webhook',
        label: 'Webhook 地址',
        placeholder: '例如：https://oapi.dingtalk.com/robot/send?access_token=xxx',
        hint: '在钉钉群 → 群设置 → 机器人 → 添加机器人 → 自定义，复制 Webhook',
        type: 'password',
      },
    ],
    helpUrl: 'https://open.dingtalk.com/document/robots/custom-robot-access',
    helpText: '查看钉钉机器人配置指南',
    installPlugin: false,
  },
  {
    id: 'wechat',
    emoji: '💬',
    name: '微信',
    tag: '即将支持',
    tagColor: '#07C160',
    desc: '微信渠道正在开发中，敬请期待',
    disabled: true,
    disabledReason: '微信渠道正在开发中，即将上线。\n\n目前推荐替代方案：\n• Telegram（最推荐，设置最简单）\n• 飞书（企业用户推荐）\n• 钉钉（企业/家庭群）',
  },
  {
    id: 'skip',
    emoji: '⏭️',
    name: '暂时跳过',
    tag: '之后再设',
    tagColor: '#9E9E9E',
    desc: '先跳过渠道设置，之后随时可以添加',
    guide: '',
    fields: [],
    helpUrl: null,
    helpText: null,
  },
]

// ─── 步骤指示器 ──────────────────────────────────────
const STEP_LABELS = ['欢迎', '选AI', '填口令', '选渠道', '完成']

function StepIndicator({ current }) {
  const total = STEP_LABELS.length
  return (
    <div style={si.wrap}>
      {STEP_LABELS.map((label, i) => (
        <React.Fragment key={i}>
          <div style={si.item}>
            <div style={{
              ...si.circle,
              background: i < current ? '#4CAF50' : i === current ? '#E84545' : '#e0e0e0',
              color: i <= current ? '#fff' : '#aaa',
              transform: i === current ? 'scale(1.15)' : 'scale(1)',
              boxShadow: i === current ? '0 0 0 4px rgba(232,69,69,0.2)' : 'none',
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <div style={{
              ...si.label,
              color: i === current ? '#E84545' : i < current ? '#4CAF50' : '#bbb',
              fontWeight: i === current ? 700 : 400,
            }}>{label}</div>
          </div>
          {i < total - 1 && (
            <div style={{ ...si.line, background: i < current ? '#4CAF50' : '#e0e0e0' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

const si = {
  wrap: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 0,
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    minWidth: 52,
  },
  circle: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 700,
    transition: 'all 0.25s',
    flexShrink: 0,
  },
  label: {
    fontSize: 12,
    whiteSpace: 'nowrap',
    transition: 'color 0.25s',
  },
  line: {
    height: 3,
    flex: 1,
    borderRadius: 2,
    marginTop: 17,
    minWidth: 24,
    transition: 'background 0.25s',
  },
}

// ─── 主组件 ──────────────────────────────────────────
export default function Setup() {
  const navigate = useNavigate()

  // step: 0=欢迎 1=选AI 2=填APIKey 3=选渠道/填渠道信息 4=完成
  const [step, setStep] = useState(0)
  const [provider, setProvider] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [channel, setChannel] = useState(null)        // 当前选择的渠道 id
  const [channelFields, setChannelFields] = useState({}) // { botToken: '', appId: '', appSecret: '' }
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [qqAlert, setQqAlert] = useState(false)
  const [testResult, setTestResult] = useState(null)  // { ok, msg }
  const [testing, setTesting] = useState(false)

  const selectedProvider = PROVIDERS.find(p => p.id === provider)
  const selectedChannel = CHANNELS.find(c => c.id === channel)

  // ── 打开外部链接 ──────────────────────────────────
  function openUrl(url) {
    if (!url) return
    if (window.electronAPI) {
      window.electronAPI.openExternal(url)
    } else {
      window.open(url, '_blank')
    }
  }

  // ── 保存 AI 配置 ──────────────────────────────────
  async function handleSaveProvider() {
    if (!apiKey.trim()) { setError('请先填写您的专属口令'); return }
    setSaving(true); setError(''); setTestResult(null)
    // ── 先测试 API 连接 ──
    const test = await testAPIConnection(provider, apiKey.trim())
    if (!test.ok) {
      setError(test.msg)
      setSaving(false)
      return
    }
    setTestResult(test)
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.saveConfig(provider, apiKey.trim())
        if (!result.ok) throw new Error(result.error || '保存失败')
      } else {
        await fetch('http://localhost:18789/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, apiKey: apiKey.trim() }),
        })
      }
      setStep(3) // 进入渠道选择
    } catch (e) {
      setError(`保存失败：${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  // ── 保存渠道配置 ──────────────────────────────────
  async function handleSaveChannel() {
    if (!channel || channel === 'skip') {
      // 跳过渠道，直接完成
      setStep(4)
      return
    }

    const ch = selectedChannel
    if (!ch) { setStep(4); return }

    // 验证必填字段
    for (const f of ch.fields) {
      if (!channelFields[f.key]?.trim()) {
        setError(`请填写「${f.label}」`)
        return
      }
    }

    setSaving(true); setError('')
    try {
      if (window.electronAPI) {
        let result
        if (channel === 'telegram') {
          result = await window.electronAPI.saveConfig(
            provider, apiKey.trim(),
            channelFields.botToken
          )
        } else if (channel === 'feishu') {
          result = await window.electronAPI.saveConfigFull({
            provider,
            apiKey: apiKey.trim(),
            feishuAppId: channelFields.appId,
            feishuAppSecret: channelFields.appSecret,
          })
        } else {
          result = await window.electronAPI.saveConfig(provider, apiKey.trim())
        }
        if (result && !result.ok) throw new Error(result.error || '保存失败')
      }
      setStep(4)
    } catch (e) {
      setError(`保存渠道配置失败：${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  // ── 完成向导 ──────────────────────────────────────
  async function handleFinish() {
    setLoading(true)
    try {
      if (window.electronAPI) {
        console.log('[Setup] 调用 setupComplete...')
        await window.electronAPI.setupComplete()
        console.log('[Setup] setupComplete 完成')
      } else {
        navigate('/')
      }
    } catch (e) {
      console.error('[Setup] handleFinish 失败:', e)
      alert('启动失败：' + e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── 渠道字段更新 ─────────────────────────────────
  function setField(key, value) {
    setChannelFields(prev => ({ ...prev, [key]: value }))
  }

  // ─────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* ══════════════════════════════════════════
            步骤 0：欢迎
        ══════════════════════════════════════════ */}
        {step === 0 && (
          <div style={styles.center}>
            <div style={{ fontSize: 88, marginBottom: 16 }}>🦞</div>
            <h1 style={styles.bigTitle}>欢迎使用龙虾助手！</h1>
            <p style={styles.desc}>您的私人 AI 助理，从此随叫随到 🎉</p>

            <div style={styles.tipBox}>
              <TipItem>📋 接下来只需 <strong>4 步</strong>，约 <strong>5 分钟</strong>完成设置</TipItem>
              <TipItem>🤖 设置完成后，就可以用微信/飞书/Telegram 和 AI 聊天了</TipItem>
              <TipItem>🔒 所有信息只存在您自己的电脑上，非常安全</TipItem>
              <TipItem>⏩ 每步都可以返回修改，不用担心填错</TipItem>
            </div>

            <button style={styles.bigBtn} onClick={() => setStep(1)}>
              开始设置 →
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════
            步骤 1：选择 AI 服务商
        ══════════════════════════════════════════ */}
        {step === 1 && (
          <div>
            <StepIndicator current={1} />
            <h2 style={styles.stepTitle}>第 1 步：选择您要使用的 AI</h2>
            <p style={styles.stepSubtitle}>
              点击您想使用的 AI 服务。<strong>不确定就选"DeepSeek"</strong>，国内最快最便宜 👍
            </p>

            <div style={styles.providerGrid}>
              {PROVIDERS.map(p => (
                <div
                  key={p.id}
                  style={{
                    ...styles.providerCard,
                    border: provider === p.id
                      ? `3px solid ${p.tagColor}`
                      : '3px solid #e8e8e8',
                    background: provider === p.id ? '#fff8f8' : '#fff',
                    transform: provider === p.id ? 'scale(1.03)' : 'scale(1)',
                  }}
                  onClick={() => setProvider(p.id)}
                >
                  <div style={{ fontSize: 44, marginBottom: 10 }}>{p.emoji}</div>
                  <div style={styles.providerName}>{p.name}</div>
                  <div style={{ ...styles.tag, background: p.tagColor }}>{p.tag}</div>
                  <div style={styles.providerDesc}>{p.desc}</div>
                  {/* DeepSeek 额外充值说明 */}
                  {p.id === 'deepseek' && (
                    <div style={styles.rechargeTip}>💰 充 10 元可用很久</div>
                  )}
                  {p.id === 'siliconflow' && (
                    <div style={{ ...styles.rechargeTip, color: '#2196F3' }}>🎁 免费额度可体验</div>
                  )}
                  {provider === p.id && (
                    <div style={styles.checkMark}>✓ 已选择</div>
                  )}
                </div>
              ))}
            </div>

            <div style={styles.btnRow}>
              <button style={styles.secondaryBtn} onClick={() => setStep(0)}>← 上一步</button>
              <button
                style={{ ...styles.bigBtn, opacity: provider ? 1 : 0.4 }}
                disabled={!provider}
                onClick={() => setStep(2)}
              >
                下一步 →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            步骤 2：填写 API Key
        ══════════════════════════════════════════ */}
        {step === 2 && selectedProvider && (
          <div>
            <StepIndicator current={2} />
            <h2 style={styles.stepTitle}>第 2 步：填写您的专属口令</h2>
            <p style={styles.stepSubtitle}>
              {selectedProvider.emoji} <strong>{selectedProvider.name}</strong> 需要一个"专属口令"（API Key）才能使用
            </p>

            {/* DeepSeek 注册/充值引导 */}
            {(selectedProvider.id === 'deepseek' || selectedProvider.id === 'siliconflow') && (
              <div style={styles.guideBox}>
                <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, color: '#333' }}>
                  📖 还没有账号或口令？按以下步骤操作：
                </p>
                <div style={styles.guideStep}>
                  <span style={styles.guideNum}>1</span>
                  <span>
                    点击下方"帮我去注册"，在网页上注册账号（手机号注册即可）
                  </span>
                </div>
                <div style={styles.guideStep}>
                  <span style={styles.guideNum}>2</span>
                  <span>
                    注册后，点击"获取口令"，在 API Keys 页面创建一个新 Key
                  </span>
                </div>
                {selectedProvider.id === 'deepseek' && (
                  <div style={styles.guideStep}>
                    <span style={styles.guideNum}>3</span>
                    <span>
                      可以充值一点（10元即可），或直接用免费额度
                    </span>
                  </div>
                )}
                <div style={styles.guideStep}>
                  <span style={styles.guideNum}>{selectedProvider.id === 'deepseek' ? 4 : 3}</span>
                  <span>
                    复制口令，粘贴到下方输入框
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                  <button style={styles.helpBtn} onClick={() => openUrl(selectedProvider.signupUrl)}>
                    📝 帮我去注册
                  </button>
                  <button style={styles.helpBtn} onClick={() => openUrl(selectedProvider.keyUrl)}>
                    🔑 获取口令
                  </button>
                  {selectedProvider.rechargeUrl && selectedProvider.id === 'deepseek' && (
                    <button
                      style={{ ...styles.helpBtn, borderColor: '#FF9800', color: '#E65100' }}
                      onClick={() => openUrl(selectedProvider.rechargeUrl)}
                    >
                      💰 充值（可选）
                    </button>
                  )}
                </div>
              </div>
            )}

            <div style={styles.keyHintBox}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: '#555' }}>
                💡 您的口令长这样：
              </p>
              <code style={styles.codeStyle}>{selectedProvider.keyHint}</code>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={styles.inputLabel}>请把您的口令粘贴到下方：</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => { setApiKey(e.target.value); setError('') }}
                  placeholder={`粘贴您的 ${selectedProvider.name} 口令...`}
                  style={styles.bigInput}
                  autoFocus
                />
                <button
                  style={styles.eyeBtn}
                  onClick={() => setShowKey(!showKey)}
                  title={showKey ? '隐藏口令' : '显示口令'}
                >
                  {showKey ? '👁️' : '🙈'}
                </button>
              </div>
              {apiKey && (
                <p style={{ color: '#4CAF50', fontSize: 14, marginTop: 6 }}>
                  ✅ 已填写，长度：{apiKey.length} 个字符
                </p>
              )}
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}
            {testResult?.ok && (
              <div style={{ background: '#f1fff4', border: '1.5px solid #c8e6c9', borderRadius: 10, padding: '10px 16px', marginBottom: 12, color: '#2E7D32', fontWeight: 600 }}>
                {testResult.msg}
              </div>
            )}

            {/* 非 deepseek/siliconflow 的链接 */}
            {selectedProvider.id !== 'deepseek' && selectedProvider.id !== 'siliconflow' && (
              <div style={{ ...styles.btnRow, marginBottom: 16 }}>
                <button style={styles.helpBtn} onClick={() => openUrl(selectedProvider.keyUrl)}>
                  📖 怎么获取口令？
                </button>
                <button style={styles.helpBtn} onClick={() => openUrl(selectedProvider.signupUrl)}>
                  📝 帮我去注册
                </button>
              </div>
            )}

            <div style={{ ...styles.btnRow, marginTop: 20 }}>
              <button style={styles.secondaryBtn} onClick={() => setStep(1)}>← 上一步</button>
              <button
                style={{ ...styles.bigBtn, opacity: apiKey.trim() ? 1 : 0.4 }}
                disabled={!apiKey.trim() || saving}
                onClick={handleSaveProvider}
              >
                {saving ? '⏳ 正在验证口令...' : '验证并下一步 →'}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            步骤 3：选择聊天渠道
        ══════════════════════════════════════════ */}
        {step === 3 && (
          <div>
            <StepIndicator current={3} />
            <h2 style={styles.stepTitle}>第 3 步：选择聊天方式</h2>
            <p style={styles.stepSubtitle}>
              您想通过哪个平台和 AI 聊天？<strong>推荐 Telegram</strong>，设置最简单
            </p>

            {/* QQ 不支持弹窗 */}
            {qqAlert && (
              <div style={styles.qqAlertBox}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🐧</div>
                <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>QQ 暂时不支持</p>
                <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  {'OpenClaw 目前暂不支持 QQ 渠道。\n\n推荐替代方案：\n• Telegram（最推荐，设置最简单）\n• 飞书（企业用户推荐）'}
                </p>
                <button
                  style={{ ...styles.bigBtn, marginTop: 16, fontSize: 16, padding: '12px 32px' }}
                  onClick={() => setQqAlert(false)}
                >
                  我知道了
                </button>
              </div>
            )}

            {!qqAlert && (
              <>
                <div style={styles.channelGrid}>
                  {CHANNELS.map(ch => (
                    <div
                      key={ch.id}
                      style={{
                        ...styles.channelCard,
                        opacity: ch.disabled ? 0.45 : 1,
                        cursor: ch.disabled ? 'not-allowed' : 'pointer',
                        border: channel === ch.id && !ch.disabled
                          ? `3px solid ${ch.tagColor}`
                          : '3px solid #e8e8e8',
                        background: channel === ch.id && !ch.disabled ? '#f0f8ff' : '#fff',
                        transform: channel === ch.id && !ch.disabled ? 'scale(1.03)' : 'scale(1)',
                      }}
                      onClick={() => {
                        if (ch.disabled) {
                          setQqAlert(true)
                          return
                        }
                        setChannel(ch.id)
                        setChannelFields({})
                        setError('')
                      }}
                    >
                      <div style={{ fontSize: 36, marginBottom: 8 }}>{ch.emoji}</div>
                      <div style={styles.channelName}>{ch.name}</div>
                      <div style={{
                        ...styles.tag,
                        background: ch.disabled ? '#ccc' : ch.tagColor,
                        fontSize: 11,
                      }}>
                        {ch.tag}
                      </div>
                      <div style={styles.channelDesc}>{ch.desc}</div>
                      {channel === ch.id && !ch.disabled && (
                        <div style={styles.checkMark}>✓ 已选择</div>
                      )}
                      {ch.disabled && (
                        <div style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>点击查看说明</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* ─ 渠道填写表单 ─ */}
                {channel && channel !== 'skip' && selectedChannel && selectedChannel.fields.length > 0 && (
                  <div style={styles.channelFormBox}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 12 }}>
                      {selectedChannel.emoji} {selectedChannel.name} 配置
                    </h3>

                    {/* 说明文字 */}
                    {selectedChannel.guide && (
                      <div style={styles.guideBox}>
                        <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8 }}>
                          {selectedChannel.guide}
                        </p>
                        {selectedChannel.helpUrl && (
                          <button
                            style={{ ...styles.helpBtn, marginTop: 10 }}
                            onClick={() => openUrl(selectedChannel.helpUrl)}
                          >
                            🔗 {selectedChannel.helpText}
                          </button>
                        )}
                        {selectedChannel.installPlugin && (
                          <div style={{ marginTop: 10, padding: '8px 12px', background: '#e8f5e9', borderRadius: 8, fontSize: 13, color: '#388E3C' }}>
                            {selectedChannel.pluginNote}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 字段输入 */}
                    {selectedChannel.fields.map(field => (
                      <div key={field.key} style={{ marginBottom: 18 }}>
                        <label style={styles.inputLabel}>{field.label}</label>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type={field.type === 'password' && !showKey ? 'password' : 'text'}
                            value={channelFields[field.key] || ''}
                            onChange={e => { setField(field.key, e.target.value); setError('') }}
                            placeholder={field.placeholder}
                            style={styles.bigInput}
                          />
                          {field.type === 'password' && (
                            <button
                              style={styles.eyeBtn}
                              onClick={() => setShowKey(!showKey)}
                              title={showKey ? '隐藏' : '显示'}
                            >
                              {showKey ? '👁️' : '🙈'}
                            </button>
                          )}
                        </div>
                        {field.hint && (
                          <p style={{ color: '#888', fontSize: 13, marginTop: 5 }}>
                            💡 {field.hint}
                          </p>
                        )}
                        {channelFields[field.key]?.trim() && (
                          <p style={{ color: '#4CAF50', fontSize: 13, marginTop: 4 }}>
                            ✅ 已填写
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {error && <div style={styles.errorBox}>⚠️ {error}</div>}

                <div style={{ ...styles.btnRow, marginTop: 20 }}>
                  <button style={styles.secondaryBtn} onClick={() => { setStep(2); setChannel(null); setChannelFields({}) }}>
                    ← 上一步
                  </button>
                  <button
                    style={{ ...styles.bigBtn, opacity: channel ? 1 : 0.4 }}
                    disabled={!channel || saving}
                    onClick={handleSaveChannel}
                  >
                    {saving ? '⏳ 正在保存...' : channel === 'skip' ? '跳过，直接完成 →' : '完成设置 →'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            步骤 4：完成
        ══════════════════════════════════════════ */}
        {step === 4 && (
          <div style={styles.center}>
            <div style={{ fontSize: 88, marginBottom: 16 }}>🎉</div>
            <h1 style={styles.bigTitle}>设置完成！</h1>
            <p style={styles.desc}>龙虾助手已准备好，随时为您服务 🦞</p>

            <div style={{ ...styles.tipBox, background: '#f0fff4', border: '2px solid #4CAF50', textAlign: 'left' }}>
              <TipItem green>✅ AI 服务：已配置 <strong>{selectedProvider?.name || provider}</strong></TipItem>
              {channel && channel !== 'skip' && selectedChannel && (
                <TipItem green>✅ 聊天渠道：已配置 <strong>{selectedChannel.name}</strong></TipItem>
              )}
              {channel === 'skip' && (
                <TipItem green>⏭️ 聊天渠道：已跳过（之后可在"配置"页面添加）</TipItem>
              )}
              {channel === 'feishu' && (
                <TipItem green>🔌 飞书插件：将在后台自动安装</TipItem>
              )}
              <TipItem green>🦞 龙虾助手正在启动，请稍等片刻…</TipItem>
            </div>

            <button 
              style={{ ...styles.bigBtn, background: '#4CAF50', fontSize: 22, padding: '18px 56px' }} 
              onClick={handleFinish}
              disabled={loading}
            >
              {loading ? '⏳ 启动中...' : '🚀 开始使用！'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 小工具组件 ─────────────────────────────────────

function TipItem({ children, green }) {
  return (
    <p style={{
      fontSize: 17,
      color: green ? '#2E7D32' : '#444',
      marginBottom: 10,
      lineHeight: 1.7,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 6,
    }}>
      {children}
    </p>
  )
}

// ─── 样式对象 ────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
  },
  card: {
    background: '#fff',
    borderRadius: 28,
    padding: '44px 40px',
    maxWidth: 700,
    width: '100%',
    boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  bigTitle: {
    fontSize: 34,
    fontWeight: 900,
    color: '#1a1a1a',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  desc: {
    fontSize: 18,
    color: '#666',
    marginBottom: 28,
    lineHeight: 1.6,
  },
  tipBox: {
    background: '#fff8f0',
    border: '2px solid #ffcc80',
    borderRadius: 18,
    padding: '20px 24px',
    marginBottom: 32,
    width: '100%',
  },
  bigBtn: {
    background: '#E84545',
    color: '#fff',
    border: 'none',
    borderRadius: 50,
    padding: '17px 52px',
    fontSize: 20,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 18px rgba(232,69,69,0.35)',
    transition: 'transform 0.1s, box-shadow 0.1s',
    whiteSpace: 'nowrap',
  },
  secondaryBtn: {
    background: '#f5f5f5',
    color: '#666',
    border: '2px solid #ddd',
    borderRadius: 50,
    padding: '15px 32px',
    fontSize: 17,
    fontWeight: 600,
    cursor: 'pointer',
  },
  helpBtn: {
    background: '#f0f7ff',
    color: '#1565C0',
    border: '2px solid #90CAF9',
    borderRadius: 12,
    padding: '11px 18px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnRow: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: 800,
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 17,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 1.6,
  },
  providerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 14,
    marginBottom: 28,
  },
  providerCard: {
    borderRadius: 18,
    padding: '20px 14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative',
    textAlign: 'center',
  },
  providerName: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 6,
  },
  tag: {
    display: 'inline-block',
    borderRadius: 20,
    padding: '2px 10px',
    fontSize: 12,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 8,
  },
  providerDesc: {
    fontSize: 12,
    color: '#888',
    lineHeight: 1.5,
  },
  rechargeTip: {
    fontSize: 12,
    color: '#E84545',
    fontWeight: 600,
    marginTop: 6,
  },
  checkMark: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: 700,
    color: '#E84545',
  },
  channelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
    gap: 14,
    marginBottom: 24,
  },
  channelCard: {
    borderRadius: 18,
    padding: '18px 12px',
    transition: 'all 0.2s',
    position: 'relative',
    textAlign: 'center',
  },
  channelName: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 6,
  },
  channelDesc: {
    fontSize: 12,
    color: '#888',
    lineHeight: 1.5,
    marginTop: 6,
  },
  channelFormBox: {
    background: '#f9fafb',
    border: '2px solid #e0e0e0',
    borderRadius: 16,
    padding: '20px 24px',
    marginBottom: 16,
  },
  guideBox: {
    background: '#fffde7',
    border: '2px solid #ffe082',
    borderRadius: 14,
    padding: '16px 20px',
    marginBottom: 20,
  },
  guideStep: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
    fontSize: 15,
    color: '#444',
    lineHeight: 1.6,
  },
  guideNum: {
    background: '#E84545',
    color: '#fff',
    borderRadius: '50%',
    width: 24,
    height: 24,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
    marginTop: 2,
  },
  keyHintBox: {
    background: '#f5f5f5',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 20,
  },
  codeStyle: {
    display: 'block',
    fontSize: 15,
    color: '#E84545',
    fontFamily: 'monospace',
    marginTop: 6,
    wordBreak: 'break-all',
  },
  inputLabel: {
    display: 'block',
    fontSize: 17,
    fontWeight: 700,
    color: '#333',
    marginBottom: 10,
  },
  bigInput: {
    flex: 1,
    fontSize: 17,
    padding: '14px 18px',
    border: '2px solid #ddd',
    borderRadius: 12,
    outline: 'none',
    fontFamily: 'monospace',
    width: '100%',
  },
  eyeBtn: {
    fontSize: 22,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    flexShrink: 0,
  },
  errorBox: {
    background: '#fff0f0',
    border: '2px solid #ffcccc',
    borderRadius: 12,
    padding: '12px 16px',
    fontSize: 15,
    color: '#c62828',
    marginBottom: 16,
  },
  qqAlertBox: {
    background: '#f5f5f5',
    border: '2px solid #ddd',
    borderRadius: 18,
    padding: '28px 24px',
    textAlign: 'center',
    marginBottom: 20,
  },
}
