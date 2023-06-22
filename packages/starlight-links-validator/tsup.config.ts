import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  external: ['mdast-util-mdx-jsx'],
  format: ['cjs', 'esm'],
  minify: true,
})
