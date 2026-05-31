import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// command = 'serve' en développement, 'build' pour la production
export default defineConfig(({ command }) => ({
  plugins: [react()],

  // En dev : base '/' → accès sur http://localhost:5173/
  // En build : base '/VoyageVista/' → fonctionne sur Apache/XAMPP
  base: command === 'build' ? '/VoyageVista/' : '/',

  server: {
    port: 5173,
    host: true,
    allowedHosts: 'all',
  },
}))
