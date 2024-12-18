import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    poolOptions: {
      forks: {
        maxForks: 1,
        minForks: 1,
      },
    },
    testTimeout: 60_000,
  },
})
