import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    poolOptions: {
      threads: {
        maxThreads: 1,
        minThreads: 1,
      },
    },
    testTimeout: 30_000,
  },
})
