// 记忆管理工具
const MEMORY_KEY = 'longxia_memory'

export function getMemories() {
  try {
    return JSON.parse(localStorage.getItem(MEMORY_KEY) || '[]')
  } catch { return [] }
}

export function addMemory(content) {
  const memories = getMemories()
  const item = {
    id: Date.now(),
    content: content.trim(),
    createdAt: new Date().toISOString(),
  }
  memories.unshift(item)
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memories.slice(0, 50))) // 最多50条
  return item
}

export function deleteMemory(id) {
  const memories = getMemories().filter(m => m.id !== id)
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memories))
}

export function clearMemories() {
  localStorage.removeItem(MEMORY_KEY)
}

// 生成发送给 AI 的记忆上下文前缀
export function buildMemoryContext() {
  const memories = getMemories()
  if (memories.length === 0) return ''
  const lines = memories.map(m => `- ${m.content}`).join('\n')
  return `【关于我的信息】\n${lines}\n\n`
}

// 生成对话上下文（最近N条消息）
export function buildConversationContext(messages, limit = 6) {
  // 过滤掉欢迎消息（id=0）和思考中的消息
  const history = messages.filter(m => m.id > 0 && !m.thinking && m.role !== 'error')
  const recent = history.slice(-limit)
  if (recent.length === 0) return ''
  const lines = recent.map(m => {
    const role = m.role === 'user' ? '用户' : '助手'
    return `${role}：${m.text.slice(0, 200)}`
  }).join('\n')
  return `【最近对话记录】\n${lines}\n\n`
}
