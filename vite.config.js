import { defineConfig } from 'vite'
import mpa from 'vite-plugin-html-mpa'

export default defineConfig({
  plugins: [
    mpa({
      scanDir: 'src/pages', // folder tempat semua HTML kamu
      filename: 'index.html' // default page
    })
  ]
})
