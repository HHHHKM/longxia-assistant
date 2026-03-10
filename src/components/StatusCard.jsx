import React from 'react'

// 统计数据卡片
// Props: icon, label, value, sub, accent(强调边框)
function StatusCard({ icon, label, value, sub }) {
  return (
    <div className="status-card card">
      <div className="status-card-icon">{icon}</div>
      <div className="status-card-body">
        <div className="status-card-label">{label}</div>
        <div className="status-card-value">{value}</div>
        {sub && <div className="status-card-sub">{sub}</div>}
      </div>
    </div>
  )
}

export default StatusCard
