import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const HELP = `Capture a verified learning as a project rule or skill.

Usage:
  node .cursor/skills/self-learning/scripts/capture-learning.mjs <short-name> [options] < body.md

Required options:
  --description <text>  What the rule or skill does
  --verified <text>     How the learning was verified
  --failure <text>      Named failure pattern it avoids
  --dead-end <text>     Concrete dead-end ruled out

Optional options:
  --type <rule|skill>   Output type (default: rule)
  --title <text>        Heading (defaults to the short name)
  --body-file <path>    Read the reusable procedure from a file instead of stdin
  --help                Show this help

Examples:
  printf '%s\\n' 'Use the preview server for smoke tests.' | \\
    node .cursor/skills/self-learning/scripts/capture-learning.mjs preview-smoke \\
      --description 'Run reliable preview smoke tests' \\
      --verified 'npm run smoke passed' \\
      --failure 'Testing against a stopped dev server' \\
      --dead-end 'Using a browser before starting the preview server'
`;

const SECRET_PATTERNS = [
  {
    label: "private key material",
    pattern: /-----BEGIN [A-Z0-9 ]+PRIVATE KEY-----/i,
  },
  {
    label: "known token format",
    pattern: /\b(?:ghp|github_pat|xox[baprs]-|sk_(?:live|test)_|rk_(?:live|test)_)[A-Za-z0-9_-]{12,}\b/i,
  },
  {
    label: "Google API key format",
    pattern: /\bAIza[0-9A-Za-z_-]{20,}\b/,
  },
  {
    label: "credential assignment",
    pattern: /\b(?:api[_-]?key|access[_-]?token|password|secret)\s*[:=]\s*["'`][^"'`\n]{8,}["'`]/i,
  },
];

const OPTION_NAMES = new Set([
  "type",
  "title",
  "description",
  "verified",
  "failure",
  "dead-end",
  "body-file",
]);

function parseArgs(argv) {
  const positional = [];
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--help" || argument === "-h") {
      return { help: true, options, positional };
    }

    if (!argument.startsWith("--")) {
      positional.push(argument);
      continue;
    }

    const [name, inlineValue] = argument.slice(2).split("=", 2);
    if (!OPTION_NAMES.has(name)) {
      throw new Error(`Unknown option: --${name}`);
    }

    const value = inlineValue ?? argv[++index];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${name}`);
    }

    options[name] = value;
  }

  return { help: false, options, positional };
}

function toTitle(shortName) {
  return shortName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function quoteYaml(value) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\s+/g, " ").trim()}"`;
}

function findSecret(text) {
  return SECRET_PATTERNS.find(({ pattern }) => pattern.test(text));
}

async function readStdin() {
  let content = "";
  for await (const chunk of process.stdin) {
    content += chunk;
  }
  return content;
}

async function getBody(options) {
  if (options["body-file"]) {
    return readFile(path.resolve(process.cwd(), options["body-file"]), "utf8");
  }

  if (process.stdin.isTTY) {
    throw new Error("Provide --body-file or pipe the reusable procedure through stdin");
  }

  return readStdin();
}

function buildDocument({ type, name, title, description, verified, failure, deadEnd, body }) {
  const verification = `## Verification
- Verified: ${verified}
- Failure pattern avoided: ${failure}
- Dead-end ruled out: ${deadEnd}`;

  if (type === "skill") {
    return `---
name: ${name}
description: ${quoteYaml(description)}
---

# ${title}

${body}

${verification}
`;
  }

  return `---
description: ${quoteYaml(description)}
alwaysApply: false
---

# ${title}

${body}

${verification}
`;
}

async function main() {
  const { help, options, positional } = parseArgs(process.argv.slice(2));

  if (help) {
    console.log(HELP);
    return;
  }

  const [name] = positional;
  if (!name || positional.length > 1) {
    throw new Error("Provide exactly one short name using lowercase letters, numbers, and hyphens");
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) {
    throw new Error("Short name must be lowercase kebab-case and no longer than 64 characters");
  }

  const type = options.type || "rule";
  if (type !== "rule" && type !== "skill") {
    throw new Error("--type must be either rule or skill");
  }

  const requiredOptions = ["description", "verified", "failure", "dead-end"];
  for (const option of requiredOptions) {
    if (!options[option]?.trim()) {
      throw new Error(`Missing required option: --${option}`);
    }
  }

  const body = (await getBody(options)).trim();
  if (!body) {
    throw new Error("The reusable procedure is empty");
  }

  const title = options.title?.trim() || toTitle(name);
  const valuesToCheck = [
    name,
    title,
    options.description,
    options.verified,
    options.failure,
    options["dead-end"],
    body,
  ];
  const secret = valuesToCheck.map((value) => findSecret(value)).find(Boolean);
  if (secret) {
    throw new Error(`Refusing to write possible ${secret.label}; record the credential location, never its value`);
  }

  const baseDirectory =
    type === "skill"
      ? path.join(process.cwd(), ".cursor", "skills", name)
      : path.join(process.cwd(), ".cursor", "rules", "learned");
  const targetPath =
    type === "skill" ? path.join(baseDirectory, "SKILL.md") : path.join(baseDirectory, `${name}.mdc`);

  await mkdir(baseDirectory, { recursive: true });
  const document = buildDocument({
    type,
    name,
    title,
    description: options.description,
    verified: options.verified,
    failure: options.failure,
    deadEnd: options["dead-end"],
    body,
  });
  await writeFile(targetPath, document, { encoding: "utf8", flag: "wx" });

  console.log(`Created ${path.relative(process.cwd(), targetPath)}`);
}

try {
  await main();
} catch (error) {
  console.error(`capture-learning: ${error.message}\n\n${HELP}`);
  process.exitCode = 1;
}
