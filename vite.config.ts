import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), 'dev-data')
const DATA_FILE = join(DATA_DIR, 'todos.json')

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

function apiPlugin() {
  return {
    name: 'dev-api',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use('/api/todos', (req, res) => {
        if (req.method === 'GET') {
          ensureDataDir()
          try {
            const data = existsSync(DATA_FILE) ? readFileSync(DATA_FILE, 'utf-8') : '[]'
            res.setHeader('Content-Type', 'application/json')
            res.end(data)
          } catch {
            res.statusCode = 500
            res.end('[]')
          }
          return
        }

        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => { body += chunk })
          req.on('end', () => {
            ensureDataDir()
            writeFileSync(DATA_FILE, body, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          })
          return
        }

        res.statusCode = 404
        res.end('Not found')
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/Todos/',
  plugins: [
    tailwindcss(),
    vue(),
    vueJsx(),
    vueDevTools(),
    apiPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
