#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const targetArgument = args.find((arg) => !arg.startsWith('--'));
const update = args.includes('--update');
const dryRun = args.includes('--dry-run');
const managedBlockStart = '<!-- pixel-hop-sdd:start -->';
const managedBlockEnd = '<!-- pixel-hop-sdd:end -->';

if (!targetArgument) {
  console.error('usage: node scripts/install.mjs /absolute/path/to/project [--update] [--dry-run]');
  process.exit(2);
}

const target = path.resolve(targetArgument);
if (!existsSync(target)) {
  console.error(`target does not exist: ${target}`);
  process.exit(1);
}

const guidance = [
  { template: 'templates/AGENTS.sdd.md', destination: 'AGENTS.md' },
  { template: 'templates/CLAUDE.sdd.md', destination: 'CLAUDE.md' },
];

function occurrences(text, value) {
  return text.split(value).length - 1;
}

function managedGuidanceContent(destination, snippet) {
  const block = `${managedBlockStart}\n${snippet.trimEnd()}\n${managedBlockEnd}`;
  if (!existsSync(destination)) return `${block}\n`;

  const existing = readFileSync(destination, 'utf8');
  const starts = occurrences(existing, managedBlockStart);
  const ends = occurrences(existing, managedBlockEnd);
  if (starts !== ends || starts > 1) {
    throw new Error(`invalid Pixel Hop SDD managed block markers in ${path.basename(destination)}`);
  }

  if (starts === 1) {
    const start = existing.indexOf(managedBlockStart);
    const end = existing.indexOf(managedBlockEnd, start);
    if (end < start) {
      throw new Error(`invalid Pixel Hop SDD managed block marker order in ${path.basename(destination)}`);
    }
    return `${existing.slice(0, start)}${block}${existing.slice(end + managedBlockEnd.length)}`;
  }

  const legacyHeading = /^## Canonical SDD workflow[ \t]*$/gm;
  const matches = [...existing.matchAll(legacyHeading)];
  if (matches.length > 1) {
    throw new Error(`multiple legacy Pixel Hop SDD sections found in ${path.basename(destination)}`);
  }
  if (matches.length === 1) {
    const start = matches[0].index;
    const remaining = existing.slice(start + matches[0][0].length);
    const nextHeading = remaining.match(/^#{1,2} [^\r\n]+$/m);
    const rawEnd = nextHeading
      ? start + matches[0][0].length + nextHeading.index
      : existing.length;
    let end = rawEnd;
    while (end > start && /\s/.test(existing[end - 1])) end -= 1;
    return `${existing.slice(0, start)}${block}${existing.slice(end)}`;
  }

  if (existing.length === 0) return `${block}\n`;
  const separator = existing.endsWith('\n') ? '\n' : '\n\n';
  return `${existing}${separator}${block}\n`;
}

let guidanceUpdates;
try {
  guidanceUpdates = guidance.map(({ template, destination }) => {
    const snippet = readFileSync(path.join(repository, template), 'utf8');
    const destinationPath = path.join(target, destination);
    return {
      destination,
      destinationPath,
      content: managedGuidanceContent(destinationPath, snippet),
    };
  });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const managed = [
  ['.sdd/settings', '.sdd/settings'],
  ['.sdd/tools', '.sdd/tools'],
  ['.claude/commands/sdd', '.claude/commands/sdd'],
  ['.codex/skills/sdd', '.codex/skills/sdd'],
];

const existing = managed.filter(([, destination]) => existsSync(path.join(target, destination)));
if (existing.length && !update) {
  console.error('framework files already exist; inspect changes and rerun with --update:');
  for (const [, destination] of existing) console.error(`- ${destination}`);
  process.exit(1);
}

const operations = managed.map(([source, destination]) => ({ source, destination }));
operations.push({ source: 'templates', destination: '.sdd/adapters' });

for (const operation of operations) {
  const source = path.join(repository, operation.source);
  const destination = path.join(target, operation.destination);
  console.log(`${update ? 'sync' : 'install'} ${operation.destination}`);
  if (dryRun) continue;
  if (update && existsSync(destination)) rmSync(destination, { recursive: true, force: true });
  mkdirSync(path.dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true });
}

for (const guidanceUpdate of guidanceUpdates) {
  console.log(`${update ? 'sync' : 'install'} managed SDD block in ${guidanceUpdate.destination}`);
  if (!dryRun) writeFileSync(guidanceUpdate.destinationPath, guidanceUpdate.content);
}

if (!dryRun) {
  const config = path.join(target, '.sdd/config.json');
  if (!existsSync(config)) cpSync(path.join(repository, '.sdd/config.example.json'), config);

  mkdirSync(path.join(target, '.sdd/specs'), { recursive: true });
  mkdirSync(path.join(target, '.sdd/discoveries'), { recursive: true });
  mkdirSync(path.join(target, '.sdd/releases'), { recursive: true });
  mkdirSync(path.join(target, '.sdd/steering'), { recursive: true });
  mkdirSync(path.join(target, '.sdd/status'), { recursive: true });
  mkdirSync(path.join(target, '.sdd/runtime'), { recursive: true });

  const runtimeIgnore = path.join(target, '.sdd/runtime/.gitignore');
  if (!existsSync(runtimeIgnore)) writeFileSync(runtimeIgnore, '*\n!.gitignore\n');

  const installedVersion = readFileSync(path.join(repository, '.sdd/settings/VERSION'), 'utf8').trim();
  console.log(`installed SDD framework ${installedVersion}`);
}

console.log('next: customize .sdd/config.json');
