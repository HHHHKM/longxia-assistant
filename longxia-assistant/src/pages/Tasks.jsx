import React, { useState, useEffect } from 'react'

// ── 自然语言时间选项 ──────────────────────────────────
const TIME_OPTIONS = [
  { label: '每天早上 7 点',   cron: '0 7 * * *',   id: 'daily-7' },
  { label: '每天早上 8 点',   cron: '0 8 * * *',   id: 'daily-8' },
  { label: '每天早上 9 点',   cron: '0 9 * * *',   id: 'daily-9' },
  { label: '每天中午 12 点',  cron: '0 12 * * *',  id: 'daily-12' },
  { label: '每天下午 6 点',   cron: '0 18 * * *',  id: 'daily-18' },
  { label: '每天晚上 8 点',   cron: '0 20 * * *',  id: 'daily-20' },
  { label: '每天晚上 9 点',   cron: '0 21 * * *',  id: 'daily-21' },
  { label: '工作日早上 9 点', cron: '0 9 * * 1-5', id: 'workday-9' },
  { label: '工作日下午 6 点', cron: '0 18 * * 1-5',id: 'workday-18' },
  { label: '每周一早上 9 点', cron: '0 9 * * 1',   id: 'weekly-mon' },
  { label: '每周五下午 5 点', cron: '0 17 * * 5',  id: 'weekly-fri' },
  { label: '每月 1 号早上',   cron: '0 9 1 * *',   id: 'monthly-1' },
  { label: '每月 25 号',      cron: '0 9 25 * *',  id: 'monthly-25' },
]

// ── 场景模板（中国高频场景）────────────────────────────
const TASK_TEMPLATES = [
  // 生活服务
  { id: 'morning-news',   emoji: '☀️', name: '每天早上看新闻',    desc: '每天早上自动发一份今日新闻摘要，了解天下事',      defaultTime: 'daily-8',    category: '生活服务', popular: true  },
  { id: 'medicine-remind',emoji: '💊', name: '提醒吃药',          desc: '定时提醒自己或家人按时吃药，不会忘记',            defaultTime: 'daily-8',    category: '生活服务', popular: true  },
  { id: 'weather-daily',  emoji: '🌤️', name: '每天天气预报',      desc: '每天早上告诉你今天天气，要不要带伞',              defaultTime: 'daily-7',    category: '生活服务', popular: true  },
  { id: 'care-push',      emoji: '❤️', name: '早安问候',          desc: '每天早上收到一句温暖问候，开启美好一天',          defaultTime: 'daily-8',    category: '生活服务', popular: false },
  { id: 'rent-remind',    emoji: '🏠', name: '交房租提醒',        desc: '每月提醒你交房租、水电费，不会漏掉',              defaultTime: 'monthly-25', category: '生活服务', popular: false },
  { id: 'birthday-remind',emoji: '🎂', name: '生日提醒',          desc: '每天早上检查今天有没有要记的生日',                defaultTime: 'daily-9',    category: '生活服务', popular: false },

  // 工作办公
  { id: 'daily-report',   emoji: '📋', name: '每日工作总结',      desc: '每天下班前，帮你整理今天工作要点，一键生成日报',  defaultTime: 'workday-18', category: '工作办公', popular: true  },
  { id: 'weekly-report',  emoji: '📊', name: '每周工作总结',      desc: '每周五自动整理本周工作亮点，生成周报初稿',        defaultTime: 'weekly-fri', category: '工作办公', popular: true  },
  { id: 'morning-todo',   emoji: '✅', name: '每日待办提醒',      desc: '每天早上整理今天要做的事，做好计划',              defaultTime: 'workday-9',  category: '工作办公', popular: true  },
  { id: 'meeting-remind', emoji: '📅', name: '会议提醒',          desc: '工作日早上提醒今天有哪些会议，提前准备',          defaultTime: 'workday-9',  category: '工作办公', popular: false },
  { id: 'monthly-report', emoji: '📈', name: '月度工作总结',      desc: '每月底自动生成月度工作总结初稿',                  defaultTime: 'monthly-25', category: '工作办公', popular: false },

  // 内容创作
  { id: 'xiaohongshu',    emoji: '📱', name: '小红书选题灵感',    desc: '每天推送3个小红书爆款选题方向，不再为没有内容发愁',defaultTime: 'daily-9',    category: '内容创作', popular: true  },
  { id: 'news-digest',    emoji: '📰', name: '行业资讯摘要',      desc: '每天汇总行业重要新闻，快速了解最新动态',          defaultTime: 'daily-8',    category: '内容创作', popular: true  },
  { id: 'copywriting',    emoji: '✍️', name: '每日文案灵感',      desc: '每天早上推送一条文案写作技巧和灵感',              defaultTime: 'daily-9',    category: '内容创作', popular: false },
  { id: 'douyin-script',  emoji: '🎬', name: '抖音脚本模板',      desc: '每周推送当下热门视频类型和脚本思路',              defaultTime: 'weekly-mon', category: '内容创作', popular: false },

  // 理财资讯
  { id: 'stock-alert',    emoji: '📈', name: '股市早报',          desc: '每天开盘前推送市场要点和今日关注',                defaultTime: 'workday-9',  category: '理财资讯', popular: true  },
  { id: 'finance-news',   emoji: '💹', name: '财经快讯',          desc: '每天整理最重要的财经新闻，快速掌握市场动向',      defaultTime: 'daily-8',    category: '理财资讯', popular: false },
  { id: 'fund-review',    emoji: '💰', name: '每周基金回顾',      desc: '每周一整理上周基金表现，帮你做好投资规划',        defaultTime: 'weekly-mon', category: '理财资讯', popular: false },

  // 健康生活
  { id: 'drink-water',    emoji: '💧', name: '定时喝水提醒',      desc: '每天定时提醒你喝水，保持健康好习惯',              defaultTime: 'daily-9',    category: '健康生活', popular: true  },
  { id: 'exercise-remind',emoji: '🏃', name: '运动提醒',          desc: '每天定时提醒你起身活动，告别久坐',                defaultTime: 'workday-18', category: '健康生活', popular: false },
  { id: 'health-tips',    emoji: '❤️', name: '每日健康小贴士',    desc: '每天推送一条健康生活小知识',                      defaultTime: 'daily-8',    category: '健康生活', popular: false },
]

const CATEGORIES = ['全部', '生活服务', '工作办公', '内容创作', '理财资讯', '健康生活']

// ── 自然语言时间选择器 ────────────────────────────────
function TimeSelector({ value, onChange }) {
  return (
    <div className="time-selector">
      <div className="time-selector-label">⏰ 什么时候执行？</div>
      <div className="time-selector-grid">
        {TIME_OPTIONS.map(opt => (
          <button
            key={opt.id}
            className={`time-option ${value === opt.id ? 'time-option--active' : ''}`}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── 主组件 ────────────────────────────────────────────
export default function Tasks() {
  const [activeCategory, setActiveCategory] = useState('全部')
  const [myTasks, setMyTasks]               = useState([])      // { id, timeId }
  const [addingId, setAddingId]             = useState(null)
  const [removingId, setRemovingId]         = useState(null)
  const [editingId, setEditingId]           = useState(null)    // 正在设置时间的任务id
  const [pendingTimeId, setPendingTimeId]   = useState(null)
  const [successMsg, setSuccessMsg]         = useState(null)

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

  function showMsg(text) {
    setSuccessMsg(text)
    setTimeout(() => setSuccessMsg(null), 3500)
  }

  // 点"开启" → 弹时间选择器
  function handleClickAdd(template) {
    setEditingId(template.id)
    setPendingTimeId(template.defaultTime)
  }

  // 确认添加
  async function handleConfirmAdd(template) {
    setAddingId(template.id)
    const timeOpt = TIME_OPTIONS.find(t => t.id === pendingTimeId) || TIME_OPTIONS[0]
    try {
      if (window.electronAPI?.createTask) {
        await window.electronAPI.createTask({ id: template.id, name: template.name, cron: timeOpt.cron })
      }
      saveMyTasks([...myTasks, { id: template.id, timeId: pendingTimeId }])
      showMsg(`✅ 「${template.name}」已开启！${timeOpt.label}自动执行`)
    } catch {
      showMsg('⚠️ 开启失败，请检查服务是否正常运行')
    } finally {
      setAddingId(null)
      setEditingId(null)
    }
  }

  // 关闭任务
  async function handleRemove(template) {
    setRemovingId(template.id)
    try {
      if (window.electronAPI?.removeTask) await window.electronAPI.removeTask(template.id)
      saveMyTasks(myTasks.filter(t => t.id !== template.id))
      showMsg(`🗑️ 「${template.name}」已关闭`)
    } catch {
      showMsg('⚠️ 操作失败，请重试')
    } finally {
      setRemovingId(null)
    }
  }

  function getMyTask(id) { return myTasks.find(t => t.id === id) }
  function isAdded(id) { return !!getMyTask(id) }
  function getTimeLabel(id) {
    const t = getMyTask(id)
    if (!t) return ''
    return TIME_OPTIONS.find(o => o.id === t.timeId)?.label || ''
  }

  const filtered = TASK_TEMPLATES.filter(t =>
    activeCategory === '全部' || t.category === activeCategory
  )
  const myTaskList = TASK_TEMPLATES.filter(t => isAdded(t.id))
  const popular    = TASK_TEMPLATES.filter(t => t.popular)

  return (
    <div className="tasks-page">
      <h1 className="page-title">⏰ 自动任务</h1>
      <p className="page-subtitle">选一个，设好时间，龙虾助手会自动帮你做——不用学，一键开启</p>

      {successMsg && (
        <div className={`task-feedback ${successMsg.startsWith('✅') ? 'success' : 'warning'}`}>
          {successMsg}
        </div>
      )}

      {/* ── 时间选择弹层 ── */}
      {editingId && (
        <div className="time-modal-overlay" onClick={() => setEditingId(null)}>
          <div className="time-modal" onClick={e => e.stopPropagation()}>
            <div className="time-modal-title">
              {TASK_TEMPLATES.find(t => t.id === editingId)?.emoji}{' '}
              {TASK_TEMPLATES.find(t => t.id === editingId)?.name}
            </div>
            <TimeSelector value={pendingTimeId} onChange={setPendingTimeId} />
            <div className="time-modal-btns">
              <button className="time-cancel-btn" onClick={() => setEditingId(null)}>取消</button>
              <button
                className="time-confirm-btn"
                disabled={addingId === editingId}
                onClick={() => handleConfirmAdd(TASK_TEMPLATES.find(t => t.id === editingId))}
              >
                {addingId === editingId ? '⏳ 开启中…' : '✅ 确认开启'}
              </button>
            </div>
          </div>
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
                timeLabel={getTimeLabel(t.id)}
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
                added={isAdded(t.id)}
                timeLabel={getTimeLabel(t.id)}
                loading={addingId === t.id}
                onToggle={() => isAdded(t.id) ? handleRemove(t) : handleClickAdd(t)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 分类浏览 ── */}
      <div className="section">
        <h2 className="section-title">📂 全部模板</h2>
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
              added={isAdded(t.id)}
              timeLabel={getTimeLabel(t.id)}
              loading={addingId === t.id || removingId === t.id}
              onToggle={() => isAdded(t.id) ? handleRemove(t) : handleClickAdd(t)}
            />
          ))}
        </div>
      </div>

      <div className="tasks-tip-box">
        <p>💡 <strong>提示：</strong>任务开启后，龙虾助手会在你设定的时间自动发消息给你。确保龙虾助手正在运行即可。</p>
      </div>
    </div>
  )
}

// ── 任务卡片 ──────────────────────────────────────────
function TaskCard({ template, added, timeLabel, loading, onToggle }) {
  return (
    <div className={`task-card ${added ? 'task-card--active' : ''}`}>
      <div className="task-emoji">{template.emoji}</div>
      <div className="task-info">
        <div className="task-name">{template.name}</div>
        <div className="task-desc">{template.desc}</div>
        {added && timeLabel
          ? <div className="task-time task-time--active">🟢 {timeLabel}</div>
          : <div className="task-time">📂 {template.category}</div>
        }
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
