import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

async function readProjectFile(relativePath) {
  return readFile(path.join(projectRoot, relativePath), 'utf8')
}

test('NSIS installerLanguages use electron-builder locale codes', async () => {
  const pkg = JSON.parse(await readProjectFile('package.json'))
  const installerLanguages = pkg.build?.nsis?.installerLanguages

  assert.deepEqual(installerLanguages, ['zh_CN', 'en_US'])
})

test('Windows packaging disables signAndEditExecutable for unsigned local builds', async () => {
  const pkg = JSON.parse(await readProjectFile('package.json'))

  assert.equal(pkg.build?.win?.signAndEditExecutable, false)
})

test('Electron packaged app uses HashRouter for file:// routes', async () => {
  const entry = await readProjectFile('src/main.jsx')

  assert.match(entry, /HashRouter/)
  assert.doesNotMatch(entry, /BrowserRouter/)
})

test('Vite build uses relative asset base for file:// packaged app', async () => {
  const viteConfig = await readProjectFile('vite.config.js')

  assert.match(viteConfig, /base:\s*['"]\.\/['"]/)
})

test('Main panel opens Longxia web UI in system browser instead of OpenClaw control UI URL', async () => {
  const mainProcess = await readProjectFile('electron/main.cjs')

  assert.match(mainProcess, /function openMainPanelInBrowser\(/)
  assert.match(mainProcess, /function showMainPanel\(\)/)
  assert.match(mainProcess, /openMainPanelInBrowser\('\/'\)/)
  assert.doesNotMatch(mainProcess, /const url = `\$\{SERVICE_URL\}`/)
})

test('restart-service IPC validates startup result and returns explicit errors', async () => {
  const mainProcess = await readProjectFile('electron/main.cjs')

  assert.match(mainProcess, /function restartGatewayService\(\)/)
  assert.match(mainProcess, /ipcMain\.handle\('restart-service'/)
  assert.match(mainProcess, /return restartGatewayService\(\)/)
  assert.match(mainProcess, /const startResult = await startGateway/)
  assert.match(mainProcess, /if \(!startResult\.ok\)/)
  assert.match(mainProcess, /const ready = await waitForService\(30\)/)
  assert.match(mainProcess, /if \(!ready\)/)
  assert.match(mainProcess, /return \{ ok: false, error:/)
})

test('browser mode API fallback prefers same-origin proxy', async () => {
  const apiSource = await readProjectFile('src/api.js')

  assert.match(apiSource, /const origin = window\.location\?\.origin/)
  assert.match(apiSource, /_gatewayUrl = isHttpOrigin && !isViteDev \? origin : 'http:\/\/localhost:18789'/)
})

test('browser mode restart uses same-origin /api/restart', async () => {
  const statusPage = await readProjectFile('src/pages/Status.jsx')

  assert.match(statusPage, /fetch\('\/api\/restart', \{ method: 'POST' \}\)/)
  assert.doesNotMatch(statusPage, /localhost:3001\/api\/restart/)
})

test('web UI proxy strips browser origin headers and supports port fallback', async () => {
  const mainProcess = await readProjectFile('electron/main.cjs')

  assert.match(mainProcess, /delete headers\.origin/)
  assert.match(mainProcess, /delete headers\.referer/)
  assert.match(mainProcess, /function listenWebUiServerWithFallback\(/)
  assert.match(mainProcess, /err && err\.code === 'EADDRINUSE'/)
  assert.match(mainProcess, /const WEB_UI_MAX_PORT = 18910/)
})
