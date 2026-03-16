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
