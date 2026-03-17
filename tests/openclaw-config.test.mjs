import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { buildBaseConfig } = require('../electron/installer.cjs')

test('buildBaseConfig generates DeepSeek provider config required by current OpenClaw', () => {
  const config = buildBaseConfig('deepseek', 'sk-test')
  const provider = config.models?.providers?.deepseek

  assert.equal(config.gateway?.mode, 'local')
  assert.equal(config.models?.mode, 'merge')
  assert.equal(provider?.baseUrl, 'https://api.deepseek.com/v1')
  assert.equal(provider?.api, 'openai-completions')
  assert.ok(Array.isArray(provider?.models))
  assert.ok(provider.models.some((model) => model.id === 'deepseek-chat'))
})
