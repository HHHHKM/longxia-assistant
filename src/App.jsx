import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Status  from './pages/Status.jsx'
import Config  from './pages/Config.jsx'
import Skills  from './pages/Skills.jsx'
import Chat    from './pages/Chat.jsx'
import Setup   from './pages/Setup.jsx'
import Tasks   from './pages/Tasks.jsx'
import Family  from './pages/Family.jsx'

function App() {
  const location = useLocation()
  const isChat = location.pathname === '/chat'
  const isSetup = location.pathname === '/setup'

  // 向导页不显示导航栏
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
      {/* 对话页需要特殊布局（固定高度），其他页面正常滚动 */}
      <main className={isChat ? 'main-content main-content--chat' : 'main-content'}>
        <Routes>
          <Route path="/"       element={<Status />} />
          <Route path="/chat"   element={<Chat />} />
          <Route path="/tasks"  element={<Tasks />} />
          <Route path="/family" element={<Family />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/config" element={<Config />} />
          <Route path="/setup"  element={<Setup />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
