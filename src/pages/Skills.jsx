import React, { useState } from 'react'

// ── 场景化功能分类（不再是 skill 名，而是用途）──
const CATEGORIES = [
  {
    id: 'life',
    emoji: '🏠',
    name: '生活服务',
    desc: '天气、提醒、健康、出行',
    features: [
      { id: 'weather', emoji: '🌤️', name: '查天气', desc: '问今天天气、要不要带伞、未来几天天气', builtin: true },
      { id: 'remind', emoji: '⏰', name: '定时提醒', desc: '设置吃药、喝水、开会等提醒', builtin: true },
      { id: 'news', emoji: '📰', name: '看新闻', desc: '每天自动发送最新新闻摘要', builtin: true },
      { id: 'translate', emoji: '🌐', name: '翻译', desc: '中英文互译，支持各种语言', builtin: true },
    ]
  },
  {
    id: 'work',
    emoji: '💼',
    name: '工作办公',
    desc: '写作、总结、邮件、报告',
    features: [
      { id: 'writing', emoji: '✍️', name: '写文章/报告', desc: '帮你写工作汇报、新闻稿、文章', builtin: true },
      { id: 'summary', emoji: '📋', name: '一键总结', desc: '粘贴长文，自动提炼要点', builtin: true },
      { id: 'email', emoji: '📧', name: '写邮件', desc: '帮你起草专业邮件，修改语气', builtin: true },
      { id: 'ppt', emoji: '📊', name: 'PPT 大纲', desc: '输入主题，生成演示文稿大纲', builtin: true },
    ]
  },
  {
    id: 'finance',
    emoji: '💰',
    name: '理财资讯',
    desc: '股票、基金、财经新闻',
    features: [
      { id: 'stock', emoji: '📈', name: '股票行情', desc: '查询股票价格和每日行情', builtin: false, comingSoon: false },
      { id: 'fund', emoji: '💹', name: '基金净值', desc: '查询基金净值和涨跌情况', builtin: false, comingSoon: true },
      { id: 'finance-news', emoji: '📉', name: '财经快讯', desc: '每日财经要闻，重要行情提醒', builtin: false, comingSoon: true },
    ]
  },
  {
    id: 'creative',
    emoji: '🎨',
    name: '创作娱乐',
    desc: '图片、故事、诗歌、笑话',
    features: [
      { id: 'story', emoji: '📖', name: '讲故事', desc: '给孩子讲睡前故事，或生成创意故事', builtin: true },
      { id: 'poem', emoji: '🎵', name: '写诗/对联', desc: '春节对联、生日祝福语、藏头诗', builtin: true },
      { id: 'joke', emoji: '😄', name: '说笑话', desc: '来一个笑话，活跃气氛', builtin: true },
      { id: 'image', emoji: '🖼️', name: '生成图片', desc: '描述你想要的图，AI 帮你画出来', builtin: false, comingSoon: true },
    ]
  },
  {
    id: 'learn',
    emoji: '📚',
    name: '学习教育',
    desc: '英语、答疑、查资料',
    features: [
      { id: 'english', emoji: '🇬🇧', name: '英语辅导', desc: '作文批改、单词解释、口语练习', builtin: true },
      { id: 'qa', emoji: '🔍', name: '百科问答', desc: '问任何问题，AI 给你详细解答', builtin: true },
      { id: 'math', emoji: '🔢', name: '数学辅导', desc: '拍照解题或直接描述题目', builtin: true },
      { id: 'code', emoji: '💻', name: '编程辅助', desc: '写代码、找 Bug、解释代码', builtin: true },
    ]
  },
  {
    id: 'health',
    emoji: '❤️',
    name: '健康生活',
    desc: '健康问答、食谱、运动建议',
    features: [
      { id: 'health-qa', emoji: '🏥', name: '健康问答', desc: '了解症状、用药注意事项（非诊断）', builtin: true },
      { id: 'recipe', emoji: '🍜', name: '今天吃什么', desc: '根据食材推荐菜谱，生成购物清单', builtin: true },
      { id: 'fitness', emoji: '🏃', name: '运动建议', desc: '适合你的运动方案和健身计划', builtin: true },
    ]
  },
]

export default function Skills() {
  const [activeCategory, setActiveCategory] = useState(null)

  const currentCat = activeCategory
    ? CATEGORIES.find(c => c.id === activeCategory)
    : null

  return (
    <div className="skills-page-v1">
      <h1 className="page-title">🧩 功能中心</h1>
      <p className="page-subtitle">
        选择你需要的功能，龙虾助手帮你搞定
      </p>

      {/* ── 分类卡片 ── */}
      {!activeCategory && (
        <div className="cat-grid">
          {CATEGORIES.map(cat => (
            <div
              key={cat.id}
              className="cat-card"
              onClick={() => setActiveCategory(cat.id)}
            >
              <div className="cat-card-emoji">{cat.emoji}</div>
              <div className="cat-card-name">{cat.name}</div>
              <div className="cat-card-desc">{cat.desc}</div>
              <div className="cat-card-count">{cat.features.length} 个功能 →</div>
            </div>
          ))}
        </div>
      )}

      {/* ── 功能列表 ── */}
      {currentCat && (
        <div>
          <button
            className="back-btn"
            onClick={() => setActiveCategory(null)}
          >
            ← 返回分类
          </button>

          <div className="cat-header">
            <span className="cat-header-emoji">{currentCat.emoji}</span>
            <div>
              <div className="cat-header-name">{currentCat.name}</div>
              <div className="cat-header-desc">{currentCat.desc}</div>
            </div>
          </div>

          <div className="feature-grid">
            {currentCat.features.map(f => (
              <div
                key={f.id}
                className={`feature-card ${f.comingSoon ? 'feature-card--soon' : ''}`}
              >
                <div className="feature-emoji">{f.emoji}</div>
                <div className="feature-name">{f.name}</div>
                <div className="feature-desc">{f.desc}</div>
                {f.comingSoon ? (
                  <div className="feature-badge feature-badge--soon">即将上线</div>
                ) : (
                  <div className="feature-badge feature-badge--ready">
                    {f.builtin ? '✓ 已内置' : '点击使用'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 底部说明 ── */}
      {!activeCategory && (
        <div className="skills-tip-box">
          <p>💡 所有标注"已内置"的功能开箱即用，直接在聊天页提问即可。更多功能持续更新中。</p>
        </div>
      )}
    </div>
  )
}
