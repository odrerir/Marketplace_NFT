import { existsSync, mkdirSync } from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from '@playwright/test'

const root = resolve(new URL('.', import.meta.url).pathname.slice(1), '..')
const reports = resolve(root, 'reports')
mkdirSync(reports, { recursive: true })

const viteCli = resolve(root, 'node_modules/vite/bin/vite.js')
const server = spawn(process.execPath, [viteCli, 'preview', '--host', '127.0.0.1', '--port', '4173'], {
  cwd: root,
  stdio: 'ignore',
  shell: false,
})

try {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch('http://127.0.0.1:4173')
      if (response.ok) break
    } catch {
      // The preview server is still starting.
    }
    if (attempt === 59) throw new Error('O servidor de preview nao iniciou em 60 segundos.')
    await delay(1_000)
  }

  const chromePath = chromium.executablePath()
  if (!existsSync(chromePath)) throw new Error(`Chromium do Playwright nao encontrado: ${chromePath}`)

  const lighthouseCli = resolve(root, 'node_modules/lighthouse/cli/index.js')
  const lighthouse = spawnSync(process.execPath, [
    lighthouseCli,
    'http://127.0.0.1:4173',
    '--chrome-path', chromePath,
    '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage',
    '--output=json',
    '--output-path=' + resolve(reports, 'lighthouse.json'),
    '--only-categories=performance,accessibility,best-practices,seo',
    '--quiet',
  ], { cwd: root, encoding: 'utf8' })

  process.stdout.write(lighthouse.stdout ?? '')
  process.stderr.write(lighthouse.stderr ?? '')
  if (lighthouse.status !== 0) process.exitCode = lighthouse.status ?? 1
  else {
    const html = spawnSync(process.execPath, [
      lighthouseCli,
      'http://127.0.0.1:4173',
      '--chrome-path', chromePath,
      '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage',
      '--output=html',
      '--output-path=' + resolve(reports, 'lighthouse.html'),
      '--only-categories=performance,accessibility,best-practices,seo',
      '--quiet',
    ], { cwd: root, encoding: 'utf8' })
    process.stdout.write(html.stdout ?? '')
    process.stderr.write(html.stderr ?? '')
    if (html.status !== 0) process.exitCode = html.status ?? 1
  }
} finally {
  server.kill('SIGTERM')
}
