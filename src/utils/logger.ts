const write = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

const shouldUseColor = (): boolean =>
  Boolean(process.stdout.isTTY) && process.env.NO_COLOR === undefined;

const color = (code: number, message: string): string =>
  shouldUseColor() ? `\u001b[${code}m${message}\u001b[0m` : message;

export const logger = {
  box: (lines: Array<string>): void => {
    const width = Math.max(...lines.map((line) => line.length));
    write("");
    write(`+${"-".repeat(width + 2)}+`);
    for (const line of lines) {
      write(`| ${line.padEnd(width)} |`);
    }
    write(`+${"-".repeat(width + 2)}+`);
  },
  error: (message: string): void => {
    process.stderr.write(`${color(31, "Error:")} ${message}\n`);
  },
  heading: (message: string): void => write(color(36, message)),
  info: (message: string): void => write(message),
  muted: (message: string): void => write(color(90, message)),
  success: (message: string): void => write(`${color(32, "Done:")} ${message}`),
  warn: (message: string): void => write(`${color(33, "Warning:")} ${message}`),
};
