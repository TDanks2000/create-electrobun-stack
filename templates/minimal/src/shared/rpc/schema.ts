import type { RPCSchema } from "electrobun";
import type { AppEnvironment } from "../types";

export type MainViewRPC = {
  bun: RPCSchema<{
    messages: {
      logToBun: {
        message: string;
      };
    };
    requests: {
      getEnvironment: {
        params: null;
        response: AppEnvironment;
      };
      greet: {
        params: {
          name: string;
        };
        response: {
          greeting: string;
        };
      };
    };
  }>;
  webview: RPCSchema<{
    messages: {
      logToWebview: {
        message: string;
      };
    };
    requests: {
      getViewStatus: {
        params: null;
        response: {
          ready: boolean;
        };
      };
    };
  }>;
};
