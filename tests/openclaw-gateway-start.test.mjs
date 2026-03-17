import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

test('startGateway falls back to the current foreground command supported by OpenClaw', async () => {
  const source = await readFile(path.join(projectRoot, 'electron', 'ocManager.cjs'), 'utf8')

  assert.match(source, /spawn\(cmd,\s*\['gateway', 'run'/)
  assert.doesNotMatch(source, /--foreground/)
})
