#!/usr/bin/env node

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const CONFIG_FILENAME = "sifter.config.ts";
const LEGACY_CONFIG_FILENAME = "searchcraft.config.ts";

const HELP = `
sifter - Full-text search for Next.js

Usage:
  sifter <command>

Commands:
  init      Create a sifter.config.ts starter template in the current directory
  index     Build a search index from your documents
  mcp       Start the Sifter MCP server over stdio

Options:
  --help    Show this help message
`.trim();

const CONFIG_TEMPLATE = `import { createSifter } from "sifter-next";

// Define your searchable schema
export const search = createSifter({
  schema: {
    title: { weight: 2 },
    description: true,
    tags: { weight: 1.5 },
  },
  documents: [],  // Load your documents here
});
`;

const CONFIG_TEMPLATE_PRESSROOM = `import { createSifter } from "sifter-next";

// Define your searchable schema
// Pressroom detected — content collections are auto-indexed when using
// the pressroom integration. See the pressroom docs for details.
export const search = createSifter({
  schema: {
    title: { weight: 2 },
    description: true,
    tags: { weight: 1.5 },
  },
  documents: [],  // Load your documents here
});
`;

function detectPressroom(): boolean {
  const pkgPath = join(process.cwd(), "package.json");
  if (!existsSync(pkgPath)) return false;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };
    return "pressroom" in (allDeps ?? {});
  } catch {
    return false;
  }
}

function cmdInit(): void {
  const dest = join(process.cwd(), CONFIG_FILENAME);
  const legacyDest = join(process.cwd(), LEGACY_CONFIG_FILENAME);

  if (existsSync(dest)) {
    console.log(`${CONFIG_FILENAME} already exists — skipping.`);
    process.exit(1);
  }

  if (existsSync(legacyDest)) {
    console.log(`${LEGACY_CONFIG_FILENAME} already exists.`);
    console.log(
      `Rename it to ${CONFIG_FILENAME} and replace imports from "searchcraft" with "sifter-next".`,
    );
    process.exit(1);
  }

  const hasPressroom = detectPressroom();
  const template = hasPressroom ? CONFIG_TEMPLATE_PRESSROOM : CONFIG_TEMPLATE;

  writeFileSync(dest, template, "utf-8");

  console.log(`Created ${CONFIG_FILENAME}`);

  if (hasPressroom) {
    console.log("  Pressroom detected — added auto-indexing note.");
  }

  console.log();
  console.log("Next steps:");
  console.log("  1. Add your documents to the config");
  console.log("  2. Import { search } from './sifter.config' in your app");
  console.log("  3. Call search.search('your search term') to search");
}

function cmdIndex(): void {
  console.log("Building a search index:");
  console.log();
  console.log("  1. Ensure sifter.config.ts exists (run `sifter init` first)");
  console.log("  2. Populate the `documents` array in your config");
  console.log("  3. Import and call createSifter() at build time to generate the index");
  console.log("  4. The index is built in-memory on first query — no separate build step needed");
  console.log();
  console.log("For large document sets, consider pre-building the index in a build script");
  console.log("and serializing it for faster cold starts.");
}

async function cmdMcp(): Promise<void> {
  const [{ serveStdio }, { createSifterMcpServer }] = await Promise.all([
    import("@modelcontextprotocol/server/stdio"),
    import("./mcp.js"),
  ]);

  serveStdio(() => createSifterMcpServer(), {
    onerror: (error) => console.error(`Sifter MCP error: ${error.message}`),
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    console.log(HELP);
    process.exit(0);
  }

  switch (command) {
    case "init":
      cmdInit();
      break;
    case "index":
      cmdIndex();
      break;
    case "mcp":
      await cmdMcp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log();
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Sifter failed: ${message}`);
  process.exit(1);
});
