import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vue(),
    tailwindcss(),
    dts({
      insertTypesEntry: true,
      include: ['src'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'react/index': resolve(__dirname, 'src/react/index.ts'),
        'vue/index': resolve(__dirname, 'src/vue/index.ts'),
        'core/index': resolve(__dirname, 'src/core/index.ts'),
      },
      name: 'TBIPhone',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'vue',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          vue: 'Vue',
        },
        // Preserve directory structure
        preserveModules: false,
      },
    },
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
