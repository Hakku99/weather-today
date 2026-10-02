import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const child = spawn(process.execPath, [require.resolve('@playwright/test/cli'), ...process.argv.slice(2)], {
  cwd: fileURLToPath(new URL('../', import.meta.url)),
  env: {
    ...process.env,
    PLAYWRIGHT_BROWSERS_PATH: fileURLToPath(new URL('../.cache/playwright', import.meta.url)),
  },
  stdio: 'inherit',
  windowsHide: true,
})

child.on('error', (error) => {
  console.error(error.message)
  process.exitCode = 1
})
child.on('exit', (code) => {
  process.exitCode = code ?? 1
})
