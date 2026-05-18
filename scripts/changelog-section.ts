import { readFile } from "node:fs/promises";

const version = process.argv[2]?.replace(/^v/, "");

if (!version) {
  throw new Error("Usage: bun scripts/changelog-section.ts <version>");
}

const changelog = await readFile(
  new URL("../CHANGELOG.md", import.meta.url),
  "utf8",
);

const headingPattern = /^##\s+(.+)$/gm;
const headings = [...changelog.matchAll(headingPattern)];
const heading = headings.find((match) => match[1]?.trim() === version);

if (!heading || heading.index === undefined) {
  throw new Error(`CHANGELOG.md does not contain a section for ${version}.`);
}

const nextHeading = headings.find(
  (match) => (match.index ?? 0) > (heading.index ?? 0),
);
const contentStart = heading.index + heading[0].length;
const contentEnd = nextHeading?.index ?? changelog.length;
const section = changelog.slice(contentStart, contentEnd).trim();

if (!section) {
  throw new Error(`CHANGELOG.md section for ${version} is empty.`);
}

console.log(section);
