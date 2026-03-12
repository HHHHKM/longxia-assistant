import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ElderMode() {
  const navigate = useNavigate()
  const [memberName, setMemberName] = useState('老人家')
  const [pressed, setPressed] = useState(null)

  useEffect(() => {
    try {
      const activeId = localStorage.getItem('longxia_family_active')
      const members = JSON.parse(localStorage.getItem('longxia_family') || '[]')
      const active = activeId ? members.find(m => String(m.id) === activeId) : null
      if (active && active.name) setMemberName(active.name)
    } catch {}
  }, [])

  function handlePress(key, action) {
    setPressed(key)
    setTimeout(() => {
      setPressed(null)
      action()
    }, 180)
  }

  const buttons = [
    {
      key: 'chat',
      emoji: '💬',
      label: '和助手说话',
      color: '#FF7043',
      bg: '#fff3ef',
      action: () => navigate('/chat'),
    },
    {
      key: 'medicine',
      emoji: '💊',
      label: '吃药提醒',
      color: '#43A047',
      bg: '#f1fff4',
      action: () => navigate('/care'),
    },
    {
      key: 'weather',
      emoji: '☀️',
      label: '今天天气',
      color: '#F9A825',
      bg: '#fffde7',
      action: () => {
        sessionStorage.setItem('longxia_chat_prefill', '今天天气怎么样')
        navigate('/chat')
      },
    },
    {
      key: 'family',
      emoji: '❤️',
      label: '给家人消息',
      color: '#E91E63',
      bg: '#fff0f5',
      action: () => navigate('/care'),
    },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff8f0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
      padding: 0,
    }}>
      {/* 顶部黄色提示条 */}
      <div style={{
        width: '100%',
        background: '#FFF176',
        color: '#5D4037',
        textAlign: 'center',
        padding: '14px 16px',
        fontSize: '1.15rem',
        fontWeight: 700,
        letterSpacing: '0.03em',
        boxSizing: 'border-box',
      }}>
        👆 点下面的大按钮就能用，不用学别的
      </div>

      {/* 问候语 */}
      <div style={{
        marginTop: 36,
        marginBottom: 8,
        fontSize: '2.5rem',
        fontWeight: 800,
        color: '#BF360C',
        textAlign: 'center',
        letterSpacing: '0.04em',
      }}>
        你好，{memberName}！
      </div>
      <div style={{
        fontSize: '1.1rem',
        color: '#8D6E63',
        marginBottom: 32,
      }}>
        今天想做什么？
      </div>

      {/* 2×2 按钮网格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 20,
        width: '100%',
        maxWidth: 560,
        padding: '0 20px',
        boxSizing: 'border-box',
      }}>
        {buttons.map(btn => (
          <button
            key={btn.key}
            onClick={() => handlePress(btn.key, btn.action)}
            style={{
              minHeight: 130,
              background: btn.bg,
              border: `3px solid ${btn.color}40`,
              borderRadius: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              cursor: 'pointer',
              boxShadow: pressed === btn.key
                ? `0 2px 8px ${btn.color}40`
                : `0 4px 16px ${btn.color}25`,
              transform: pressed === btn.key ? 'scale(1.07)' : 'scale(1)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              outline: 'none',
              padding: '20px 10px',
            }}
          >
            <span style={{ fontSize: '2.8rem', lineHeight: 1 }}>{btn.emoji}</span>
            <span style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: btn.color,
              textAlign: 'center',
              lineHeight: 1.3,
            }}>
              {btn.label}
            </span>
          </button>
        ))}
      </div>

      {/* 底部小字 */}
      <div style={{
        marginTop: 'auto',
        paddingTop: 40,
        paddingBottom: 24,
        fontSize: '1rem',
        color: '#BCAAA4',
        textAlign: 'center',
      }}>
        需要帮助？叫孩子来 👶
      </div>
    </div>
  )
}
