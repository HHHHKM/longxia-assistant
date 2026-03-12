import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { installSkill, uninstallSkill, getInstalledSkills } from '../api.js'

// ── 技能市场数据 ──────────────────────────────────────
const SKILL_MARKET = [
  // 生活服务
  {
    id: 'weather',
    name: '天气查询',
    emoji: '🌤️',
    category: '生活服务',
    author: '龙虾官方',
    version: '1.0.0',
    desc: '查询全国任意城市天气，支持今日天气、未来7天预报、生活建议（要不要带伞等）',
    example: '今天北京天气怎么样？',
    tags: ['天气', '生活', '出行'],
    builtin: true,
    popular: true,
    rating: 4.9,
    installs: 12800,
  },
  {
    id: 'reminder',
    name: '智能提醒',
    emoji: '⏰',
    category: '生活服务',
    author: '龙虾官方',
    version: '1.2.0',
    desc: '自然语言设置提醒，支持"明天早上8点提醒我开会"这样的表达，自动转为定时任务',
    example: '明天早上8点提醒我吃药',
    tags: ['提醒', '日程', '定时'],
    builtin: true,
    popular: true,
    rating: 4.8,
    installs: 9600,
  },
  {
    id: 'news',
    name: '每日新闻',
    emoji: '📰',
    category: '生活服务',
    author: '龙虾官方',
    version: '1.0.0',
    desc: '每天推送国内外重要新闻摘要，3分钟了解天下事，支持分类订阅（科技/财经/社会）',
    example: '今天有什么重要新闻？',
    tags: ['新闻', '资讯', '每日'],
    builtin: true,
    popular: false,
    rating: 4.6,
    installs: 5400,
  },
  {
    id: 'translate',
    name: '多语言翻译',
    emoji: '🌐',
    category: '生活服务',
    author: '龙虾官方',
    version: '2.0.0',
    desc: '支持100+语言互译，中英日韩法德等，保持原文语气和格式，支持长文翻译',
    example: '把这段话翻译成英文：你好，很高兴认识你',
    tags: ['翻译', '语言', '英语'],
    builtin: true,
    popular: true,
    rating: 4.9,
    installs: 18200,
  },
  // 工作办公
  {
    id: 'writing',
    name: '文章写作',
    emoji: '✍️',
    category: '工作办公',
    author: '龙虾官方',
    version: '1.5.0',
    desc: '帮你写工作汇报、新闻稿、文章、方案等，提供大纲或全文，支持多种风格',
    example: '帮我写一篇关于年终总结的工作报告',
    tags: ['写作', '文档', '报告'],
    builtin: true,
    popular: true,
    rating: 4.7,
    installs: 11300,
  },
  {
    id: 'summary',
    name: '智能总结',
    emoji: '📋',
    category: '工作办公',
    author: '龙虾官方',
    version: '1.0.0',
    desc: '粘贴任意长文，自动提炼核心要点，生成结构化摘要，支持会议记录整理',
    example: '帮我总结这篇文章的要点：[粘贴内容]',
    tags: ['总结', '摘要', '会议'],
    builtin: true,
    popular: false,
    rating: 4.8,
    installs: 7800,
  },
  {
    id: 'email',
    name: '邮件助手',
    emoji: '📧',
    category: '工作办公',
    author: '龙虾官方',
    version: '1.1.0',
    desc: '起草商务邮件、回复邮件、调整邮件语气（正式/友好），支持中英文邮件',
    example: '帮我写一封申请年假的邮件',
    tags: ['邮件', '商务', '写作'],
    builtin: true,
    popular: false,
    rating: 4.5,
    installs: 4200,
  },
  {
    id: 'ppt',
    name: 'PPT 大纲',
    emoji: '📊',
    category: '工作办公',
    author: '龙虾官方',
    version: '1.0.0',
    desc: '根据主题生成完整PPT大纲，包含章节结构、关键要点、演讲建议',
    example: '帮我生成一个"2026年市场战略"的PPT大纲',
    tags: ['PPT', '演示', '大纲'],
    builtin: true,
    popular: false,
    rating: 4.4,
    installs: 3100,
  },
  // 内容创作
  {
    id: 'xiaohongshu',
    name: '小红书助手',
    emoji: '📱',
    category: '内容创作',
    author: '龙虾官方',
    version: '1.3.0',
    desc: '生成小红书风格标题、正文、标签，分析爆款内容结构，提供选题灵感，一键生成完整帖子',
    example: '帮我写一篇关于周末咖啡馆打卡的小红书',
    tags: ['小红书', '内容', '营销'],
    builtin: false,
    popular: true,
    rating: 4.9,
    installs: 23400,
  },
  {
    id: 'douyin',
    name: '抖音脚本',
    emoji: '🎬',
    category: '内容创作',
    author: '龙虾官方',
    version: '1.0.0',
    desc: '生成短视频脚本、口播文案、分镜建议，分析热门视频结构，帮你做爆款内容',
    example: '帮我写一个60秒的美食探店视频脚本',
    tags: ['抖音', '视频', '脚本'],
    builtin: false,
    popular: true,
    rating: 4.7,
    installs: 15600,
  },
  {
    id: 'copywriting',
    name: '文案创作',
    emoji: '💡',
    category: '内容创作',
    author: '龙虾官方',
    version: '1.2.0',
    desc: '产品文案、广告语、朋友圈文案、活动宣传语，多种风格任选，快速生成可用文案',
    example: '给我的奶茶店写5条朋友圈文案',
    tags: ['文案', '广告', '营销'],
    builtin: false,
    popular: false,
    rating: 4.6,
    installs: 8900,
  },
  // 创作娱乐
  {
    id: 'story',
    name: '故事创作',
    emoji: '📖',
    category: '创作娱乐',
    author: '龙虾官方',
    version: '1.0.0',
    desc: '生成睡前故事、短篇小说、童话故事，可指定风格、人物、场景，适合亲子互动',
    example: '给我讲一个关于小龙虾学飞翔的故事',
    tags: ['故事', '创意', '亲子'],
    builtin: true,
    popular: false,
    rating: 4.7,
    installs: 6200,
  },
  {
    id: 'poem',
    name: '诗词对联',
    emoji: '🎵',
    category: '创作娱乐',
    author: '龙虾官方',
    version: '1.0.0',
    desc: '春节对联、生日祝福诗、藏头诗、现代诗、古风诗词，节日必备神器',
    example: '帮我写一首以"龙"字开头的藏头诗',
    tags: ['诗词', '对联', '节日'],
    builtin: true,
    popular: false,
    rating: 4.6,
    installs: 4800,
  },
  // 学习教育
  {
    id: 'english',
    name: '英语辅导',
    emoji: '🇬🇧',
    category: '学习教育',
    author: '龙虾官方',
    version: '1.4.0',
    desc: '英语作文批改、语法讲解、单词辨析、口语练习对话，支持各年级英语学习需求',
    example: '帮我批改这篇英语作文：[作文内容]',
    tags: ['英语', '学习', '教育'],
    builtin: true,
    popular: true,
    rating: 4.8,
    installs: 14500,
  },
  {
    id: 'code',
    name: '编程辅助',
    emoji: '💻',
    category: '学习教育',
    author: '龙虾官方',
    version: '2.0.0',
    desc: '写代码、找 Bug、解释代码逻辑、代码审查，支持 Python/JS/Java/C++ 等主流语言',
    example: '帮我用Python写一个读取Excel并生成图表的脚本',
    tags: ['编程', '代码', '开发'],
    builtin: true,
    popular: true,
    rating: 4.9,
    installs: 19800,
  },
  // 健康生活
  {
    id: 'recipe',
    name: '美食菜谱',
    emoji: '🍜',
    category: '健康生活',
    author: '龙虾官方',
    version: '1.1.0',
    desc: '根据已有食材推荐菜谱，生成详细做法步骤，支持饮食限制（素食/低卡/糖尿病等）',
    example: '我有土豆、鸡蛋、西红柿，能做什么菜？',
    tags: ['菜谱', '美食', '健康'],
    builtin: true,
    popular: false,
    rating: 4.7,
    installs: 8300,
  },
  {
    id: 'fitness',
    name: '运动健身',
    emoji: '🏃',
    category: '健康生活',
    author: '龙虾官方',
    version: '1.0.0',
    desc: '制定个人运动计划，居家/健身房训练动作指导，记录运动数据，健身建议',
    example: '我想减肥，帮我制定一个每天30分钟的居家运动计划',
    tags: ['健身', '运动', '减肥'],
    builtin: false,
    popular: false,
    rating: 4.5,
    installs: 5100,
  },
]

const ALL_CATEGORIES = ['全部', '生活服务', '工作办公', '内容创作', '创作娱乐', '学习教育', '健康生活']

export default function Skills() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('market')          // 'market' | 'installed'
  const [category, setCategory] = useState('全部')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)         // 技能详情弹层
  const [installed, setInstalled] = useState([])     // 已安装技能 id 列表
  const [installing, setInstalling] = useState(null) // 正在安装的 id
  const [feedback, setFeedback] = useState(null)

  // 初始化：读取已安装技能
  useEffect(() => {
    async function load() {
      // 优先读取本地缓存
      try {
        const cached = JSON.parse(localStorage.getItem('longxia_installed_skills') || '[]')
        if (cached.length > 0) { setInstalled(cached); return }
      } catch {}
      // 尝试从 Gateway API 获取
      try {
        const data = await getInstalledSkills()
        const ids = (data?.skills || data || []).map(s => s.id || s)
        setInstalled(ids)
        localStorage.setItem('longxia_installed_skills', JSON.stringify(ids))
      } catch {
        // 降级：内置技能默认已安装
        const builtins = SKILL_MARKET.filter(s => s.builtin).map(s => s.id)
        setInstalled(builtins)
        localStorage.setItem('longxia_installed_skills', JSON.stringify(builtins))
      }
    }
    load()
  }, [])

  function isInstalled(id) { return installed.includes(id) }

  function showMsg(text, type = 'success') {
    setFeedback({ text, type })
    setTimeout(() => setFeedback(null), 3000)
  }

  async function handleInstall(skill) {
    if (isInstalled(skill.id)) return
    setInstalling(skill.id)
    try {
      await installSkill(skill.id)
      setInstalled(prev => {
        const next = [...prev, skill.id]
        localStorage.setItem('longxia_installed_skills', JSON.stringify(next))
        return next
      })
      showMsg(`✅ 「${skill.name}」安装成功！`)
    } catch {
      // 降级：本地记录
      setInstalled(prev => {
        const next = [...prev, skill.id]
        localStorage.setItem('longxia_installed_skills', JSON.stringify(next))
        return next
      })
      showMsg(`✅ 「${skill.name}」已添加到功能列表`)
    } finally {
      setInstalling(null)
    }
  }

  async function handleUninstall(skill) {
    if (skill.builtin) {
      showMsg('⚠️ 内置功能无法卸载', 'warning')
      return
    }
    setInstalling(skill.id)
    try {
      await uninstallSkill(skill.id)
      setInstalled(prev => {
        const next = prev.filter(id => id !== skill.id)
        localStorage.setItem('longxia_installed_skills', JSON.stringify(next))
        return next
      })
      showMsg(`🗑️ 「${skill.name}」已卸载`)
    } catch {
      setInstalled(prev => {
        const next = prev.filter(id => id !== skill.id)
        localStorage.setItem('longxia_installed_skills', JSON.stringify(next))
        return next
      })
      showMsg(`🗑️ 「${skill.name}」已移除`)
    } finally {
      setInstalling(null)
    }
  }

  function handleTry(skill) {
    // 跳转聊天页并传递示例提示词（通过 sessionStorage）
    sessionStorage.setItem('longxia_chat_prefill', skill.example)
    navigate('/chat')
  }

  // 过滤技能列表
  const filtered = SKILL_MARKET.filter(s => {
    const matchCat = category === '全部' || s.category === category
    const matchSearch = !search ||
      s.name.includes(search) ||
      s.desc.includes(search) ||
      s.tags.some(t => t.includes(search))
    return matchCat && matchSearch
  })

  const installedSkills = SKILL_MARKET.filter(s => isInstalled(s.id))
  const popular = SKILL_MARKET.filter(s => s.popular)

  return (
    <div className="skills-page">
      {/* ── 顶部标题 ── */}
      <div className="skills-header">
        <h1 className="page-title">🧩 功能中心</h1>
        <p className="page-subtitle">安装和管理龙虾助手的各种功能技能</p>
      </div>

      {/* ── 反馈消息 ── */}
      {feedback && (
        <div className={`task-feedback ${feedback.type === 'success' ? 'success' : 'warning'}`}
          style={{ margin: '0 0 16px' }}>
          {feedback.text}
        </div>
      )}

      {/* ── Tab 切换 ── */}
      <div className="skills-tabs">
        <button
          className={`skills-tab ${tab === 'market' ? 'skills-tab--active' : ''}`}
          onClick={() => setTab('market')}
        >
          🛒 技能市场
          <span className="skills-tab-count">{SKILL_MARKET.length}</span>
        </button>
        <button
          className={`skills-tab ${tab === 'installed' ? 'skills-tab--active' : ''}`}
          onClick={() => setTab('installed')}
        >
          ✅ 已安装
          <span className="skills-tab-count">{installedSkills.length}</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════
          技能市场
      ═══════════════════════════════════════ */}
      {tab === 'market' && (
        <div>
          {/* 搜索框 */}
          <div className="skills-search-row">
            <input
              className="skills-search"
              placeholder="🔍 搜索功能，例如：天气、写作、翻译…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* 分类筛选 */}
          <div className="skills-cats">
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`skills-cat-btn ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 热门推荐（无搜索无分类时显示） */}
          {!search && category === '全部' && (
            <div className="section">
              <div className="section-title">⭐ 热门推荐</div>
              <div className="skills-grid">
                {popular.map(skill => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    installed={isInstalled(skill.id)}
                    loading={installing === skill.id}
                    onInstall={() => handleInstall(skill)}
                    onUninstall={() => handleUninstall(skill)}
                    onDetail={() => setDetail(skill)}
                    onTry={() => handleTry(skill)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 全部/筛选结果 */}
          <div className="section">
            <div className="section-title">
              {search ? `搜索结果（${filtered.length}）` : category === '全部' ? '📦 全部功能' : `${category}（${filtered.length}）`}
            </div>
            {filtered.length === 0 ? (
              <div className="skills-empty">
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>没有找到相关功能</div>
              </div>
            ) : (
              <div className="skills-grid">
                {filtered.map(skill => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    installed={isInstalled(skill.id)}
                    loading={installing === skill.id}
                    onInstall={() => handleInstall(skill)}
                    onUninstall={() => handleUninstall(skill)}
                    onDetail={() => setDetail(skill)}
                    onTry={() => handleTry(skill)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          已安装管理
      ═══════════════════════════════════════ */}
      {tab === 'installed' && (
        <div>
          {installedSkills.length === 0 ? (
            <div className="skills-empty">
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>📦</div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>还没有安装功能</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>
                去技能市场安装你需要的功能
              </div>
              <button className="btn btn-primary" onClick={() => setTab('market')}>
                去技能市场
              </button>
            </div>
          ) : (
            <div className="installed-list">
              {installedSkills.map(skill => (
                <div key={skill.id} className="installed-item">
                  <div className="installed-item-left">
                    <span className="installed-emoji">{skill.emoji}</span>
                    <div className="installed-info">
                      <div className="installed-name">
                        {skill.name}
                        {skill.builtin && (
                          <span className="badge badge-gray" style={{ marginLeft: 8, fontSize: '0.7rem' }}>内置</span>
                        )}
                      </div>
                      <div className="installed-desc">{skill.desc.slice(0, 50)}…</div>
                      <div className="installed-meta">
                        v{skill.version} · {skill.author} · ⭐ {skill.rating}
                      </div>
                    </div>
                  </div>
                  <div className="installed-actions">
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                      onClick={() => handleTry(skill)}
                    >
                      🚀 试用
                    </button>
                    <button
                      className="btn"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.82rem',
                        background: skill.builtin ? 'var(--bg-tertiary)' : '#fff0f0',
                        color: skill.builtin ? 'var(--text-muted)' : '#c0392b',
                        border: skill.builtin ? '1px solid var(--border-light)' : '1px solid #ffcccc',
                        cursor: skill.builtin ? 'not-allowed' : 'pointer',
                      }}
                      disabled={skill.builtin || installing === skill.id}
                      onClick={() => handleUninstall(skill)}
                      title={skill.builtin ? '内置功能无法卸载' : '卸载'}
                    >
                      {installing === skill.id ? '⏳' : skill.builtin ? '🔒 内置' : '🗑 卸载'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════
          技能详情弹层
      ═══════════════════════════════════════ */}
      {detail && (
        <div className="skill-detail-overlay" onClick={() => setDetail(null)}>
          <div className="skill-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="skill-detail-close" onClick={() => setDetail(null)}>✕</button>

            <div className="skill-detail-header">
              <span className="skill-detail-emoji">{detail.emoji}</span>
              <div>
                <div className="skill-detail-name">{detail.name}</div>
                <div className="skill-detail-meta">
                  v{detail.version} · {detail.author} · ⭐ {detail.rating} · {detail.installs.toLocaleString()} 次安装
                </div>
              </div>
            </div>

            <div className="skill-detail-tags">
              {detail.tags.map(tag => (
                <span key={tag} className="badge badge-gray">#{tag}</span>
              ))}
              <span className={`badge ${isInstalled(detail.id) ? 'badge-green' : 'badge-red'}`}>
                {isInstalled(detail.id) ? '✓ 已安装' : '未安装'}
              </span>
            </div>

            <p className="skill-detail-desc">{detail.desc}</p>

            <div className="skill-detail-example">
              <div className="skill-detail-example-label">💬 示例提问</div>
              <div className="skill-detail-example-text">「{detail.example}」</div>
            </div>

            <div className="skill-detail-btns">
              {isInstalled(detail.id) ? (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={() => { setDetail(null); handleTry(detail) }}
                  >
                    🚀 立即试用
                  </button>
                  {!detail.builtin && (
                    <button
                      className="btn btn-secondary"
                      style={{ color: '#c0392b' }}
                      onClick={() => { handleUninstall(detail); setDetail(null) }}
                    >
                      🗑 卸载
                    </button>
                  )}
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  disabled={installing === detail.id}
                  onClick={() => handleInstall(detail)}
                >
                  {installing === detail.id ? '⏳ 安装中…' : '⬇ 安装功能'}
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setDetail(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 技能卡片组件 ──────────────────────────────────────
function SkillCard({ skill, installed, loading, onInstall, onUninstall, onDetail, onTry }) {
  return (
    <div className={`skill-card ${installed ? 'skill-card--installed' : ''}`}>
      <div className="skill-card-top" onClick={onDetail}>
        <div className="skill-card-emoji">{skill.emoji}</div>
        <div className="skill-card-info">
          <div className="skill-card-name">{skill.name}</div>
          <div className="skill-card-category">{skill.category}</div>
        </div>
        {installed && <div className="skill-installed-dot">✓</div>}
      </div>

      <div className="skill-card-desc" onClick={onDetail}>{skill.desc.slice(0, 60)}…</div>

      <div className="skill-card-stats">
        <span>⭐ {skill.rating}</span>
        <span>·</span>
        <span>{(skill.installs / 1000).toFixed(1)}k</span>
        <span>·</span>
        <span>v{skill.version}</span>
      </div>

      <div className="skill-card-actions">
        <button
          className="btn btn-secondary"
          style={{ flex: 1, padding: '7px 0', fontSize: '0.82rem' }}
          onClick={onTry}
        >
          试用
        </button>
        {installed ? (
          <button
            className="btn"
            style={{
              flex: 1, padding: '7px 0', fontSize: '0.82rem',
              background: skill.builtin ? 'var(--bg-tertiary)' : '#fff0f0',
              color: skill.builtin ? 'var(--text-muted)' : '#c0392b',
              border: skill.builtin ? '1px solid var(--border-light)' : '1px solid #ffcccc',
              cursor: skill.builtin ? 'not-allowed' : 'pointer',
            }}
            disabled={skill.builtin || loading}
            onClick={onUninstall}
          >
            {loading ? '⏳' : skill.builtin ? '内置' : '卸载'}
          </button>
        ) : (
          <button
            className="btn btn-primary"
            style={{ flex: 1, padding: '7px 0', fontSize: '0.82rem' }}
            disabled={loading}
            onClick={onInstall}
          >
            {loading ? '⏳' : '安装'}
          </button>
        )}
      </div>
    </div>
  )
}
