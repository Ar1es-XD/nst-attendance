import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function localTokenPlugin() {
  return {
    name: 'local-token-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/local-token') {
          const tokenPath = path.resolve(__dirname, '.token')
          if (fs.existsSync(tokenPath)) {
            const token = fs.readFileSync(tokenPath, 'utf-8').trim()
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ token }))
            return
          }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ token: null }))
          return
        }
        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localTokenPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'https://my.newtonschool.co',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})


