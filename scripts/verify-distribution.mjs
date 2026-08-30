import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

const required = [
  '.sdd/settings/VERSION',
  '.sdd/settings/lifecycle.md',
  '.sdd/settings/schemas/spec.schema.json',
  '.sdd/settings/schemas/coverage.schema.json',
  '.sdd/settings/schemas/evidence.schema.json',
  '.sdd/settings/schemas/discovery.schema.json',
  '.sdd/settings/schemas/store-design-score.schema.json',
  '.sdd/settings/schemas/auto-sdd.schema.json',
  '.sdd/settings/schemas/release.schema.json',
  '.sdd/settings/schemas/research-source.schema.json',
  '.sdd/settings/schemas/assumption.schema.json',
  '.sdd/settings/schemas/metrics-snapshot.schema.json',
  '.sdd/settings/schemas/experiment.schema.json',
  '.sdd/settings/schemas/tasks.schema.json',
  '.sdd/settings/schemas/context-manifest.schema.json',
  '.sdd/settings/rules/auto-sdd.md',
  '.sdd/settings/rules/requirements-review.md',
  '.sdd/settings/rules/tasks-review.md',
  '.sdd/settings/workflows/auto-sdd.md',
  '.sdd/settings/workflows/spec-close.md',
  '.sdd/settings/workflows/validate-requirements.md',
  '.sdd/settings/workflows/validate-tasks.md',
  '.sdd/settings/templates/specs/auto-sdd.json',
  '.sdd/settings/rules/release-principles.md',
  '.sdd/settings/rules/release-readiness.md',
  '.sdd/settings/rules/release-marketing.md',
  '.sdd/settings/rules/release-assets.md',
  '.sdd/settings/rules/release-measurement-growth.md',
  '.sdd/settings/rules/release-launch.md',
  '.sdd/settings/workflows/release-init.md',
  '.sdd/settings/workflows/release-readiness.md',
  '.sdd/settings/workflows/release-marketing.md',
  '.sdd/settings/workflows/release-assets.md',
  '.sdd/settings/workflows/release-measurement.md',
  '.sdd/settings/workflows/release-launch.md',
  '.sdd/settings/workflows/release-monitor.md',
  '.sdd/settings/workflows/release-growth.md',
  '.sdd/settings/workflows/release-status.md',
  '.sdd/settings/templates/release/init.json',
  '.sdd/settings/templates/release/release-context.md',
  '.sdd/settings/templates/release/pre-release-checklist.md',
  '.sdd/settings/templates/release/marketing-plan.md',
  '.sdd/settings/templates/release/store-assets.md',
  '.sdd/settings/templates/release/measurement-plan.md',
  '.sdd/settings/templates/release/launch-plan.md',
  '.sdd/settings/templates/release/growth-plan.md',
  '.sdd/settings/rules/product-discovery.md',
  '.sdd/settings/rules/research-sources.md',
  '.sdd/settings/rules/discovery-brainstorm.md',
  '.sdd/settings/rules/discovery-market-validation.md',
  '.sdd/settings/rules/discovery-business-case.md',
  '.sdd/settings/rules/discovery-product-outline.md',
  '.sdd/settings/rules/store-design-readiness.md',
  '.sdd/settings/workflows/discovery-brainstorm.md',
  '.sdd/settings/workflows/discovery-validate.md',
  '.sdd/settings/workflows/discovery-business.md',
  '.sdd/settings/workflows/discovery-product.md',
  '.sdd/settings/workflows/discovery-decide.md',
  '.sdd/settings/workflows/discovery-status.md',
  '.sdd/settings/templates/discovery/init.json',
  '.sdd/settings/templates/discovery/constraints.md',
  '.sdd/settings/templates/discovery/brainstorm.md',
  '.sdd/settings/templates/discovery/market-validation.md',
  '.sdd/settings/templates/discovery/business-case.md',
  '.sdd/settings/templates/discovery/product-outline.md',
  '.sdd/settings/templates/discovery/decision.md',
  '.sdd/settings/templates/discovery/store-design-score.json',
  '.sdd/settings/templates/discovery/assumption.json',
  '.sdd/settings/templates/discovery/promotion-brief.md',
  '.sdd/settings/templates/shared/research-source.json',
  '.sdd/settings/templates/shared/context-manifest.json',
  '.sdd/settings/templates/specs/tasks.json',
  '.sdd/settings/workflows/_common.md',
  '.sdd/tools/sdd.mjs',
  '.sdd/tools/sdd.test.mjs',
  '.sdd/config.example.json',
  '.codex/skills/sdd/SKILL.md',
  '.claude/commands/sdd/spec-close.md',
];

for (const file of required) {
  if (!existsSync(path.join(root, file))) errors.push(`missing ${file}`);
}

const adapters = path.join(root, '.claude/commands/sdd');
if (!existsSync(adapters)) {
  errors.push('missing Claude adapters');
} else {
  for (const name of readdirSync(adapters).filter((file) => file.endsWith('.md'))) {
    const text = readFileSync(path.join(adapters, name), 'utf8');
    if (!text.includes(`.sdd/settings/workflows/${name}`)) errors.push(`adapter ${name} does not reference its canonical workflow`);
    if (!existsSync(path.join(root, '.sdd/settings/workflows', name))) errors.push(`adapter ${name} has no matching canonical workflow`);
  }
}

if (existsSync(adapters)) {
  const canonical = new Set(readdirSync(path.join(root, '.sdd/settings/workflows')).filter((file) => file.endsWith('.md') && file !== '_common.md'));
  const adapterNames = new Set(readdirSync(adapters).filter((file) => file.endsWith('.md')));
  for (const name of canonical) if (!adapterNames.has(name)) errors.push(`canonical workflow ${name} has no Claude adapter`);
  for (const name of adapterNames) if (!canonical.has(name)) errors.push(`Claude adapter ${name} has no canonical workflow`);
}

for (const file of [
  '.sdd/config.example.json',
  '.sdd/settings/schemas/spec.schema.json',
  '.sdd/settings/schemas/coverage.schema.json',
  '.sdd/settings/schemas/evidence.schema.json',
  '.sdd/settings/schemas/discovery.schema.json',
  '.sdd/settings/schemas/store-design-score.schema.json',
  '.sdd/settings/schemas/auto-sdd.schema.json',
  '.sdd/settings/schemas/release.schema.json',
  '.sdd/settings/schemas/research-source.schema.json',
  '.sdd/settings/schemas/assumption.schema.json',
  '.sdd/settings/schemas/metrics-snapshot.schema.json',
  '.sdd/settings/schemas/experiment.schema.json',
  '.sdd/settings/schemas/tasks.schema.json',
  '.sdd/settings/schemas/context-manifest.schema.json',
  '.sdd/settings/templates/discovery/init.json',
  '.sdd/settings/templates/discovery/store-design-score.json',
  '.sdd/settings/templates/discovery/assumption.json',
  '.sdd/settings/templates/specs/auto-sdd.json',
  '.sdd/settings/templates/release/init.json',
  '.sdd/settings/templates/shared/research-source.json',
  '.sdd/settings/templates/shared/context-manifest.json',
  '.sdd/settings/templates/specs/tasks.json',
  'package.json',
]) {
  try {
    JSON.parse(readFileSync(path.join(root, file), 'utf8'));
  } catch (error) {
    errors.push(`invalid JSON ${file}: ${error.message}`);
  }
}

const forbidden = ['AstroMap', 'useastromap', 'pixelhop.AstroMap'];
const scanRoots = ['.sdd/settings', '.sdd/tools', '.claude/commands/sdd', '.codex/skills/sdd'];
function scan(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.name === '.DS_Store') errors.push(`forbidden OS metadata: ${path.relative(root, file)}`);
    if (entry.isDirectory()) scan(file);
    else {
      const text = readFileSync(file, 'utf8');
      for (const token of forbidden) {
        if (text.includes(token)) errors.push(`${path.relative(root, file)} contains project-specific token ${token}`);
      }
    }
  }
}
for (const directory of scanRoots.map((value) => path.join(root, value)).filter(existsSync)) scan(directory);

if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log('distribution verified');
