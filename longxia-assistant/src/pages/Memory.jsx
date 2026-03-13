import React, { useState, useEffect } from 'react'
import { getMemories, addMemory, deleteMemory, clearMemories } from '../utils/memory.js'

export default function Memory() {
  const [memories, setMemories] = useState([])
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(null)

  useEffect(() => { setMemories(getMemories()) }, [])

  function showMsg(msg, type = 'success') {
    setFeedback({ msg, type })
    setTimeout(() => setFeedback(null), 3000)
  }

  function handleAdd() {
    const text = input.trim()
    if (!text) return
    addMemory(text)
    setMemories(getMemories())
    setInput('')
    showMsg('✅ 记忆已保存')
  }

  function handleDelete(id) {
    deleteMemory(id)
    setMemories(getMemories())
    showMsg('🗑️ 已删除', 'warn')
  }

  function handleClear() {
    clearMemories()
    setMemories([])
    showMsg('🗑️ 全部记忆已清空', 'warn')
  }

  function fmtDate(iso) {
    const d = new Date(iso)
    return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  return (
    <div className="page-padding" style={{ paddingBottom: 32 }}>
      <h1 className="page-title">🧠 记忆管理</h1>
      <p className="page-subtitle">告诉龙虾助手关于你的信息，它会在每次对话时记住这些</p>

      {feedback && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 16,
          fontSize: '0.82rem', fontWeight: 500,
          background: feedback.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          color: feedback.type === 'success' ? '#86efac' : '#fca5a5',
        }}>{feedback.msg}</div>
      )}

      {/* 新增记忆 */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#52525b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          添加新记忆
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="例如：我叫Ace，住在上海，喜欢喝咖啡"
            style={{
              flex: 1, background: '#18181b', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, color: '#fafafa', fontSize: '0.875rem',
              padding: '9px 13px', outline: 'none',
            }}
            maxLength={200}
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            style={{
              padding: '9px 16px', borderRadius: 8, border: 'none',
              background: input.trim() ? '#E84545' : 'rgba(232,69,69,0.2)',
              color: input.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
              fontWeight: 600, fontSize: '0.875rem', cursor: input.trim() ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
            }}
          >
            + 保存
          </button>
        </div>
        <div style={{ fontSize: '0.68rem', color: '#3f3f46', marginTop: 6 }}>
          💡 可以告诉助手你的名字、职业、习惯、偏好等，帮助它更了解你
        </div>
      </div>

      {/* 示例提示 */}
      {memories.length === 0 && (
        <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 16px', marginBottom: 24 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#a1a1aa', marginBottom: 12 }}>💡 可以告诉助手这些信息：</div>
          {[
            '我叫Ace，是一名产品经理',
            '我住在上海，喜欢早起',
            '我有一个女儿，5岁',
            '我不喜欢太复杂的解释，给我简短的答案',
            '帮我写文案时，风格要活泼有趣',
          ].map(ex => (
            <div
              key={ex}
              onClick={() => setInput(ex)}
              style={{
                padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
                fontSize: '0.8rem', color: '#71717a', marginBottom: 4,
                border: '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(232,69,69,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
            >
              {ex}
            </div>
          ))}
        </div>
      )}

      {/* 记忆列表 */}
      {memories.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#52525b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              已保存的记忆（{memories.length}/50）
            </div>
            <button onClick={handleClear} style={{
              fontSize: '0.72rem', color: '#71717a', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
              padding: '4px 10px', cursor: 'pointer',
            }}>
              清空全部
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {memories.map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 14px', background: '#18181b',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', color: '#fafafa', lineHeight: 1.5 }}>{m.content}</div>
                  <div style={{ fontSize: '0.65rem', color: '#3f3f46', marginTop: 4 }}>{fmtDate(m.createdAt)}</div>
                </div>
                <button onClick={() => handleDelete(m.id)} style={{
                  flexShrink: 0, background: 'transparent', border: 'none',
                  color: '#52525b', cursor: 'pointer', fontSize: '1rem',
                  padding: '2px 6px', borderRadius: 4,
                }}>🗑</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        marginTop: 28, padding: '14px 16px', background: '#18181b',
        border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10,
        fontSize: '0.78rem', color: '#71717a', lineHeight: 1.6,
      }}>
        💡 <strong>说明：</strong>记忆内容仅保存在本设备，最多保存50条。每次对话时，助手会自动参考这些信息来更好地理解你。
      </div>
    </div>
  )
}
