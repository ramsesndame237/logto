import fs from 'node:fs/promises';

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'account/index': 'src/account/index.ts',
    'account/react': 'src/account/react.ts',
  },
  format: 'esm',
  dts: true,
  clean: true,
  esbuildPlugins: [
    {
      name: 'transform-svg',
      setup: (build) => {
        build.onLoad({ filter: /\.svg$/ }, async (arguments_) => {
          const text = await fs.readFile(arguments_.path, 'utf8');
          return {
            contents: `import { html } from 'lit';\nexport default html\`${text}\`;`,
          };
        });
      },
    },
  ],
});
