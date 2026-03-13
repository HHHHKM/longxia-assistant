import React from 'react'
import { useNavigate } from 'react-router-dom'

const CORE_ACTIONS = [
  { emoji: '💬', title: '开始聊天', desc: '直接问问题、聊日常、要建议', to: '/chat' },
  { emoji: '⏰', title: '今天提醒', desc: '查看和设置提醒、日程、周期任务', to: '/tasks' },
  { emoji: '👨‍👩‍👧', title: '家庭模式', desc: '帮父母配置，让家人直接使用', to: '/family' },
  { emoji: '❤️', title: '主动关怀', desc: '吃药、天气、问候、喝水提醒', to: '/care' },
  { emoji: '🧠', title: '我的记忆', desc: '告诉助手关于你的信息，让它更了解你', to: '/memory' },
]

const CASES = [
  { emoji: '👵', title: '老人场景', text: '大字体、大按钮、固定入口，不怕看不清，也不怕不会用。' },
  { emoji: '👨‍👩‍👧‍👦', title: '家庭场景', text: '子女先帮父母设置好，父母点头像就能开始用。' },
  { emoji: '✍️', title: '内容创作', text: '选题、脚本、提纲、口播文案，快速给你灵感。' },
  { emoji: '📅', title: '日常提醒', text: '吃药、买菜、交费、会议、生日，交给龙虾助手记。' },
]

export default function HomeHub() {
  const navigate = useNavigate()

  return (
    <div className="hub-page">
      <div className="hub-hero">
        <div className="hub-badge">🦞 中文 AI 管家</div>
        <h1 className="hub-title">让 AI 真正走进日常生活</h1>
        <p className="hub-subtitle">
          龙虾助手不只是会聊天，还能提醒、安排、关怀和帮你处理日常事务。
          给普通人、家庭用户和老人都能真正用起来的 AI 管家。
        </p>
      </div>

      <section className="hub-section">
        <h2 className="hub-section-title">几个最常用的功能</h2>
        <div className="hub-grid">
          {CORE_ACTIONS.map(item => (
            <button key={item.to} className="hub-card" onClick={() => navigate(item.to)}>
              <div className="hub-card-emoji">{item.emoji}</div>
              <div className="hub-card-title">{item.title}</div>
              <div className="hub-card-desc">{item.desc}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="hub-section">
        <h2 className="hub-section-title">它适合这些场景</h2>
        <div className="hub-case-grid">
          {CASES.map(item => (
            <div key={item.title} className="hub-case-card" onClick={() => navigate('/cases')} style={{ cursor: 'pointer' }}>
              <div className="hub-case-emoji">{item.emoji}</div>
              <div className="hub-case-title">{item.title}</div>
              <div className="hub-case-text">{item.text}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/cases')}>
            🌟 查看全部场景案例
          </button>
        </div>
      </section>

      <section className="hub-section">
        <h2 className="hub-section-title">建议你先这样开始</h2>
        <div className="hub-steps">
          <div className="hub-step"><span>1</span><div>先到「设置」填好 AI 服务商和专属口令</div></div>
          <div className="hub-step"><span>2</span><div>到「家庭模式」给父母或家人创建专属入口</div></div>
          <div className="hub-step"><span>3</span><div>到「自动任务」开启吃药提醒、天气提醒或每日待办</div></div>
        </div>
      </section>

      <section className="hub-section hub-download-section">
        <div className="hub-download-card">
          <div className="hub-download-icon">🦞</div>
          <div>
            <div className="hub-download-title">下载龙虾助手桌面版</div>
            <div className="hub-download-desc">支持 Windows / macOS / Linux，完全免费，无广告</div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/download')}>
            ⬇️ 下载龙虾助手
          </button>
        </div>
      </section>
    </div>
  )
}
