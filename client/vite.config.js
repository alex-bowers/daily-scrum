import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [vue()],
    server: {
        host: '127.0.0.1',
        proxy: {
            '/api': {
                target: 'https://localhost:3000',
                changeOrigin: true,
                secure: false,
            },
            '/ws': {
                target: 'wss://localhost:3000',
                ws: true,
                secure: false,
            },
        },
    },
})
