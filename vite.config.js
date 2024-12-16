import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import Markdown from 'unplugin-vue-markdown/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    vue({
      include: [/\.vue$/, /\.md$/]
    }), 
    nodePolyfills(),
    Markdown(),
    {
      name: 'markdown-watcher',
      configureServer(server) {
        const watcher = require('chokidar').watch('kolibri-docs/**/*');
        watcher.on('all', () => {
          server.ws.send('content-changed');
        });
      }
    }
  ],
  // https://github.com/vitejs/vite/issues/1973
  define: {
    // // By default, Vite doesn't include shims for NodeJS/
    // // necessary for segment analytics lib to work
    "global": {},
  },
  resolve: {
    alias: 
      {
        '~animate.css': path.resolve( './node_modules/animate.css'),
        '~bulma': path.resolve( './node_modules/bulma'),
        '~@sweetalert2/theme-bulma': path.resolve( './node_modules/@sweetalert2/theme-bulma'),
        // 'vue-bulma-paginate': path.resolve( './node_modules/vue-bulma-paginate'),
        "@components": path.resolve(__dirname, "./src/components"),
        "@": path.resolve(__dirname, "./src"),
      },
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: 'modern-compiler', // or "modern"
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'js/[name].[hash].js',
        chunkFileNames: 'js/[name].[hash].js',
      }
    }
  },
})