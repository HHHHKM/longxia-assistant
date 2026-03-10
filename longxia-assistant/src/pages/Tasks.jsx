import React, { useState, useEffect } from 'react'

// ── 自动任务模板（小白直接点，不用自己填 cron）──
const TASK_TEMPLATES = [
  {
    id: 'morning-news',
    emoji: '☀️',
    name: '每天早上看新闻',
    desc: '每天早上 8 点，自动给你发一份今日新闻摘要',
    cron: '0 8 * * *',
    cronLabel: '每天 08:00',
    category: '生活服务',
    popular: true,
  },
  {
    id: 'medicine-remind',
    emoji: '💊',
    name: '提醒吃药',
    desc: '每天定时提醒你或家人按时吃药，不会忘记',
    cron: '0 8,12,18 * * *',
    cronLabel: '每天 8、12、18 点',
    category: '生活服务',
    popular: true,
  },
  {
    id: 'weather-daily',
    emoji: '🌤️',
    name: '每天天气预报',
    desc: '每天早上告诉你今天的天气，要不要带伞',
    cron: '0 7 * * *',
    cronLabel: '每天 07:00',
    category: '生活服务',
    popular: true,
  },
  {
    id: 'stock-alert',
    emoji: '📈',
    name: '股票行情提醒',
    desc: '每天开盘后发给你关注的股票行情',
    cron: '30 9 * * 1-5',
    cronLabel: '工作日 09:30',
    category: '理财资讯',
    popular: false,
  },
  {
    id: 'work-summary',
    emoji: '📋',
    name: '每周工作总结',
    desc: '每周五下班前，帮你整理一周工作要点',
    cron: '0 17 * * 5',
    cronLabel: '每周五 17:00',
    category: '工作办公',
    popular: false,
  },
  {
    id: 'birthday-remind',
    emoji: '🎂',
    name: '生日提醒',
    desc: '提前提醒你家人和朋友的生日，不再漏掉',
    cron: '0 9 * * *',
    cronLabel: '每天 09:00 检查',
    category: '生活服务',
    popular: false,
  },
  {
    id: 'rent-remind',
    emoji: '🏠',
    name: '交房租/水电提醒',
    desc: '每月提醒你交房租、水电费，不会忘记',
    cron: '0 9 25 * *',
    cronLabel: '每月 25 号',
    category: '生活服务',
    popular: false,
  },
  {
    id: 'daily-digest',
    emoji: '📰',
    name: '每日信息汇总',
    desc: '每天晚上帮你整理当天重要信息，一条发给你',
    cron: '0 21 * * *',
    cronLabel: '每天 21:00',
    category: '工作办公',
    popular: true,
  },
]

const CATEGORIES = ['全部', '生活服务', '工作办公', '理财资讯']

export default function Tasks() {
  const [activeCategory, setActiveCategory] = useState('全部')
  const [myTasks, setMyTasks] = useState([]) // 已添加的任务
  const [addingId, setAddingId] = useState(null)
  const [removingId, setRemovingId] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // 从本地存储加载
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('longxia_tasks') || '[]')
      setMyTasks(saved)
    } catch { setMyTasks([]) }
  }, [])

  function saveMyTasks(tasks) {
    setMyTasks(tasks)
    localStorage.setItem('longxia_tasks', JSON.stringify(tasks))
  }

  // 添加任务
  async function handleAdd(template) {
    setAddingId(template.id)
    try {
      // 调用后端 API 创建 cron job
      if (window.electronAPI?.createTask) {
        await window.electronAPI.createTask({
          id: template.id,
          name: template.name,
          cron: template.cron,
        })
      }
      const updated = [...myTasks, template.id]
      saveMyTasks(updated)
      setSuccessMsg(`✅ 「${template.name}」已添加！`)
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch {
      setSuccessMsg(`⚠️ 添加失败，请检查服务是否正常运行`)
      setTimeout(() => setSuccessMsg(null), 3000)
    } finally {
      setAddingId(null)
    }
  }

  // 移除任务
  async function handleRemove(template) {
    setRemovingId(template.id)
    try {
      if (window.electronAPI?.removeTask) {
        await window.electronAPI.removeTask(template.id)
      }
      const updated = myTasks.filter(id => id !== template.id)
      saveMyTasks(updated)
      setSuccessMsg(`🗑️ 「${template.name}」已关闭`)
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch {
      setSuccessMsg(`⚠️ 操作失败，请重试`)
      setTimeout(() => setSuccessMsg(null), 3000)
    } finally {
      setRemovingId(null)
    }
  }

  const filtered = TASK_TEMPLATES.filter(t =>
    activeCategory === '全部' || t.category === activeCategory
  )
  const popular = TASK_TEMPLATES.filter(t => t.popular)
  const myTaskList = TASK_TEMPLATES.filter(t => myTasks.includes(t.id))

  return (
    <div className="tasks-page">
      <h1 className="page-title">⏰ 自动任务</h1>
      <p className="page-subtitle">
        选一个模板，龙虾助手会自动定时帮你做——不用学，一键开启
      </p>

      {/* 成功/失败提示 */}
      {successMsg && (
        <div className={`task-feedback ${successMsg.startsWith('✅') ? 'success' : 'warning'}`}>
          {successMsg}
        </div>
      )}

      {/* ── 我的任务 ── */}
      {myTaskList.length > 0 && (
        <div className="section">
          <h2 className="section-title">🟢 正在运行的任务</h2>
          <div className="task-grid">
            {myTaskList.map(t => (
              <TaskCard
                key={t.id}
                template={t}
                added={true}
                loading={removingId === t.id}
                onToggle={() => handleRemove(t)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 热门推荐 ── */}
      {myTaskList.length === 0 && (
        <div className="section">
          <h2 className="section-title">⭐ 热门推荐</h2>
          <div className="task-grid">
            {popular.map(t => (
              <TaskCard
                key={t.id}
                template={t}
                added={myTasks.includes(t.id)}
                loading={addingId === t.id}
                onToggle={() => myTasks.includes(t.id) ? handleRemove(t) : handleAdd(t)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 分类浏览 ── */}
      <div className="section">
        <h2 className="section-title">📂 全部模板</h2>

        {/* 分类标签 */}
        <div className="category-tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="task-grid">
          {filtered.map(t => (
            <TaskCard
              key={t.id}
              template={t}
              added={myTasks.includes(t.id)}
              loading={addingId === t.id || removingId === t.id}
              onToggle={() => myTasks.includes(t.id) ? handleRemove(t) : handleAdd(t)}
            />
          ))}
        </div>
      </div>

      {/* ── 底部提示 ── */}
      <div className="tasks-tip-box">
        <p>💡 <strong>提示：</strong>任务添加后，龙虾助手会在设定时间自动发消息给你。确保龙虾助手正在运行即可。</p>
      </div>
    </div>
  )
}

// ── 任务卡片 ──────────────────────────────────────────
function TaskCard({ template, added, loading, onToggle }) {
  return (
    <div className={`task-card ${added ? 'task-card--active' : ''}`}>
      <div className="task-emoji">{template.emoji}</div>
      <div className="task-info">
        <div className="task-name">{template.name}</div>
        <div className="task-desc">{template.desc}</div>
        <div className="task-time">🕐 {template.cronLabel}</div>
      </div>
      <button
        className={`task-toggle-btn ${added ? 'task-toggle-btn--on' : 'task-toggle-btn--off'}`}
        onClick={onToggle}
        disabled={loading}
      >
        {loading ? '⏳' : added ? '✅ 已开启' : '+ 开启'}
      </button>
    </div>
  )
}
