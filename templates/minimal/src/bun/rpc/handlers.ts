import { APP_NAME } from "../../shared/constants";
import type { AppEnvironment } from "../../shared/types";

const startedAt = new Date().toISOString();

export const getEnvironment = (): AppEnvironment => ({
  appName: APP_NAME,
  platform: process.platform,
  startedAt,
});

export const greet = ({ name }: { name: string }): { greeting: string } => ({
  greeting: `Hello, ${name || "Electrobun"} from Bun.`,
});

export const logToBun = ({ message }: { message: string }): void => {
  console.log(`[webview] ${message}`);
};
