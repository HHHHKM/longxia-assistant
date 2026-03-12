import React, { useState } from 'react'

const CURRENT_VERSION = 'v1.0.0'

const CHANGELOG = [
  {
    version: 'v1.0.0',
    date: '2026-03-12',
    isCurrent: true,
    items: [
      '🎉 首次正式发布',
      '💬 支持智能对话',
      '⏰ 自动任务（21种场景模板）',
      '👨‍👩‍👧 家庭模式，老人模式',
      '❤️ 主动关怀推送',
      '🔧 可视化配置，无需命令行',
    ],
  },
]

export default function Update() {
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState(null)
  const [expanded, setExpanded] = useState('v1.0.0')

  async function handleCheck() {
    setChecking(true)
    setResult(null)
    await new Promise(r => setTimeout(r, 2000))

    let res = null
    try {
      if (window.electronAPI?.checkForUpdates) {
        res = await window.electronAPI.checkForUpdates()
      }
    } catch {}

    if (!res) {
      res = { hasUpdate: false, currentVersion: '1.0.0', latestVersion: '1.0.0' }
    }

    setChecking(false)
    setResult(res)
  }

  return (
    <div style={{
      maxWidth: 640,
      margin: '0 auto',
      padding: '32px 20px 60px',
      fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
    }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>🔄 检查更新</h1>
      <p style={{ color: '#888', marginBottom: 32, fontSize: '0.95rem' }}>
        保持龙虾助手在最新状态
      </p>

      {/* 当前版本卡片 */}
      <div style={{
        background: '#f0f7ff',
        border: '1.5px solid #bbdefb',
        borderRadius: 16,
        padding: '24px 28px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ fontSize: '0.9rem', color: '#1976D2', fontWeight: 600, marginBottom: 4 }}>
            当前版本
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0D47A1' }}>
            {CURRENT_VERSION}
          </div>
        </div>
        <button
          onClick={handleCheck}
          disabled={checking}
          style={{
            background: checking ? '#bbb' : '#1976D2',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '12px 28px',
            fontSize: '1.05rem',
            fontWeight: 700,
            cursor: checking ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            minWidth: 140,
          }}
        >
          {checking ? '正在检查...' : '检查更新'}
        </button>
      </div>

      {/* 检查结果 */}
      {result && (
        <div style={{
          background: result.hasUpdate ? '#fff8e1' : '#f1fff4',
          border: `1.5px solid ${result.hasUpdate ? '#ffe082' : '#c8e6c9'}`,
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 24,
          fontSize: '1.05rem',
          fontWeight: 600,
          color: result.hasUpdate ? '#E65100' : '#2E7D32',
        }}>
          {result.hasUpdate
            ? `🆕 发现新版本 v${result.latestVersion}！点击下载安装。`
            : `当前已是最新版本 ✅ ${CURRENT_VERSION}`
          }
        </div>
      )}

      {/* 自动更新说明 */}
      <div style={{
        background: '#fff8f0',
        border: '1.5px solid #ffe0b2',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 32,
        fontSize: '0.95rem',
        color: '#6D4C41',
        lineHeight: 1.6,
      }}>
        💡 龙虾助手支持自动检测新版本。有新版本时会在这里提醒您，下载安装只需点一下。
      </div>

      {/* 更新记录 */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, color: '#333' }}>
        📋 更新记录
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {CHANGELOG.map(entry => (
          <div key={entry.version} style={{
            border: `1.5px solid ${entry.isCurrent ? '#bbdefb' : '#eee'}`,
            borderRadius: 14,
            overflow: 'hidden',
          }}>
            <button
              onClick={() => setExpanded(expanded === entry.version ? null : entry.version)}
              style={{
                width: '100%',
                background: entry.isCurrent ? '#e3f2fd' : '#fafafa',
                border: 'none',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1565C0' }}>
                  {entry.version}
                </span>
                <span style={{ color: '#888', fontSize: '0.88rem' }}>{entry.date}</span>
                {entry.isCurrent && (
                  <span style={{
                    background: '#1976D2',
                    color: '#fff',
                    borderRadius: 20,
                    padding: '2px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                  }}>
                    当前版本
                  </span>
                )}
              </div>
              <span style={{ color: '#aaa', fontSize: '1.1rem' }}>
                {expanded === entry.version ? '▲' : '▼'}
              </span>
            </button>
            {expanded === entry.version && (
              <div style={{
                background: '#fff',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                {entry.items.map((item, i) => (
                  <div key={i} style={{ fontSize: '0.95rem', color: '#444', lineHeight: 1.5 }}>
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
