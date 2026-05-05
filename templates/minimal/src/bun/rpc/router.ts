import { BrowserView } from "electrobun/bun";
import type { MainViewRPC } from "../../shared/rpc/types";
import { getEnvironment, greet, logToBun } from "./handlers";

export const mainViewRPC = BrowserView.defineRPC<MainViewRPC>({
  handlers: {
    messages: {
      logToBun,
    },
    requests: {
      getEnvironment,
      greet,
    },
  },
  maxRequestTime: 5000,
});
