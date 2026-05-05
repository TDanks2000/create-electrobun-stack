import type { ElectrobunConfig } from "electrobun";

export default {
  app: {
    identifier: "__APP_IDENTIFIER__",
    name: "__APP_NAME__",
    version: "0.1.0",
  },
  runtime: {
    exitOnLastWindowClosed: true,
  },
  build: {
    bun: {
      entrypoint: "src/bun/index.ts",
    },
    copy: {
      "src/views/main/index.html": "views/main/index.html",
    },
    views: {
      main: {
        entrypoint: "src/views/main/main.tsx",
      },
    },
  },
} satisfies ElectrobunConfig;
