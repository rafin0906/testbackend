import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy:{
      '/api': 'https://chorpolice.onrender.com'
    }
  },
  plugins: [react(), tailwindcss()],
})
