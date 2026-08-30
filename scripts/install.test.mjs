import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const repository = path.resolve(import.meta.dirname, '..');

test('installer preserves project-owned configuration, specs, and steering on update', () => {
  const target = mkdtempSync(path.join(os.tmpdir(), 'pixel-hop-workflow-'));
  try {
    const install = spawnSync(process.execPath, ['scripts/install.mjs', target], { cwd: repository, encoding: 'utf8' });
    assert.equal(install.status, 0, install.stderr);
    assert.equal(existsSync(path.join(target, '.sdd/settings/lifecycle.md')), true);
    assert.equal(existsSync(path.join(target, '.claude/commands/sdd/spec-impl.md')), true);
    assert.equal(existsSync(path.join(target, '.codex/skills/sdd/SKILL.md')), true);
    assert.equal(existsSync(path.join(target, '.sdd/discoveries')), true);
    assert.equal(existsSync(path.join(target, '.sdd/releases')), true);
    assert.equal(readFileSync(path.join(target, 'AGENTS.md'), 'utf8').includes('<!-- pixel-hop-sdd:start -->'), true);
    assert.equal(readFileSync(path.join(target, 'CLAUDE.md'), 'utf8').includes('<!-- pixel-hop-sdd:end -->'), true);
    assert.equal(existsSync(path.join(target, '.sdd/settings/workflows/discovery-brainstorm.md')), true);
    assert.equal(existsSync(path.join(target, '.sdd/settings/rules/store-design-readiness.md')), true);
    assert.equal(existsSync(path.join(target, '.sdd/settings/schemas/store-design-score.schema.json')), true);
    assert.equal(existsSync(path.join(target, '.sdd/settings/schemas/research-source.schema.json')), true);
    assert.equal(existsSync(path.join(target, '.sdd/settings/templates/discovery/store-design-score.json')), true);
    assert.equal(existsSync(path.join(target, '.sdd/settings/templates/shared/research-source.json')), true);
    assert.equal(existsSync(path.join(target, '.sdd/settings/rules/research-sources.md')), true);
    assert.equal(existsSync(path.join(target, '.claude/commands/sdd/discovery-validate.md')), true);
    assert.equal(existsSync(path.join(target, '.sdd/settings/workflows/auto-sdd.md')), true);
    assert.equal(existsSync(path.join(target, '.sdd/settings/rules/auto-sdd.md')), true);
    assert.equal(existsSync(path.join(target, '.claude/commands/sdd/auto-sdd.md')), true);
    assert.equal(existsSync(path.join(target, '.claude/commands/sdd/spec-close.md')), true);
    assert.equal(existsSync(path.join(target, '.sdd/settings/workflows/spec-close.md')), true);
    assert.equal(readFileSync(path.join(target, '.sdd/settings/workflows/spec-close.md'), 'utf8').includes('Do not create subagents'), true);
    assert.equal(readFileSync(path.join(target, '.codex/skills/sdd/SKILL.md'), 'utf8').includes('For `auto-sdd`'), true);
    assert.equal(readFileSync(path.join(target, '.codex/skills/sdd/SKILL.md'), 'utf8').includes('always pass the native `model` override'), true);
    assert.equal(readFileSync(path.join(target, '.codex/skills/sdd/SKILL.md'), 'utf8').includes('For `release-*`'), true);
    assert.equal(existsSync(path.join(target, '.sdd/settings/workflows/release-growth.md')), true);
    assert.equal(existsSync(path.join(target, '.claude/commands/sdd/release-launch.md')), true);

    const configFile = path.join(target, '.sdd/config.json');
    const config = JSON.parse(readFileSync(configFile, 'utf8'));
    assert.equal(config.auto_sdd.model_selection.strategy, 'lowest-adequate');
    assert.equal(config.auto_sdd.model_selection.require_explicit_model, true);
    assert.equal(config.auto_sdd.validation_optimization.strategy, 'adaptive');
    assert.equal(config.auto_sdd.validation_optimization.default_profile, 'standard');
    assert.equal(config.auto_sdd.validation_optimization.allow_single_wave_validator_as_final, true);
    assert.equal(config.auto_sdd.recovery.strategy, 'audit-before-resume');
    assert.equal(config.auto_sdd.recovery.increment_attempt_on_session_loss, true);
    assert.deepEqual(config.auto_sdd.model_selection.provider_catalogs.codex.map((entry) => entry.model), ['gpt-5.6-terra', 'gpt-5.6-sol']);
    assert.deepEqual(config.auto_sdd.model_selection.provider_catalogs.claude.map((entry) => entry.model), ['claude-haiku-4-5-20251001', 'claude-sonnet-5', 'claude-opus-4-8']);
    assert.equal(readFileSync(path.join(target, '.claude/commands/sdd/auto-sdd.md'), 'utf8').includes("per-invocation `model` parameter"), true);
    assert.equal(readFileSync(path.join(target, '.claude/commands/sdd/auto-sdd.md'), 'utf8').includes('--resume <feature>'), true);
    assert.equal(readFileSync(path.join(target, '.sdd/adapters/CLAUDE.sdd.md'), 'utf8').includes('CLAUDE_CODE_SUBAGENT_MODEL'), true);
    config.project_profile = 'custom-project';
    writeFileSync(configFile, `${JSON.stringify(config, null, 2)}\n`);
    mkdirSync(path.join(target, '.sdd/specs/example'), { recursive: true });
    mkdirSync(path.join(target, '.sdd/discoveries/example'), { recursive: true });
    mkdirSync(path.join(target, '.sdd/releases/example'), { recursive: true });
    mkdirSync(path.join(target, '.sdd/steering'), { recursive: true });
    writeFileSync(path.join(target, '.sdd/specs/example/history.md'), 'preserve\n');
    writeFileSync(path.join(target, '.sdd/specs/example/auto-sdd.json'), '{"preserve":true}\n');
    writeFileSync(path.join(target, '.sdd/discoveries/example/decision.md'), 'preserve discovery\n');
    writeFileSync(path.join(target, '.sdd/releases/example/release.json'), '{"preserve":true}\n');
    writeFileSync(path.join(target, '.sdd/steering/product.md'), 'preserve\n');
    const agentsFile = path.join(target, 'AGENTS.md');
    writeFileSync(agentsFile, `project instructions\n\n${readFileSync(agentsFile, 'utf8')}\nproject footer\n`);

    const update = spawnSync(process.execPath, ['scripts/install.mjs', target, '--update'], { cwd: repository, encoding: 'utf8' });
    assert.equal(update.status, 0, update.stderr);
    assert.equal(JSON.parse(readFileSync(configFile, 'utf8')).project_profile, 'custom-project');
    assert.equal(readFileSync(path.join(target, '.sdd/specs/example/history.md'), 'utf8'), 'preserve\n');
    assert.equal(readFileSync(path.join(target, '.sdd/specs/example/auto-sdd.json'), 'utf8'), '{"preserve":true}\n');
    assert.equal(readFileSync(path.join(target, '.sdd/discoveries/example/decision.md'), 'utf8'), 'preserve discovery\n');
    assert.equal(readFileSync(path.join(target, '.sdd/releases/example/release.json'), 'utf8'), '{"preserve":true}\n');
    assert.equal(readFileSync(path.join(target, '.sdd/steering/product.md'), 'utf8'), 'preserve\n');
    const updatedAgents = readFileSync(agentsFile, 'utf8');
    assert.equal(updatedAgents.startsWith('project instructions\n\n<!-- pixel-hop-sdd:start -->'), true);
    assert.equal(updatedAgents.endsWith('\nproject footer\n'), true);
    assert.equal(updatedAgents.split('<!-- pixel-hop-sdd:start -->').length - 1, 1);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test('installer appends managed guidance and migrates a legacy SDD section', () => {
  const target = mkdtempSync(path.join(os.tmpdir(), 'pixel-hop-workflow-'));
  try {
    writeFileSync(path.join(target, 'AGENTS.md'), '# Project agents\n\nKeep this instruction.\n');
    const legacy = readFileSync(path.join(repository, 'templates/CLAUDE.sdd.md'), 'utf8');
    writeFileSync(path.join(target, 'CLAUDE.md'), `# Project Claude\n\n${legacy}\n## Project commands\n\nKeep this too.\n`);

    const install = spawnSync(process.execPath, ['scripts/install.mjs', target], { cwd: repository, encoding: 'utf8' });
    assert.equal(install.status, 0, install.stderr);

    const agents = readFileSync(path.join(target, 'AGENTS.md'), 'utf8');
    assert.equal(agents.startsWith('# Project agents\n\nKeep this instruction.\n\n<!-- pixel-hop-sdd:start -->'), true);

    const claude = readFileSync(path.join(target, 'CLAUDE.md'), 'utf8');
    assert.equal(claude.startsWith('# Project Claude\n\n<!-- pixel-hop-sdd:start -->'), true);
    assert.equal(claude.includes('<!-- pixel-hop-sdd:end -->\n\n## Project commands'), true);
    assert.equal(claude.split('## Canonical SDD workflow').length - 1, 1);
    assert.equal(claude.endsWith('Keep this too.\n'), true);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test('installer rejects malformed managed markers before changing the target', () => {
  const target = mkdtempSync(path.join(os.tmpdir(), 'pixel-hop-workflow-'));
  try {
    writeFileSync(path.join(target, 'AGENTS.md'), '<!-- pixel-hop-sdd:start -->\nbroken\n');

    const install = spawnSync(process.execPath, ['scripts/install.mjs', target], { cwd: repository, encoding: 'utf8' });
    assert.equal(install.status, 1);
    assert.match(install.stderr, /invalid Pixel Hop SDD managed block markers in AGENTS\.md/);
    assert.equal(existsSync(path.join(target, '.sdd/settings')), false);
    assert.equal(readFileSync(path.join(target, 'AGENTS.md'), 'utf8'), '<!-- pixel-hop-sdd:start -->\nbroken\n');
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});
