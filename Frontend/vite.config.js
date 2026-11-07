import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import {handler} from './server/discovery.mjs'
export default defineConfig({
 plugins:[react(),{name:'parking-discovery',configureServer(server){server.middlewares.use(handler)},configurePreviewServer(server){server.middlewares.use(handler)}}]
})
