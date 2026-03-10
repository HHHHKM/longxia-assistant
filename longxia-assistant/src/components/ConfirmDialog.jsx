import React from 'react'

// 操作确认弹窗组件
// 安装/卸载前弹出，防止误操作（老人保护）
// Props:
//   open:      是否显示
//   icon:      大图标 emoji
//   title:     确认标题
//   desc:      确认描述（告知用户做什么）
//   confirmText: 确认按钮文字
//   cancelText:  取消按钮文字
//   onConfirm: 点确认的回调
//   onCancel:  点取消的回调
//   danger:    是否显示危险样式（卸载用）
function ConfirmDialog({
  open,
  icon = '❓',
  title,
  desc,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
  danger = false,
}) {
  if (!open) return null

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={e => e.stopPropagation()}>
        <span className="confirm-icon">{icon}</span>
        <div className="confirm-title">{title}</div>
        <div className="confirm-desc">{desc}</div>
        <div className="confirm-btns">
          {/* 取消按钮放左边，防止误点确认 */}
          <button className="btn btn-secondary" onClick={onCancel} type="button">
            ✖ {cancelText}
          </button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
