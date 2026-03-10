import React, { useState } from 'react'

// ❓ 帮助按钮组件
// 点击后弹出中文说明气泡，适合不懂电脑的用户
// Props:
//   title: 弹窗标题
//   content: 中文解释内容（支持换行 \n）
function HelpButton({ title, content }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* ❓ 小圆圈按钮 */}
      <button
        className="help-btn"
        onClick={() => setOpen(true)}
        title="点击查看说明"
        type="button"
        aria-label="帮助说明"
      >
        ❓
      </button>

      {/* 弹窗遮罩 */}
      {open && (
        <div className="help-popup-overlay" onClick={() => setOpen(false)}>
          <div className="help-popup" onClick={e => e.stopPropagation()}>
            <div className="help-popup-title">💡 {title}</div>
            <div className="help-popup-body">
              {/* 支持换行显示 */}
              {content.split('\n').map((line, i) => (
                <p key={i} style={{ marginBottom: line ? 8 : 0 }}>{line}</p>
              ))}
            </div>
            <button
              className="btn btn-primary help-popup-close"
              onClick={() => setOpen(false)}
              type="button"
            >
              ✅ 我明白了
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default HelpButton
