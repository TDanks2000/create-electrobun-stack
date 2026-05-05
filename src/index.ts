#!/usr/bin/env bun

import { runCli } from "./cli";

await runCli(Bun.argv.slice(2));
