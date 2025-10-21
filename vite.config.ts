import { defineConfig } from 'vite'

export default defineConfig({
    root: 'src/frontend',
    build: {
        outDir: '../../dist/frontend',
        emptyOutDir: true
    },
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true
            }
        }
    }
})

