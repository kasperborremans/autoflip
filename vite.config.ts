import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relatief base-pad zodat de build ook werkt op GitHub Pages (/autoflip/).
export default defineConfig({
  plugins: [react()],
  base: './',
})
