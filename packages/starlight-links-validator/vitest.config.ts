import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    maxWorkers: 1,
    testTimeout: 60_000,
  },
})
