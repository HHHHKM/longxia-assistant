import React, { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Status from './pages/Status.jsx'
import Config from './pages/Config.jsx'
import Skills from './pages/Skills.jsx'
import Chat from './pages/Chat.jsx'
import Setup from './pages/Setup.jsx'
import Tasks from './pages/Tasks.jsx'
import Family from './pages/Family.jsx'
import Care from './pages/Care.jsx'
import HomeHub from './pages/HomeHub.jsx'
import Cases from './pages/Cases.jsx'
import ModelControl from './pages/ModelControl.jsx'
import Update from './pages/Update.jsx'
import ElderMode from './pages/ElderMode.jsx'
import Download from './pages/Download.jsx'
import Language from './pages/Language.jsx'

function App() {
  const location = useLocation()
  const isChat = location.pathname === '/chat'
  const isSetup = location.pathname === '/setup'

  // ── 极简模式：读取当前激活家庭成员，若 simpleMode=true 则给 body 加 class ──
  useEffect(() => {
    function applySimpleMode() {
      try {
        const activeId = localStorage.getItem('longxia_family_active')
        const members = JSON.parse(localStorage.getItem('longxia_family') || '[]')
        const activeMember = activeId ? members.find(m => String(m.id) === activeId) : null
        if (activeMember && activeMember.simpleMode) {
          document.body.classList.add('simple-mode')
        } else {
          document.body.classList.remove('simple-mode')
        }
      } catch {
        document.body.classList.remove('simple-mode')
      }
    }

    applySimpleMode()

    // 监听 localStorage 变化（其他标签页切换时同步）
    window.addEventListener('storage', applySimpleMode)
    return () => window.removeEventListener('storage', applySimpleMode)
  }, [location.pathname]) // 每次路由切换时重新检测（切换成员后跳转页面能及时生效）

  if (isSetup) {
    return (
      <Routes>
        <Route path="/setup" element={<Setup />} />
      </Routes>
    )
  }

  return (
    <div className="app">
      <Navbar />
      <main className={isChat ? 'main-content main-content--chat' : 'main-content'}>
        <Routes>
          <Route path="/" element={<HomeHub />} />
          <Route path="/status" element={<Status />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/family" element={<Family />} />
          <Route path="/care" element={<Care />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/config" element={<Config />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/download" element={<Download />} />
          <Route path="/language" element={<Language />} />
          <Route path="/model" element={<ModelControl />} />
          <Route path="/update" element={<Update />} />
          <Route path="/elder" element={<ElderMode />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
