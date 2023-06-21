const lintStagedConfig = {
  '**/*': 'prettier -w -u --cache',
  '**/*.{js,jsx,ts,tsx,cjs,mjs}': (fileNames) =>
    `eslint --cache --max-warnings=0 ${fileNames
      .filter((fileName) => !fileName.includes('fixtures') && !fileName.endsWith('.lintstagedrc.mjs'))
      .join(' ')}`,
}

export default lintStagedConfig
