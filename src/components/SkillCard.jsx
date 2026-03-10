import React, { useState } from 'react'

// 分类颜色
const CAT_COLORS = {
  '工具':    '#5c6bc0',
  'Web开发': '#00897b',
  '设计':    '#e91e63',
  'Azure':   '#0078d4',
  '开发工具':'#f57c00',
  '市场营销':'#7b1fa2',
  '文档处理':'#c62828',
}

// 功能插件卡片
// Props:
//   skill:          插件数据
//   installed:      是否已安装
//   onAskConfirm:   触发确认弹窗 (skillId, 'install'|'uninstall')
function SkillCard({ skill, installed, onAskConfirm }) {
  const catColor = CAT_COLORS[skill.cat] || '#888'

  return (
    <div className={`skill-card card ${installed ? 'skill-card--installed' : ''}`}>
      {/* 名称行 */}
      <div className="skill-card-header">
        <div className="skill-card-name">
          <span className="skill-status-icon">{installed ? '✅' : '⬜'}</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
            {skill.id}
          </span>
        </div>
        <span className="skill-heat">🔥 {skill.heat}</span>
      </div>

      {/* 中文描述（大字，老人易懂） */}
      <div className="skill-card-desc">{skill.desc}</div>

      {/* 底部：分类 + 按钮 */}
      <div className="skill-card-footer">
        <span
          className="skill-cat"
          style={{
            backgroundColor: catColor + '22',
            color: catColor,
            borderColor: catColor + '55',
          }}
        >
          {skill.cat}
        </span>

        {installed ? (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onAskConfirm(skill.id, 'uninstall')}
          >
            🗑 卸载
          </button>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onAskConfirm(skill.id, 'install')}
          >
            📦 安装
          </button>
        )}
      </div>
    </div>
  )
}

export default SkillCard
