// Token 统计工具
// 估算方式：中文字符 * 1.5，英文单词 * 1.3，其余 * 1

export function estimateTokens(text) {
  if (!text) return 0
  let count = 0
  for (const ch of text) {
    if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(ch)) count += 1.5
    else if (/\s/.test(ch)) count += 0
    else count += 0.7
  }
  // 加单词数估算
  const words = text.match(/[a-zA-Z]+/g) || []
  count += words.length * 0.3
  return Math.ceil(count)
}

// 服务商单价（每1000 token，人民币）
const PRICE_PER_1K = {
  deepseek: 0.014,      // deepseek-chat 输入价
  siliconflow: 0.02,
  qwen: 0.008,
  openai: 0.15,
  anthropic: 0.18,
  openrouter: 0.1,
  default: 0.05,
}

export function estimateCost(tokens, provider = 'default') {
  const price = PRICE_PER_1K[provider] ?? PRICE_PER_1K.default
  return ((tokens / 1000) * price).toFixed(4)
}

// 获取今日日期key
function todayKey() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}
function monthKey() {
  return new Date().toISOString().slice(0, 7) // YYYY-MM
}

// 记录一次对话的 token 消耗
export function recordTokenUsage(inputText, outputText, provider = 'default') {
  const inputTokens = estimateTokens(inputText)
  const outputTokens = estimateTokens(outputText)
  const total = inputTokens + outputTokens

  // 今日统计
  const dayKey = `longxia_tokens_day_${todayKey()}`
  const dayData = JSON.parse(localStorage.getItem(dayKey) || '{"tokens":0,"messages":0,"cost":0}')
  dayData.tokens += total
  dayData.messages += 1
  dayData.cost = parseFloat((parseFloat(dayData.cost) + parseFloat(estimateCost(total, provider))).toFixed(4))
  localStorage.setItem(dayKey, JSON.stringify(dayData))

  // 本月统计
  const monKey = `longxia_tokens_month_${monthKey()}`
  const monData = JSON.parse(localStorage.getItem(monKey) || '{"tokens":0,"messages":0,"cost":0}')
  monData.tokens += total
  monData.messages += 1
  monData.cost = parseFloat((parseFloat(monData.cost) + parseFloat(estimateCost(total, provider))).toFixed(4))
  localStorage.setItem(monKey, JSON.stringify(monData))

  return { inputTokens, outputTokens, total }
}

// 读取今日统计
export function getTodayStats() {
  const dayKey = `longxia_tokens_day_${todayKey()}`
  return JSON.parse(localStorage.getItem(dayKey) || '{"tokens":0,"messages":0,"cost":0}')
}

// 读取本月统计
export function getMonthStats() {
  const monKey = `longxia_tokens_month_${monthKey()}`
  return JSON.parse(localStorage.getItem(monKey) || '{"tokens":0,"messages":0,"cost":0}')
}

// 读取最近7天的每日统计
export function getLast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const data = JSON.parse(localStorage.getItem(`longxia_tokens_day_${key}`) || '{"tokens":0,"messages":0,"cost":0}')
    days.push({ date: key, label: `${d.getMonth()+1}/${d.getDate()}`, ...data })
  }
  return days
}
