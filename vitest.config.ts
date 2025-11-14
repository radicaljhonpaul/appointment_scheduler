import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      globals: true,
      pool: 'threads',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/**',
          'src/components/ui/**', // UI components from shadcn
          '**/*.config.*',
          '**/types/**',
          '**/*.d.ts',
        ],
      },
      setupFiles: ['./src/tests/setup.ts'],
    },
  }),
)
