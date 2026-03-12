import React, { useState, useEffect, useRef, useCallback } from 'react'
import { sendChat } from '../api.js'

// 生成唯一 ID（不依赖第三方库）
let _msgId = 0
function nextId() { return ++_msgId }

// 格式化时间：HH:MM
function fmtTime(d) {
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// ── 家庭成员隔离 ──
function getActiveMemberId() {
  return localStorage.getItem('longxia_family_active') || 'default'
}
function getMemberChatKey() {
  return `longxia_saved_${getActiveMemberId()}`
}
function getMemberWelcomeText() {
  try {
    const members = JSON.parse(localStorage.getItem('longxia_family') || '[]')
    const active = members.find(m => String(m.id) === getActiveMemberId())
    const name = active?.name || '您'
    return `您好，${name}！我是🦞龙虾助手，很高兴为您服务！\n\n您可以用大白话问我任何问题，比如：\n• "帮我写一封请假信"\n• "今天天气好吗"\n• "给我讲个笑话"\n\n请直接在下方输入，然后点"发  送"按钮。`
  } catch {
    return '您好！我是🦞龙虾助手，很高兴为您服务！\n\n请直接在下方输入，然后点"发  送"按钮。'
  }
}
function makeWelcome() {
  return { id: 0, role: 'assistant', text: getMemberWelcomeText(), time: new Date() }
}

// ── 欢迎消息 ──
const WELCOME = makeWelcome()

// ── 打字动画组件（三个点跳动） ──
function ThinkingDots() {
  return (
    <span className="thinking-dots" aria-label="龙虾正在思考">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </span>
  )
}

// ── 单条消息气泡 ──
function MessageBubble({ msg, onSave, saved }) {
  const isUser  = msg.role === 'user'
  const isError = msg.role === 'error'
  const isBot   = msg.role === 'assistant' && !msg.thinking

  function handleCopy() {
    navigator.clipboard?.writeText(msg.text).catch(() => {})
  }

  return (
    <div className={`msg-row ${isUser ? 'msg-row--user' : 'msg-row--bot'}`}>
      {!isUser && <div className="msg-avatar">{isError ? '😴' : '🦞'}</div>}

      <div className="msg-col">
        <div className={`msg-bubble ${isUser ? 'msg-bubble--user' : isError ? 'msg-bubble--error' : 'msg-bubble--bot'}`}>
          {msg.thinking
            ? <><ThinkingDots /><span className="thinking-label">龙虾正在思考……</span></>
            : msg.text.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}{i < msg.text.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))
          }
        </div>

        {/* 操作栏：助手消息才显示 */}
        {isBot && (
          <div className="msg-actions">
            <button className="msg-action-btn" onClick={handleCopy} title="复制">📋 复制</button>
            <button
              className={`msg-action-btn ${saved ? 'msg-action-btn--saved' : ''}`}
              onClick={() => onSave(msg)}
              title={saved ? '已收藏' : '收藏这条回答'}
            >
              {saved ? '⭐ 已收藏' : '☆ 收藏'}
            </button>
          </div>
        )}

        {!msg.thinking && (
          <div className={`msg-time ${isUser ? 'msg-time--right' : ''}`}>{fmtTime(msg.time)}</div>
        )}
      </div>

      {isUser && <div className="msg-avatar msg-avatar--user">👤</div>}
    </div>
  )
}

// ── 对话页 ──
function Chat() {
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const [saved, setSaved]       = useState([])
  const [showSaved, setShowSaved] = useState(false)
  const [recording, setRecording] = useState(false)  // 语音录音中
  const [voiceSupported, setVoiceSupported] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  const recognitionRef = useRef(null)

  // 检测语音识别支持
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    setVoiceSupported(!!SR)
  }, [])

  // 加载收藏
  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem(getMemberChatKey()) || '[]')) } catch {}
  }, [])

  function handleSave(msg) {
    setSaved(prev => {
      const exists = prev.find(m => m.id === msg.id)
      const next = exists ? prev.filter(m => m.id !== msg.id) : [...prev, { ...msg, savedAt: new Date() }]
      localStorage.setItem(getMemberChatKey(), JSON.stringify(next))
      return next
    })
  }

  function isSaved(id) { return saved.some(m => m.id === id) }

  // 语音输入
  function handleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }

    const recognition = new SR()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart  = () => setRecording(true)
    recognition.onend    = () => setRecording(false)
    recognition.onerror  = () => setRecording(false)
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript
      setInput(prev => prev ? prev + text : text)
      inputRef.current?.focus()
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  function handleDeleteSaved(id) {
    setSaved(prev => {
      const next = prev.filter(m => m.id !== id)
      localStorage.setItem(getMemberChatKey(), JSON.stringify(next))
      return next
    })
  }

  // 读取 Skills 页传过来的试用提示词
  useEffect(() => {
    const prefill = sessionStorage.getItem('longxia_chat_prefill')
    if (prefill) {
      setInput(prefill)
      sessionStorage.removeItem('longxia_chat_prefill')
      inputRef.current?.focus()
    }
  }, [])

  // 每次消息更新，滚到最底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 发送消息
  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return

    // 清空输入框，立即显示用户消息
    setInput('')
    setSending(true)

    const userMsg = { id: nextId(), role: 'user', text, time: new Date() }
    // 占位"思考中"消息
    const thinkingId = nextId()
    const thinkingMsg = { id: thinkingId, role: 'assistant', text: '', thinking: true, time: new Date() }

    setMessages(prev => [...prev, userMsg, thinkingMsg])

    try {
      const data = await sendChat(text)
      const reply = data.reply ?? '（收到了空回复）'

      // 用真实回复替换思考占位
      setMessages(prev => prev.map(m =>
        m.id === thinkingId
          ? { ...m, text: reply, thinking: false, time: new Date() }
          : m
      ))
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === thinkingId
          ? {
              ...m,
              role: 'error',
              text: '龙虾暂时休息了 😴\n\n请先启动龙虾助手服务，然后再试一次。',
              thinking: false,
              time: new Date(),
            }
          : m
      ))
    } finally {
      setSending(false)
      // 发送后重新聚焦输入框
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, sending])

  // 按回车发送（Shift+回车换行）
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 清空对话
  function handleClear() {
    if (!window.confirm('确定要清空所有对话记录吗？')) return
    setMessages([WELCOME])
  }

  return (
    <div className="chat-page">
      {/* ── 顶部标题栏 ── */}
      <div className="chat-topbar">
        <div className="chat-topbar-info">
          <span className="chat-topbar-avatar">🦞</span>
          <div>
            <div className="chat-topbar-name">龙虾助手</div>
            <div className="chat-topbar-sub">有问题就问我</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.88rem', minHeight: 'auto' }}
            onClick={() => setShowSaved(true)}
            title="收藏箱"
          >
            ⭐ 收藏{saved.length > 0 ? `(${saved.length})` : ''}
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.88rem', minHeight: 'auto' }}
            onClick={handleClear}
            title="清空对话"
          >
            🗑 清空
          </button>
        </div>
      </div>

      {/* ── 消息列表 ── */}
      <div className="chat-messages">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} onSave={handleSave} saved={isSaved(msg.id)} />
        ))}
        {/* 滚动锚点 */}
        <div ref={bottomRef} style={{ height: 1 }} />
      </div>

      {/* ── 收藏箱 ── */}
      {showSaved && (
        <SavedDrawer
          saved={saved}
          onClose={() => setShowSaved(false)}
          onDelete={handleDeleteSaved}
          onReuse={text => { setInput(text); setShowSaved(false); inputRef.current?.focus() }}
        />
      )}

      {/* ── 输入区域 ── */}
      <div className="chat-input-area">
        <div className="chat-input-row">
          {/* 语音按钮 */}
          {voiceSupported && (
            <button
              className={`voice-btn ${recording ? 'voice-btn--active' : ''}`}
              onClick={handleVoice}
              title={recording ? '点击停止' : '点击说话'}
            >
              {recording ? '🔴' : '🎤'}
            </button>
          )}

          <textarea
            ref={inputRef}
            className="chat-textarea"
            placeholder={voiceSupported ? "输入文字或点🎤说话……（回车发送）" : "请在这里输入您想问的内容……（回车发送，Shift+回车换行）"}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            rows={2}
            maxLength={2000}
          />
          <button
            className="btn btn-primary chat-send-btn"
            onClick={handleSend}
            disabled={sending || !input.trim()}
            aria-label="发送消息"
          >
            {sending
              ? <><span className="spinner" style={{ width: 18, height: 18 }} /><span>发送中</span></>
              : <><span style={{ fontSize: '1.3rem' }}>📤</span><span>发  送</span></>
            }
          </button>
        </div>
        <div className="chat-input-hint">
          💡 提示：用大白话问就行，比如"帮我写封信"或"这个词是什么意思"
        </div>
      </div>
    </div>
  )
}

// ── 收藏箱弹层 ──
function SavedDrawer({ saved, onClose, onDelete, onReuse }) {
  return (
    <div className="saved-overlay" onClick={onClose}>
      <div className="saved-drawer" onClick={e => e.stopPropagation()}>
        <div className="saved-header">
          <span>⭐ 我的收藏（{saved.length}条）</span>
          <button className="saved-close" onClick={onClose}>✕</button>
        </div>
        {saved.length === 0 ? (
          <div className="saved-empty">还没有收藏，聊天时点"☆ 收藏"保存好答案</div>
        ) : (
          <div className="saved-list">
            {[...saved].reverse().map(msg => (
              <div key={msg.id} className="saved-item">
                <div className="saved-text">{msg.text.slice(0, 200)}{msg.text.length > 200 ? '…' : ''}</div>
                <div className="saved-item-actions">
                  <button className="saved-action-btn" onClick={() => { navigator.clipboard?.writeText(msg.text) }}>📋 复制</button>
                  <button className="saved-action-btn" onClick={() => onReuse(msg.text)}>🔄 再次使用</button>
                  <button className="saved-action-btn saved-action-btn--del" onClick={() => onDelete(msg.id)}>🗑 删除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat
