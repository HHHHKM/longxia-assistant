import React from 'react'
import { useNavigate } from 'react-router-dom'

const CASES = [
  {
    id: 'elder',
    icon: '👵',
    title: '老人也能用的 AI 助手',
    desc: '不用学复杂操作，字大、按钮大、操作少',
    story:
      '王奶奶，72岁，子女帮她开启了"吃药提醒"和"早安问候"。现在每天早上8点，龙虾助手会发消息提醒她吃药，还会说一句"早上好，王奶奶！今天天气不错，记得多喝水"。她说：不用学什么，就是等它发消息来就行。',
    entries: [
      { label: '→ 主动关怀', to: '/care' },
      { label: '→ 家庭模式', to: '/family' },
    ],
    color: '#ff9800',
    bg: 'linear-gradient(135deg, #fff8e1, #fff3cd)',
    border: '#ffe082',
  },
  {
    id: 'family',
    icon: '👨‍👩‍👧‍👦',
    title: '子女设置，父母直接用',
    desc: '一次配置，全家受益',
    story:
      '小李在北京工作，父母在老家。他用了半小时帮父母配置好龙虾助手，开启了天气提醒、吃药提醒、早安问候。现在父母每天都能收到贴心提醒，他也放心多了。',
    entries: [
      { label: '→ 家庭模式', to: '/family' },
      { label: '→ 主动关怀', to: '/care' },
    ],
    color: '#1976D2',
    bg: 'linear-gradient(135deg, #e3f2fd, #d0e8fd)',
    border: '#90caf9',
  },
  {
    id: 'creator',
    icon: '✍️',
    title: '内容创作者的灵感助手',
    desc: '从选题到成稿，全程辅助',
    story:
      '小红书博主小周，每天打开龙虾助手问"今天适合发什么内容"，然后直接让它帮写标题、文案。每周五自动生成本周内容总结，下周选题也一目了然。',
    entries: [
      { label: '→ 自动任务（小红书选题）', to: '/tasks' },
      { label: '→ 开始聊天', to: '/chat' },
    ],
    color: '#7B1FA2',
    bg: 'linear-gradient(135deg, #f8f0ff, #ede3f8)',
    border: '#ce93d8',
  },
  {
    id: 'reminder',
    icon: '📅',
    title: '交给龙虾助手记着',
    desc: '再也不漏掉重要的事',
    story:
      '上班族小陈，同时要记住吃药、每周报告、交房租、家人生日。现在全部设置成自动任务，每次到时间龙虾助手就会发消息提醒，再也没漏过一件事。',
    entries: [
      { label: '→ 自动任务', to: '/tasks' },
      { label: '→ 主动关怀', to: '/care' },
    ],
    color: '#388E3C',
    bg: 'linear-gradient(135deg, #f1fff4, #e0f7e0)',
    border: '#a5d6a7',
  },
]

export default function Cases() {
  const navigate = useNavigate()

  return (
    <div className="cases-page">
      <h1 className="page-title">🌟 使用场景案例</h1>
      <p className="page-subtitle cases-subtitle">
        真实场景，真实用法，看看龙虾助手能怎么帮你和家人
      </p>

      <div className="cases-grid">
        {CASES.map(c => (
          <div
            key={c.id}
            className="cases-card"
            style={{
              background: c.bg,
              borderColor: c.border,
            }}
          >
            {/* 左侧：图标 + 标题 */}
            <div className="cases-card-header">
              <div className="cases-icon">{c.icon}</div>
              <div>
                <div className="cases-title" style={{ color: c.color }}>{c.title}</div>
                <div className="cases-desc">{c.desc}</div>
              </div>
            </div>

            {/* 故事正文 */}
            <div className="cases-story">
              <span className="cases-quote">❝</span>
              {c.story}
            </div>

            {/* 底部：功能入口 + 体验按钮 */}
            <div className="cases-footer">
              <div className="cases-entries">
                {c.entries.map(e => (
                  <button
                    key={e.to}
                    className="cases-entry-btn"
                    style={{ borderColor: c.color, color: c.color }}
                    onClick={() => navigate(e.to)}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
              <button
                className="cases-try-btn"
                style={{ background: c.color }}
                onClick={() => navigate(c.entries[0].to)}
              >
                立即体验 →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
