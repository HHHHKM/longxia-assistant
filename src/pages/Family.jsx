import React, { useState, useEffect } from 'react'

// ── 家庭成员颜色主题 ──────────────────────────────────
const THEMES = [
  { id: 'red',    label: '红色', bg: '#fff5f5', border: '#ffcdd2', accent: '#E84545' },
  { id: 'blue',   label: '蓝色', bg: '#f0f7ff', border: '#bbdefb', accent: '#1976D2' },
  { id: 'green',  label: '绿色', bg: '#f1fff4', border: '#c8e6c9', accent: '#388E3C' },
  { id: 'purple', label: '紫色', bg: '#f8f0ff', border: '#e1bee7', accent: '#7B1FA2' },
  { id: 'orange', label: '橙色', bg: '#fff8f0', border: '#ffe0b2', accent: '#E65100' },
  { id: 'teal',   label: '青色', bg: '#f0fffe', border: '#b2dfdb', accent: '#00695C' },
]

// ── 预设角色 ─────────────────────────────────────────
const PRESET_ROLES = [
  { emoji: '👴', name: '爷爷', fontSize: 'large', simpleMode: true  },
  { emoji: '👵', name: '奶奶', fontSize: 'large', simpleMode: true  },
  { emoji: '👨', name: '爸爸', fontSize: 'normal', simpleMode: false },
  { emoji: '👩', name: '妈妈', fontSize: 'normal', simpleMode: false },
  { emoji: '🧒', name: '孩子', fontSize: 'normal', simpleMode: false },
  { emoji: '👤', name: '自定义', fontSize: 'normal', simpleMode: false },
]

// ── 空成员模板 ────────────────────────────────────────
function newMember(id) {
  return {
    id,
    emoji: '👤',
    name: '',
    themeId: 'red',
    fontSize: 'normal',   // normal | large
    simpleMode: false,     // 极简模式（老人）
    greeting: '',          // 自定义问候语
  }
}

export default function Family() {
  const [members, setMembers]     = useState([])
  const [editing, setEditing]     = useState(null)   // 正在编辑的成员 id
  const [activeId, setActiveId]   = useState(null)   // 当前激活的成员
  const [showAdd, setShowAdd]     = useState(false)
  const [form, setForm]           = useState(null)
  const [saved, setSaved]         = useState(false)

  // 加载
  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('longxia_family') || '[]')
      setMembers(data)
      const active = localStorage.getItem('longxia_family_active')
      if (active) setActiveId(active)
    } catch { setMembers([]) }
  }, [])

  function saveMembers(list) {
    setMembers(list)
    localStorage.setItem('longxia_family', JSON.stringify(list))
  }

  function handleAddOpen() {
    setForm(newMember(Date.now()))
    setShowAdd(true)
  }

  function handleEditOpen(member) {
    setForm({ ...member })
    setEditing(member.id)
    setShowAdd(true)
  }

  function handleSaveForm() {
    if (!form.name.trim()) return
    if (editing) {
      saveMembers(members.map(m => m.id === editing ? { ...form } : m))
      setEditing(null)
    } else {
      saveMembers([...members, { ...form }])
    }
    setShowAdd(false)
    setForm(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleDelete(id) {
    if (!window.confirm('确定要删除这个成员吗？')) return
    saveMembers(members.filter(m => m.id !== id))
    if (activeId === String(id)) {
      setActiveId(null)
      localStorage.removeItem('longxia_family_active')
    }
  }

  function handleActivate(id) {
    const sid = String(id)
    setActiveId(sid)
    localStorage.setItem('longxia_family_active', sid)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function updateForm(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  const currentTheme = (id) => THEMES.find(t => t.id === id) || THEMES[0]

  return (
    <div className="family-page">
      <h1 className="page-title">👨‍👩‍👧 家庭模式</h1>
      <p className="page-subtitle">
        为家人创建专属账号，子女帮父母配置好，父母直接选自己的头像就能用
      </p>

      {saved && (
        <div className="family-feedback">✅ 已保存</div>
      )}

      {/* ── 成员列表 ── */}
      {members.length > 0 && (
        <div className="family-members">
          {members.map(m => {
            const theme = currentTheme(m.themeId)
            const isActive = String(m.id) === activeId
            return (
              <div
                key={m.id}
                className={`family-member-card ${isActive ? 'family-member-card--active' : ''}`}
                style={{
                  background: theme.bg,
                  borderColor: isActive ? theme.accent : theme.border,
                  boxShadow: isActive ? `0 4px 20px ${theme.accent}30` : undefined,
                }}
              >
                {isActive && (
                  <div className="family-active-badge" style={{ background: theme.accent }}>
                    当前使用中
                  </div>
                )}
                <div className="family-member-emoji">{m.emoji}</div>
                <div className="family-member-name" style={{ fontSize: m.fontSize === 'large' ? '1.15rem' : '1rem' }}>
                  {m.name}
                </div>
                {m.simpleMode && (
                  <div className="family-simple-badge">老人模式</div>
                )}
                {m.greeting && (
                  <div className="family-greeting">"{m.greeting}"</div>
                )}
                <div className="family-card-actions">
                  <button
                    className="family-use-btn"
                    style={{ background: theme.accent }}
                    onClick={() => handleActivate(m.id)}
                  >
                    {isActive ? '✓ 使用中' : '切换到我'}
                  </button>
                  <button className="family-edit-btn" onClick={() => handleEditOpen(m)}>编辑</button>
                  <button className="family-del-btn" onClick={() => handleDelete(m.id)}>删除</button>
                </div>
              </div>
            )
          })}

          {/* 添加新成员 */}
          <div className="family-add-card" onClick={handleAddOpen}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>＋</div>
            <div style={{ fontSize: '0.95rem', color: '#999', fontWeight: 600 }}>添加家庭成员</div>
          </div>
        </div>
      )}

      {/* ── 空状态 ── */}
      {members.length === 0 && !showAdd && (
        <div className="family-empty">
          <div className="family-empty-emoji">👨‍👩‍👧‍👦</div>
          <div className="family-empty-title">还没有家庭成员</div>
          <div className="family-empty-desc">
            为每位家人创建专属账号<br/>
            他们只需要点自己的头像就能开始使用
          </div>
          <button className="family-empty-btn" onClick={handleAddOpen}>
            ＋ 添加第一位家庭成员
          </button>
        </div>
      )}

      {/* ── 添加/编辑弹层 ── */}
      {showAdd && form && (
        <div className="family-modal-overlay" onClick={() => { setShowAdd(false); setEditing(null) }}>
          <div className="family-modal" onClick={e => e.stopPropagation()}>
            <div className="family-modal-title">
              {editing ? '编辑成员' : '添加家庭成员'}
            </div>

            {/* 预设角色快选 */}
            <div className="family-form-label">选择角色</div>
            <div className="family-preset-grid">
              {PRESET_ROLES.map(p => (
                <button
                  key={p.name}
                  className={`family-preset-btn ${form.emoji === p.emoji && form.name === p.name ? 'active' : ''}`}
                  onClick={() => setForm(prev => ({
                    ...prev,
                    emoji: p.emoji,
                    name: p.name === '自定义' ? prev.name : p.name,
                    fontSize: p.fontSize,
                    simpleMode: p.simpleMode,
                  }))}
                >
                  <span>{p.emoji}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>

            {/* 名字 */}
            <div className="family-form-label">叫什么名字？</div>
            <input
              className="family-input"
              placeholder="例如：爷爷、妈妈、小明…"
              value={form.name}
              onChange={e => updateForm('name', e.target.value)}
              maxLength={10}
            />

            {/* 主题颜色 */}
            <div className="family-form-label">选一个颜色</div>
            <div className="family-theme-grid">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  className={`family-theme-btn ${form.themeId === t.id ? 'active' : ''}`}
                  style={{
                    background: t.bg,
                    border: `3px solid ${form.themeId === t.id ? t.accent : t.border}`,
                    color: t.accent,
                  }}
                  onClick={() => updateForm('themeId', t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* 老人模式开关 */}
            <div className="family-switch-row">
              <div>
                <div className="family-switch-label">老人模式</div>
                <div className="family-switch-desc">大字体、大按钮、操作更简单</div>
              </div>
              <button
                className={`family-toggle ${form.simpleMode ? 'family-toggle--on' : ''}`}
                onClick={() => updateForm('simpleMode', !form.simpleMode)}
              >
                {form.simpleMode ? '开启' : '关闭'}
              </button>
            </div>

            {/* 问候语 */}
            <div className="family-form-label">问候语（可选）</div>
            <input
              className="family-input"
              placeholder="例如：爷爷您好，有什么需要帮忙的吗？"
              value={form.greeting}
              onChange={e => updateForm('greeting', e.target.value)}
              maxLength={40}
            />

            <div className="family-modal-btns">
              <button className="family-cancel-btn" onClick={() => { setShowAdd(false); setEditing(null) }}>取消</button>
              <button
                className="family-save-btn"
                disabled={!form.name.trim()}
                onClick={handleSaveForm}
              >
                ✓ 保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 使用说明 ── */}
      {members.length > 0 && (
        <div className="family-tip">
          <p>💡 <strong>使用方法：</strong>点击家人的头像卡片上的"切换到我"，龙虾助手就会用对应的设置和问候语为他们服务。老人模式开启后字体和按钮会更大。</p>
        </div>
      )}
    </div>
  )
}
