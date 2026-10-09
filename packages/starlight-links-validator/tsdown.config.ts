import { defineConfig } from 'tsdown'

export default defineConfig({
  dts: true,
  entry: ['src/index.ts', 'src/middleware.ts'],
  fixedExtension: false,
  publint: { strict: true },
  unbundle: true,
})
