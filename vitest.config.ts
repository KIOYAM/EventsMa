import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      // Next's build-time marker. It is a package whose default export throws, so
      // importing a `server-only` module in a Node test would fail before any
      // assertion. The integration tests drive those modules directly, which is
      // the point of them; nothing here reaches a browser.
      'server-only': fileURLToPath(
        new URL('./node_modules/next/dist/compiled/server-only/empty.js', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
    reporters: 'default',
  },
})
