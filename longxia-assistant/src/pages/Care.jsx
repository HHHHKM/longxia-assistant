import React, { useState, useEffect } from 'react'

// ── 关怀推送模板 ──────────────────────────────────────
const CARE_TEMPLATES = [
  {
    id: 'morning-greet',
    emoji: '☀️',
    name: '早安问候',
    desc: '每天早上发一句温暖的问候，开启美好一天',
    example: '早上好！今天天气不错，记得多喝水，照顾好自己 🌞',
    timeId: 'daily-7',
    category: '日常关怀',
  },
  {
    id: 'evening-greet',
    emoji: '🌙',
    name: '晚安问候',
    desc: '每天晚上发一句温馨晚安，提醒按时休息',
    example: '晚安！今天辛苦了，早点休息，明天又是美好的一天 🌙',
    timeId: 'daily-21',
    category: '日常关怀',
  },
  {
    id: 'weather-care',
    emoji: '🌂',
    name: '天气关怀',
    desc: '天气变化时自动提醒，冷了加衣、雨天带伞',
    example: '今天降温了，记得多穿一件，注意保暖哦 🧥',
    timeId: 'daily-7',
    category: '健康提醒',
  },
  {
    id: 'medicine',
    emoji: '💊',
    name: '吃药提醒',
    desc: '定时提醒家人按时吃药，不再忘记',
    example: '该吃药啦！记得按时服药，身体是最重要的 💊',
    timeId: 'daily-8',
    category: '健康提醒',
  },
  {
    id: 'water',
    emoji: '💧',
    name: '喝水提醒',
    desc: '每隔几小时提醒喝水，保持健康好习惯',
    example: '该喝水了！多喝水对身体好，别忘记 💧',
    timeId: 'daily-10',
    category: '健康提醒',
  },
  {
    id: 'exercise',
    emoji: '🏃',
    name: '运动提醒',
    desc: '每天提醒起身活动，告别久坐',
    example: '久坐伤身，起来活动一下吧！走走路、做做操 🚶',
    timeId: 'daily-17',
    category: '健康提醒',
  },
  {
    id: 'birthday',
    emoji: '🎂',
    name: '生日祝福',
    desc: '家人生日时自动发出温馨祝福',
    example: '生日快乐！愿你健康平安，笑口常开 🎁🎂',
    timeId: 'daily-8',
    category: '节日关怀',
  },
  {
    id: 'holiday',
    emoji: '🎊',
    name: '节日问候',
    desc: '重要节假日自动发出节日祝福',
    example: '节日快乐！希望你和家人度过一个美好的节日 🎊',
    timeId: 'daily-9',
    category: '节日关怀',
  },
  {
    id: 'news-summary',
    emoji: '📰',
    name: '每日新闻摘要',
    desc: '每天推送一份简洁的新闻摘要，轻松了解天下事',
    example: '今日新闻摘要为您送达，3分钟了解今天发生了什么 📰',
    timeId: 'daily-8',
    category: '资讯推送',
  },
  {
    id: 'inspiration',
    emoji: '✨',
    name: '每日一句话',
    desc: '每天推送一句励志或温暖的话，给你一天的动力',
    example: '今天的一句话：生活不止眼前的苟且，还有诗和远方 ✨',
    timeId: 'daily-8',
    category: '资讯推送',
  },
]

const CATEGORIES = ['全部', '日常关怀', '健康提醒', '节日关怀', '资讯推送']

const TIME_OPTIONS = [
  { label: '每天早上 7 点', id: 'daily-7' },
  { label: '每天早上 8 点', id: 'daily-8' },
  { label: '每天早上 9 点', id: 'daily-9' },
  { label: '每天上午 10 点', id: 'daily-10' },
  { label: '每天中午 12 点', id: 'daily-12' },
  { label: '每天下午 5 点', id: 'daily-17' },
  { label: '每天晚上 8 点', id: 'daily-20' },
  { label: '每天晚上 9 点', id: 'daily-21' },
]

export default function Care() {
  const [activeCategory, setActiveCategory] = useState('全部')
  const [enabled, setEnabled]   = useState([])   // [{id, timeId, target}]
  const [editingId, setEditingId] = useState(null)
  const [pendingTime, setPendingTime] = useState(null)
  const [pendingTarget, setPendingTarget] = useState('自己')
  const [successMsg, setSuccessMsg] = useState(null)

  useEffect(() => {
    try { setEnabled(JSON.parse(localStorage.getItem('longxia_care') || '[]')) } catch {}
  }, [])

  function saveEnabled(list) {
    setEnabled(list)
    localStorage.setItem('longxia_care', JSON.stringify(list))
  }

  function isOn(id) { return enabled.some(e => e.id === id) }
  function getItem(id) { return enabled.find(e => e.id === id) }

  function handleToggle(t) {
    if (isOn(t.id)) {
      saveEnabled(enabled.filter(e => e.id !== t.id))
      setSuccessMsg(`🔕 「${t.name}」已关闭`)
    } else {
      setEditingId(t.id)
      setPendingTime(t.timeId)
      setPendingTarget('自己')
    }
    setTimeout(() => setSuccessMsg(null), 2500)
  }

  function handleConfirm() {
    const t = CARE_TEMPLATES.find(x => x.id === editingId)
    saveEnabled([...enabled, { id: editingId, timeId: pendingTime, target: pendingTarget }])
    setSuccessMsg(`✅ 「${t?.name}」已开启`)
    setEditingId(null)
    setTimeout(() => setSuccessMsg(null), 2500)
  }

  function getTimeLabel(timeId) {
    return TIME_OPTIONS.find(t => t.id === timeId)?.label || ''
  }

  const filtered = CARE_TEMPLATES.filter(t =>
    activeCategory === '全部' || t.category === activeCategory
  )
  const enabledList = CARE_TEMPLATES.filter(t => isOn(t.id))

  return (
    <div className="care-page">
      <h1 className="page-title">❤️ 主动关怀</h1>
      <p className="page-subtitle">
        龙虾助手主动给你发消息——不用等你来问，它会主动关心你
      </p>

      {successMsg && (
        <div className={`task-feedback ${successMsg.startsWith('✅') ? 'success' : 'warning'}`}>
          {successMsg}
        </div>
      )}

      {/* 时间弹层 */}
      {editingId && (
        <div className="time-modal-overlay" onClick={() => setEditingId(null)}>
          <div className="time-modal" onClick={e => e.stopPropagation()}>
            <div className="time-modal-title">
              {CARE_TEMPLATES.find(t => t.id === editingId)?.emoji}{' '}
              {CARE_TEMPLATES.find(t => t.id === editingId)?.name}
            </div>

            <div className="time-selector-label">⏰ 什么时候推送？</div>
            <div className="time-selector-grid">
              {TIME_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  className={`time-option ${pendingTime === opt.id ? 'time-option--active' : ''}`}
                  onClick={() => setPendingTime(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="time-selector-label" style={{ marginTop: 16 }}>👤 推送给谁？</div>
            <div className="time-selector-grid">
              {['自己', '爷爷', '奶奶', '爸爸', '妈妈', '全家'].map(name => (
                <button
                  key={name}
                  className={`time-option ${pendingTarget === name ? 'time-option--active' : ''}`}
                  onClick={() => setPendingTarget(name)}
                >
                  {name}
                </button>
              ))}
            </div>

            <div className="time-modal-btns">
              <button className="time-cancel-btn" onClick={() => setEditingId(null)}>取消</button>
              <button className="time-confirm-btn" onClick={handleConfirm}>✅ 确认开启</button>
            </div>
          </div>
        </div>
      )}

      {/* 已开启 */}
      {enabledList.length > 0 && (
        <div className="section">
          <h2 className="section-title">💚 正在关怀中</h2>
          <div className="care-grid">
            {enabledList.map(t => {
              const item = getItem(t.id)
              return (
                <div key={t.id} className="care-card care-card--active">
                  <div className="care-emoji">{t.emoji}</div>
                  <div className="care-info">
                    <div className="care-name">{t.name}</div>
                    <div className="care-meta">
                      🕐 {getTimeLabel(item?.timeId)} · 👤 {item?.target}
                    </div>
                    <div className="care-example">"{t.example}"</div>
                  </div>
                  <button className="care-off-btn" onClick={() => handleToggle(t)}>关闭</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 分类 */}
      <div className="section">
        <h2 className="section-title">📋 全部关怀模板</h2>
        <div className="category-tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >{cat}</button>
          ))}
        </div>
        <div className="care-grid">
          {filtered.map(t => (
            <div key={t.id} className={`care-card ${isOn(t.id) ? 'care-card--active' : ''}`}>
              <div className="care-emoji">{t.emoji}</div>
              <div className="care-info">
                <div className="care-name">{t.name}</div>
                <div className="care-desc">{t.desc}</div>
                <div className="care-example">"{t.example}"</div>
              </div>
              <button
                className={`care-toggle-btn ${isOn(t.id) ? 'care-toggle-btn--on' : 'care-toggle-btn--off'}`}
                onClick={() => handleToggle(t)}
              >
                {isOn(t.id) ? '✅ 已开启' : '+ 开启'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="tasks-tip-box">
        <p>💡 开启后龙虾助手会在设定时间主动给你发消息，让你感受到科技的温度。确保龙虾助手正在运行即可。</p>
      </div>
    </div>
  )
}
