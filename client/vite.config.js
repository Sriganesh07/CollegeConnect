import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    // This magical plugin handles events, util, stream, buffer, and process automatically!
    nodePolyfills({
      protocolImports: true,
    }),
  ],
  define: {
    // We still need this one line because simple-peer looks for the 'global' window object
    global: 'window', 
  }
})