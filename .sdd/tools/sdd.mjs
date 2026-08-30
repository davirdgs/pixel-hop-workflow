#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ARTIFACTS = ['requirements', 'design', 'tasks'];
const PHASES = new Set(['requirements', 'design', 'tasks', 'implementation', 'validation', 'complete', 'closed']);
const ARTIFACT_STATES = new Set(['missing', 'draft', 'review_required', 'approved', 'superseded']);
const IMPLEMENTATION_STATES = new Set(['not_started', 'in_progress', 'blocked', 'implemented', 'validated']);
const VALIDATION_STATES = new Set(['not_started', 'in_progress', 'passed', 'failed', 'partial']);
const CLOSE_REASONS = new Set(['obsolete', 'superseded', 'cancelled', 'duplicate', 'no-longer-needed']);
const DISCOVERY_PHASES = new Set(['brainstorm', 'market_validation', 'business_case', 'product_outline', 'decision', 'complete']);
const DISCOVERY_BRAINSTORM_STATES = new Set(['in_progress', 'selected']);
const DISCOVERY_MARKET_STATES = new Set(['not_started', 'in_progress', 'supports', 'mixed', 'contradicts']);
const DISCOVERY_BUSINESS_STATES = new Set(['not_started', 'in_progress', 'viable', 'conditional', 'unviable']);
const DISCOVERY_PRODUCT_STATES = new Set(['not_started', 'in_progress', 'ready', 'rework_required']);
const DISCOVERY_DECISION_STATES = new Set(['not_started', 'go', 'pivot', 'stop']);
const DISCOVERY_PROMOTION_STATES = new Set(['not_eligible', 'eligible', 'created']);
const RELEASE_PHASES = new Set(['readiness', 'go_to_market', 'assets', 'measurement', 'launch', 'observation', 'growth', 'complete']);
const RELEASE_READINESS_STATES = new Set(['not_started', 'in_progress', 'ready', 'blocked']);
const RELEASE_PLAN_STATES = new Set(['not_started', 'in_progress', 'ready', 'rework_required']);
const RELEASE_LAUNCH_STATES = new Set(['not_started', 'planned', 'approved', 'in_progress', 'launched', 'paused', 'rolled_back']);
const RELEASE_OBSERVATION_STATES = new Set(['not_started', 'in_progress', 'stable', 'alert', 'insufficient_data']);
const RELEASE_GROWTH_STATES = new Set(['not_started', 'in_progress', 'learning', 'scaling', 'paused', 'complete']);
const EVIDENCE_KINDS = new Set(['test', 'contract-test', 'build', 'lint', 'migration-dry-run', 'manual', 'review', 'environment-boundary']);
const EVIDENCE_STATES = new Set(['passed', 'failed', 'partial', 'not_run']);
const EVIDENCE_ROLES = new Set(['coordinator', 'executor', 'validator', 'fixer']);
const MODEL_CAPABILITY_RANK = new Map([['routine', 1], ['advanced', 2], ['frontier', 3]]);
const MODEL_RISK_FACTORS = new Set(['localized', 'cross-component', 'ambiguous', 'architecture', 'concurrency', 'security', 'privacy', 'auth', 'data-migration', 'destructive', 'commerce', 'production', 'broad-regression']);
const VALIDATION_RISK_FACTORS = new Set(['localized', 'single-wave', 'reversible', 'known-pattern', 'cross-component', 'multi-wave', 'ambiguous', 'architecture', 'external-dependency', 'cross-platform', 'security', 'privacy', 'auth', 'data-migration', 'destructive', 'commerce', 'production', 'broad-regression']);
const CRITICAL_VALIDATION_RISKS = new Set(['security', 'privacy', 'auth', 'data-migration', 'destructive', 'commerce', 'production']);
const RESEARCH_SOURCE_DIRECTIONS = new Set(['supports', 'contradicts', 'constrains', 'context']);
const RESEARCH_SOURCE_STRING_FIELDS = ['title', 'source_type', 'claim', 'note'];

export function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

export function sha256Value(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function parseRequirementIds(markdown) {
  const ids = [];
  let group = null;
  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^###\s+(?:(?:Requirement|Requisito)\s+)?(\d+)(?:\D|$)/i);
    if (heading) {
      group = heading[1];
      continue;
    }
    const explicitCriterion = line.match(/^(\d+)\.(\d+)\.?\s+/);
    if (explicitCriterion) {
      ids.push(`${explicitCriterion[1]}.${explicitCriterion[2]}`);
      continue;
    }
    const criterion = line.match(/^(\d+)\.\s+/);
    if (group && criterion) ids.push(`${group}.${criterion[1]}`);
  }
  return [...new Set(ids)];
}

export function parseTaskRequirementIds(markdown) {
  return [...new Set(
    [...markdown.matchAll(/_Requirements:\s*([^_]+)_/g)]
      .flatMap((match) => match[1].split(','))
      .map((value) => value.trim())
      .filter(Boolean),
  )];
}

export function taskProgress(markdown) {
  const actionable = markdown.split(/\r?\n/).flatMap((line) => {
    const subtask = line.match(/^- \[([ x])\]\*?\s+(\d+\.\d+)\s+/);
    const major = line.match(/^- \[([ x])\]\*?\s+(\d+)\.\s+/);
    const match = subtask ?? major;
    return match ? [{ id: match[2], done: match[1] === 'x' }] : [];
  });
  const leaf = actionable.filter((entry) => !actionable.some((candidate) => candidate.id.startsWith(`${entry.id}.`)));
  const done = leaf.filter((entry) => entry.done).length;
  return { done, total: leaf.length, pending: leaf.length - done };
}

export function parseTaskRecords(markdown) {
  const records = [];
  let current = null;
  for (const line of markdown.split(/\r?\n/)) {
    const task = line.match(/^- \[([ x])\](\*)?\s+(\d+(?:\.\d+)?)(?:\.)?\s+(?:(\(P\))\s+)?/);
    if (task) {
      current = { id: task[3], done: task[1] === 'x', optional: Boolean(task[2]), parallel: Boolean(task[4]) || /\(P\)\s*$/.test(line), dependencies: [], scopes: [] };
      records.push(current);
      continue;
    }
    if (!current) continue;
    const dependencies = line.match(/_Dependencies:\s*([^_]+)_/i);
    if (dependencies) current.dependencies = dependencies[1].trim().toLowerCase() === 'none' ? [] : dependencies[1].split(',').map((value) => value.trim()).filter(Boolean);
    const scopes = line.match(/_Write Scope:\s*([^_]+)_/i);
    if (scopes) current.scopes = scopes[1].split(',').map((value) => value.trim()).filter(Boolean);
  }
  return records.filter((entry) => !records.some((candidate) => candidate.id.startsWith(`${entry.id}.`)));
}

function loadTaskRecords(dir) {
  const ledger = path.join(dir, 'tasks.json');
  if (existsSync(ledger)) {
    const value = readJson(ledger);
    return (value.tasks ?? []).map((task) => ({
      id: task.id,
      done: task.status === 'complete',
      optional: task.optional === true,
      parallel: task.parallel === true,
      dependencies: task.dependencies ?? [],
      scopes: task.write_scope ?? [],
    }));
  }
  const markdown = path.join(dir, 'tasks.md');
  return existsSync(markdown) ? parseTaskRecords(readFileSync(markdown, 'utf8')) : [];
}

function taskProgressForDir(dir) {
  const records = loadTaskRecords(dir);
  return { done: records.filter((record) => record.done).length, total: records.length, pending: records.filter((record) => !record.done && !record.optional).length };
}

export function buildExecutionWaves(records, maxParallel = Number.POSITIVE_INFINITY) {
  const required = records.filter((record) => !record.done && !record.optional);
  const known = new Set(records.map((record) => record.id));
  const optional = new Set(records.filter((record) => record.optional && !record.done).map((record) => record.id));
  for (const record of required) {
    const missing = record.dependencies.filter((dependency) => !known.has(dependency));
    if (missing.length) throw new Error(`task ${record.id} has unknown dependencies ${missing.join(', ')}`);
    const optionalDependencies = record.dependencies.filter((dependency) => optional.has(dependency));
    if (optionalDependencies.length) throw new Error(`task ${record.id} depends on optional unfinished tasks ${optionalDependencies.join(', ')}`);
    if (record.scopes.length === 0) throw new Error(`task ${record.id} has no write scope`);
  }
  const completed = new Set(records.filter((record) => record.done).map((record) => record.id));
  const remaining = new Map(required.map((record) => [record.id, record]));
  const waves = [];
  while (remaining.size) {
    const ready = [...remaining.values()].filter((record) => record.dependencies.every((dependency) => completed.has(dependency)));
    if (!ready.length) throw new Error(`task dependency cycle or blocked dependency among ${[...remaining.keys()].join(', ')}`);
    const selected = [];
    for (const record of ready) {
      if (selected.length >= maxParallel) break;
      if (!record.parallel && selected.length > 0) continue;
      if (selected.length > 0 && selected.some((entry) => !entry.parallel)) continue;
      const conflicts = selected.some((entry) => entry.scopes.some((left) => record.scopes.some((right) => scopesOverlap(left, right))));
      if (!conflicts) selected.push(record);
      if (!record.parallel) break;
    }
    const id = `wave-${waves.length + 1}`;
    const taskIds = selected.map((record) => record.id);
    const dependencyWaves = [...new Set(selected.flatMap((record) => record.dependencies).map((dependency) => waves.find((wave) => wave.task_ids.includes(dependency))?.id).filter(Boolean))];
    waves.push({ id, task_ids: taskIds, depends_on: dependencyWaves });
    for (const record of selected) {
      remaining.delete(record.id);
      completed.add(record.id);
    }
  }
  return waves;
}

export function autoSddPlanHash(waves) {
  const plan = waves.map((wave) => ({
    id: wave.id,
    task_ids: wave.task_ids,
    depends_on: wave.depends_on,
    validation_batch: wave.validation_batch ?? null,
    model_requirements: wave.model_requirements,
  }));
  return createHash('sha256').update(JSON.stringify(plan)).digest('hex');
}

export function autoSddValidationPolicyHash(policy) {
  return createHash('sha256').update(JSON.stringify({
    profile: policy.profile,
    selected_at: policy.selected_at,
    rationale: policy.rationale,
    risk_factors: policy.risk_factors,
    artifact_review_mode: policy.artifact_review_mode,
    wave_validation_mode: policy.wave_validation_mode,
    final_validation_mode: policy.final_validation_mode,
  })).digest('hex');
}

export function scopesOverlap(left, right) {
  const normalize = (value) => value.replace(/^\.\//, '').replace(/\/+$/, '');
  const a = normalize(left);
  const b = normalize(right);
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function writeJsonAtomic(file, value) {
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, file);
}

function activeSpecDirs(root) {
  const specs = path.join(root, '.sdd/specs');
  if (!existsSync(specs)) return [];
  return readdirSync(specs, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'archive')
    .map((entry) => path.join(specs, entry.name));
}

function activeDiscoveryDirs(root) {
  const discoveries = path.join(root, '.sdd/discoveries');
  if (!existsSync(discoveries)) return [];
  return readdirSync(discoveries, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'archive')
    .map((entry) => path.join(discoveries, entry.name));
}

function activeReleaseDirs(root) {
  const releases = path.join(root, '.sdd/releases');
  if (!existsSync(releases)) return [];
  return readdirSync(releases, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'archive')
    .map((entry) => path.join(releases, entry.name));
}

function validateLifecycle(spec, label, errors) {
  if (spec.schema_version !== 2) {
    errors.push(`${label}: active specs must use schema_version 2`);
    return;
  }
  const lifecycle = spec.lifecycle;
  if (!lifecycle || !PHASES.has(lifecycle.phase)) {
    errors.push(`${label}: invalid or missing lifecycle.phase`);
    return;
  }
  for (const artifact of ARTIFACTS) {
    if (!ARTIFACT_STATES.has(lifecycle[artifact]?.status)) {
      errors.push(`${label}: invalid lifecycle.${artifact}.status`);
    }
    if (lifecycle[artifact]?.status === 'approved') {
      if (typeof lifecycle[artifact].approved_by !== 'string' || !lifecycle[artifact].approved_by.trim()) errors.push(`${label}: approved ${artifact} has no approved_by`);
      if (typeof lifecycle[artifact].approved_at !== 'string' || Number.isNaN(Date.parse(lifecycle[artifact].approved_at))) errors.push(`${label}: approved ${artifact} has no valid approved_at`);
      if (!/^[a-f0-9]{64}$/.test(lifecycle[artifact].content_hash ?? '')) errors.push(`${label}: approved ${artifact} has no valid content_hash`);
    }
  }
  if (!IMPLEMENTATION_STATES.has(lifecycle.implementation)) errors.push(`${label}: invalid lifecycle.implementation`);
  if (!VALIDATION_STATES.has(lifecycle.validation)) errors.push(`${label}: invalid lifecycle.validation`);
  const derived = deriveLifecyclePhase(lifecycle);
  if (lifecycle.phase !== 'closed' && derived !== lifecycle.phase) errors.push(`${label}: lifecycle.phase ${lifecycle.phase} disagrees with derived phase ${derived}`);
}

export function deriveLifecyclePhase(lifecycle) {
  if (lifecycle?.phase === 'closed') return 'closed';
  if (lifecycle?.requirements?.status !== 'approved') return 'requirements';
  if (lifecycle?.design?.status !== 'approved') return 'design';
  if (lifecycle?.tasks?.status !== 'approved') return 'tasks';
  if (lifecycle?.implementation !== 'validated') return ['implemented'].includes(lifecycle?.implementation) ? 'validation' : 'implementation';
  return lifecycle?.validation === 'passed' ? 'complete' : 'validation';
}

function lintSpec(root, dir, errors, warnings) {
  const label = path.basename(dir);
  const specFile = path.join(dir, 'spec.json');
  if (!existsSync(specFile)) {
    errors.push(`${label}: missing spec.json`);
    return;
  }
  let spec;
  try {
    spec = readJson(specFile);
  } catch (error) {
    errors.push(`${label}: invalid spec.json (${error.message})`);
    return;
  }
  validateLifecycle(spec, label, errors);
  if (spec.feature_name !== label || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(spec.feature_name ?? '')) errors.push(`${label}: feature_name must match its kebab-case directory`);
  if (Number.isNaN(Date.parse(spec.created_at)) || Number.isNaN(Date.parse(spec.updated_at)) || !Number.isInteger(spec.revision) || spec.revision < 1 || !Array.isArray(spec.context_profiles)) errors.push(`${label}: invalid spec identity, timestamps, revision, or context profiles`);
  for (const [index, entry] of (spec.gate_history ?? []).entries()) {
    const valid = ['requirements', 'design', 'tasks'].includes(entry?.gate)
      && ['go', 'no-go'].includes(entry?.decision)
      && ['manual', 'manual-override', 'delegated-auto-sdd'].includes(entry?.mode)
      && typeof entry?.actor === 'string' && entry.actor.trim()
      && !Number.isNaN(Date.parse(entry?.at))
      && /^[a-f0-9]{64}$/.test(entry?.content_hash ?? '')
      && (entry.mode !== 'manual-override' || (typeof entry.reason === 'string' && entry.reason.trim()));
    if (!valid) errors.push(`${label}: invalid spec gate history entry ${index + 1}`);
  }

  for (const profile of spec.context_profiles ?? []) {
    const config = readJson(path.join(root, '.sdd/config.json'));
    if (!config.context.profiles[profile]) errors.push(`${label}: unknown context profile ${profile}`);
  }

  if (spec.lifecycle?.phase === 'closed') {
    const closure = spec.closure;
    if (!closure || closure.status !== 'closed' || !CLOSE_REASONS.has(closure.reason) || typeof closure.closed_by !== 'string' || !closure.closed_by.trim() || Number.isNaN(Date.parse(closure.closed_at)) || !PHASES.has(closure.prior_phase) || closure.prior_phase === 'closed' || typeof closure.note !== 'string' || !closure.note.trim()) {
      errors.push(`${label}: closed spec lacks valid closure provenance`);
    }
    if (closure?.reason === 'superseded' && (typeof closure.superseded_by !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(closure.superseded_by))) {
      errors.push(`${label}: superseded closure requires superseded_by`);
    }
    if (spec.phase !== 'closed') errors.push(`${label}: closed lifecycle requires legacy phase closed`);
    if (spec.ready_for_implementation !== false) errors.push(`${label}: closed spec must not be ready for implementation`);
    if (loadClaims(root).claims.some((claim) => claim.feature === label)) errors.push(`${label}: closed spec still has active claims`);
    lintAutoSdd(root, dir, spec, label, errors);
    return;
  }
  if (spec.closure !== undefined) errors.push(`${label}: active spec cannot contain closure metadata`);

  for (const artifact of ARTIFACTS) {
    const file = path.join(dir, `${artifact}.md`);
    const state = spec.lifecycle?.[artifact];
    if (state?.status !== 'missing' && !existsSync(file)) errors.push(`${label}: ${artifact}.md missing for ${state.status}`);
    if (state?.status === 'approved') {
      if (!state.content_hash) errors.push(`${label}: approved ${artifact} has no content_hash`);
      else if (existsSync(file) && sha256(file) !== state.content_hash) errors.push(`${label}: approved ${artifact} hash is stale`);
    }
    const legacy = spec.approvals?.[artifact];
    if (legacy) {
      const generated = state?.status !== 'missing';
      const approved = state?.status === 'approved';
      if (legacy.generated !== generated) errors.push(`${label}: legacy approvals.${artifact}.generated disagrees with lifecycle`);
      if (legacy.approved !== approved) errors.push(`${label}: legacy approvals.${artifact}.approved disagrees with lifecycle`);
    }
  }

  const compatibleLegacyPhases = {
    requirements: new Set(['initialized', 'requirements-generated', 'requirements']),
    design: new Set(['design-generated', 'design']),
    tasks: new Set(['tasks-generated', 'tasks-approved', 'tasks']),
    implementation: new Set(['implementation-ready', 'implementation', 'implementing']),
    validation: new Set(['validation']),
    complete: new Set(['implementation-complete', 'complete']),
  };
  if (spec.phase && !compatibleLegacyPhases[spec.lifecycle?.phase]?.has(spec.phase)) {
    errors.push(`${label}: legacy phase ${spec.phase} disagrees with lifecycle.phase ${spec.lifecycle?.phase}`);
  }

  const tasksApproved = spec.lifecycle?.tasks?.status === 'approved';
  if (typeof spec.ready_for_implementation === 'boolean' && spec.ready_for_implementation !== tasksApproved) {
    errors.push(`${label}: ready_for_implementation disagrees with lifecycle.tasks`);
  }

  const requirementsFile = path.join(dir, 'requirements.md');
  const tasksFile = path.join(dir, 'tasks.md');
  if (existsSync(requirementsFile) && existsSync(tasksFile)) {
    const required = parseRequirementIds(readFileSync(requirementsFile, 'utf8'));
    const mapped = parseTaskRequirementIds(readFileSync(tasksFile, 'utf8'));
    const coverageFile = path.join(dir, 'coverage.json');
    const coverage = existsSync(coverageFile) ? readJson(coverageFile) : { exceptions: {} };
    const exceptions = Object.keys(coverage.exceptions ?? {});
    const validDispositions = new Set(['deferred', 'conditional', 'out_of_scope', 'cancelled', 'superseded']);
    for (const [id, disposition] of Object.entries(coverage.exceptions ?? {})) {
      if (!required.includes(id)) errors.push(`${label}: coverage exception references unknown requirement ${id}`);
      if (!validDispositions.has(disposition.status)) errors.push(`${label}: invalid coverage status for ${id}`);
      if (typeof disposition.rationale !== 'string' || disposition.rationale.length < 10) errors.push(`${label}: coverage rationale too short for ${id}`);
    }
    const missing = required.filter((id) => !mapped.includes(id) && !exceptions.includes(id));
    const invalid = mapped.filter((id) => !required.includes(id));
    if (missing.length) errors.push(`${label}: unmapped requirements ${missing.join(', ')}`);
    if (invalid.length) errors.push(`${label}: task mappings reference unknown requirements ${invalid.join(', ')}`);

    const progress = existsSync(path.join(dir, 'tasks.json')) ? taskProgressForDir(dir) : taskProgress(readFileSync(tasksFile, 'utf8'));
    if (spec.lifecycle?.implementation === 'implemented' && progress.pending > 0) {
      errors.push(`${label}: implementation is implemented with ${progress.pending} pending task(s)`);
    }
    if (spec.lifecycle?.phase === 'complete' && progress.pending > 0) {
      errors.push(`${label}: complete phase has pending tasks`);
    }
  }
  const taskLedger = path.join(dir, 'tasks.json');
  if (existsSync(taskLedger)) {
    try {
      const ledger = readJson(taskLedger);
      if (ledger.schema_version !== 1 || ledger.feature !== label || !Array.isArray(ledger.tasks)) errors.push(`${label}: invalid tasks.json envelope`);
      const ids = new Set();
      for (const task of ledger.tasks ?? []) {
        if (!/^[1-9][0-9]*(?:\.[1-9][0-9]*)?$/.test(task.id ?? '') || ids.has(task.id)) errors.push(`${label}: tasks.json has invalid or duplicate task id ${task.id}`);
        ids.add(task.id);
        if (!['pending', 'in_progress', 'blocked', 'complete', 'cancelled'].includes(task.status)) errors.push(`${label}: tasks.json task ${task.id} has invalid status`);
        if (!Array.isArray(task.dependencies) || !Array.isArray(task.write_scope) || task.write_scope.length === 0) errors.push(`${label}: tasks.json task ${task.id} has invalid dependencies/write_scope`);
      }
    } catch (error) {
      errors.push(`${label}: invalid tasks.json (${error.message})`);
    }
  }

  const validationState = spec.lifecycle?.validation;
  if (['passed', 'failed', 'partial'].includes(validationState)) {
    if (!existsSync(path.join(dir, 'validation.md'))) errors.push(`${label}: ${validationState} validation has no validation.md`);
    if (!existsSync(path.join(dir, 'evidence.jsonl'))) errors.push(`${label}: ${validationState} validation has no evidence.jsonl`);
  }
  if (spec.lifecycle?.implementation === 'validated' && validationState !== 'passed') {
    errors.push(`${label}: validated implementation requires passed validation`);
  }
  if (spec.lifecycle?.phase === 'complete' && validationState !== 'passed') {
    errors.push(`${label}: complete phase requires passed validation`);
  }

  const evidenceFile = path.join(dir, 'evidence.jsonl');
  if (existsSync(evidenceFile)) {
    for (const [index, line] of readFileSync(evidenceFile, 'utf8').split(/\r?\n/).entries()) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        if (event.feature !== label) errors.push(`${label}: evidence line ${index + 1} has wrong feature`);
        if (!EVIDENCE_KINDS.has(event.kind)) errors.push(`${label}: evidence line ${index + 1} has invalid kind`);
        if (!EVIDENCE_STATES.has(event.status)) errors.push(`${label}: evidence line ${index + 1} has invalid status`);
        if (event.wave !== undefined && !/^wave-[1-9][0-9]*$/.test(event.wave)) errors.push(`${label}: evidence line ${index + 1} has invalid wave`);
        if (event.attempt !== undefined && (!Number.isInteger(event.attempt) || event.attempt < 1)) errors.push(`${label}: evidence line ${index + 1} has invalid attempt`);
        if (event.role !== undefined && !EVIDENCE_ROLES.has(event.role)) errors.push(`${label}: evidence line ${index + 1} has invalid role`);
      } catch (error) {
        errors.push(`${label}: invalid evidence JSONL line ${index + 1} (${error.message})`);
      }
    }
  }

  if ((spec.task_contract_version ?? 1) < 2) {
    warnings.push(`${label}: legacy task metadata retained; add v2 execution metadata when tasks are regenerated`);
  }
  lintAutoSdd(root, dir, spec, label, errors);
}

function lintAutoSdd(root, dir, spec, label, errors) {
  const file = path.join(dir, 'auto-sdd.json');
  if (!existsSync(file)) return;
  let state;
  try {
    state = readJson(file);
  } catch (error) {
    errors.push(`${label}: invalid auto-sdd.json (${error.message})`);
    return;
  }
  if (state.schema_version !== 1 || state.mode !== 'auto-sdd') errors.push(`${label}: invalid auto-sdd schema or mode`);
  if (state.feature !== label) errors.push(`${label}: auto-sdd feature does not match directory`);
  if (Number.isNaN(Date.parse(state.started_at)) || Number.isNaN(Date.parse(state.updated_at)) || typeof state.initiated_by !== 'string' || !state.initiated_by.trim()) errors.push(`${label}: invalid auto-sdd identity or timestamps`);
  if (!Array.isArray(state.history)) errors.push(`${label}: auto-sdd history must be an array`);
  if (state.token_governance !== undefined) {
    const usage = state.token_governance;
    for (const field of ['input_tokens', 'cached_input_tokens', 'output_tokens']) if (!Number.isInteger(usage[field]) || usage[field] < 0) errors.push(`${label}: auto-sdd token governance has invalid ${field}`);
    if (!Number.isFinite(usage.estimated_cost) || usage.estimated_cost < 0) errors.push(`${label}: auto-sdd token governance has invalid estimated_cost`);
    if (usage.hard_budget !== null && Number.isFinite(usage.hard_budget) && usage.estimated_cost > usage.hard_budget && state.stage !== 'blocked') errors.push(`${label}: auto-sdd exceeded hard token budget without blocking`);
  }
  if (state.recoveries !== undefined) {
    if (!Array.isArray(state.recoveries)) {
      errors.push(`${label}: auto-sdd recoveries must be an array`);
    } else {
      for (const [index, recovery] of state.recoveries.entries()) {
        const validTarget = /^(?:wave-[1-9][0-9]*|final-validation)$/.test(recovery?.target ?? '');
        const validDecision = ['continue', 'recover'].includes(recovery?.decision);
        const validAttempts = Number.isInteger(recovery?.from_attempt) && recovery.from_attempt >= 0 && Number.isInteger(recovery?.to_attempt) && recovery.to_attempt >= 0;
        const validClaims = Array.isArray(recovery?.abandoned_claims) && recovery.abandoned_claims.every((claim) => /^[1-9][0-9]*(?:\.[1-9][0-9]*)?$/.test(claim?.task ?? '') && typeof claim?.agent === 'string' && claim.agent.trim() && (claim.attempt === null || (Number.isInteger(claim.attempt) && claim.attempt >= 1)));
        if (Number.isNaN(Date.parse(recovery?.at)) || typeof recovery?.actor !== 'string' || !recovery.actor.trim() || !validTarget || !validDecision || !validAttempts || typeof recovery?.reason !== 'string' || !recovery.reason.trim() || !validClaims) {
          errors.push(`${label}: auto-sdd recovery ${index + 1} is invalid`);
          continue;
        }
        if (recovery.decision === 'continue' && (recovery.to_attempt !== recovery.from_attempt || recovery.abandoned_claims.length !== 0)) errors.push(`${label}: continue recovery ${index + 1} cannot change attempt or abandon claims`);
        if (recovery.decision === 'recover' && recovery.to_attempt !== recovery.from_attempt + 1) errors.push(`${label}: recover recovery ${index + 1} must increment the attempt exactly once`);
      }
    }
  }
  const validStages = new Set(['requirements', 'design', 'tasks', 'awaiting_implementation_approval', 'implementation', 'validation', 'complete', 'blocked', 'closed']);
  if (!validStages.has(state.stage)) errors.push(`${label}: invalid auto-sdd stage`);
  if (spec.lifecycle?.phase === 'closed') {
    if (state.stage !== 'closed') errors.push(`${label}: closed spec requires closed auto-sdd stage`);
    if (state.implementation_gate?.status !== 'revoked') errors.push(`${label}: closed auto-sdd spec requires a revoked implementation gate`);
    return;
  }
  if (state.stage === 'closed') errors.push(`${label}: active spec cannot have closed auto-sdd stage`);
  for (const phase of ['requirements', 'design', 'tasks', 'implementation', 'validation']) {
    if (!Number.isInteger(state.correction_cycles?.[phase]) || state.correction_cycles[phase] < 0) errors.push(`${label}: invalid auto-sdd correction cycle for ${phase}`);
  }
  for (const artifact of ARTIFACTS) {
    const review = state.reviews?.[artifact];
    if (!review || !['pending', 'passed', 'failed'].includes(review.status) || !Number.isInteger(review.attempt) || review.attempt < 0) errors.push(`${label}: invalid auto-sdd review state for ${artifact}`);
  }
  for (const artifact of ARTIFACTS) {
    const recorded = state.artifact_hashes?.[artifact];
    if (recorded !== null && recorded !== undefined && !/^[a-f0-9]{64}$/.test(recorded)) errors.push(`${label}: invalid auto-sdd ${artifact} hash`);
    if (recorded && recorded !== spec.lifecycle?.[artifact]?.content_hash) errors.push(`${label}: auto-sdd ${artifact} hash is stale`);
    const review = state.reviews?.[artifact];
    if (review?.status === 'passed' && (!/^[a-f0-9]{64}$/.test(review.content_hash ?? '') || !review.reviewer || Number.isNaN(Date.parse(review.reviewed_at)))) errors.push(`${label}: passed auto-sdd ${artifact} review lacks hash-bound provenance`);
  }
  const waves = Array.isArray(state.waves) ? state.waves : [];
  if (!Array.isArray(state.waves)) errors.push(`${label}: auto-sdd waves must be an array`);
  const validationPolicy = state.validation_policy;
  let validationProfile = null;
  if (validationPolicy !== undefined) {
    const validProfiles = new Set(['pending', 'lean', 'standard', 'critical']);
    const validArtifactModes = new Set(['pending', 'hash-reuse-focused', 'sequential']);
    const validWaveModes = new Set(['pending', 'batched-independent', 'dependency-boundary', 'per-wave']);
    const validFinalModes = new Set(['pending', 'reuse-single-wave', 'incremental', 'full']);
    const risks = validationPolicy?.risk_factors;
    if (!validProfiles.has(validationPolicy?.profile)
      || !Array.isArray(risks)
      || risks.some((factor) => !VALIDATION_RISK_FACTORS.has(factor))
      || new Set(risks).size !== risks.length
      || !validArtifactModes.has(validationPolicy?.artifact_review_mode)
      || !validWaveModes.has(validationPolicy?.wave_validation_mode)
      || !validFinalModes.has(validationPolicy?.final_validation_mode)) {
      errors.push(`${label}: auto-sdd validation policy is invalid`);
    } else if (validationPolicy.profile !== 'pending') {
      validationProfile = validationPolicy.profile;
      if (Number.isNaN(Date.parse(validationPolicy.selected_at)) || typeof validationPolicy.rationale !== 'string' || !validationPolicy.rationale.trim()) {
        errors.push(`${label}: selected auto-sdd validation policy lacks provenance`);
      }
      const expectedModes = {
        lean: ['hash-reuse-focused', 'dependency-boundary', 'reuse-single-wave'],
        critical: ['sequential', 'per-wave', 'full'],
      };
      if (expectedModes[validationProfile]) {
        const actual = [validationPolicy.artifact_review_mode, validationPolicy.wave_validation_mode, validationPolicy.final_validation_mode];
        if (actual.some((value, index) => value !== expectedModes[validationProfile][index])) errors.push(`${label}: ${validationProfile} validation profile has incompatible modes`);
      }
      if (validationProfile === 'standard' && (validationPolicy.artifact_review_mode !== 'hash-reuse-focused'
        || !['batched-independent', 'dependency-boundary'].includes(validationPolicy.wave_validation_mode)
        || validationPolicy.final_validation_mode !== 'incremental')) {
        errors.push(`${label}: standard validation profile has incompatible modes`);
      }
      if (risks.some((factor) => CRITICAL_VALIDATION_RISKS.has(factor)) && validationProfile !== 'critical') {
        errors.push(`${label}: critical validation risks require the critical profile`);
      }
      if (validationProfile === 'lean') {
        const requiredLeanSignals = ['localized', 'single-wave', 'reversible', 'known-pattern'];
        if (requiredLeanSignals.some((factor) => !risks.includes(factor))
          || risks.some((factor) => ['cross-component', 'multi-wave', 'ambiguous', 'architecture', 'external-dependency', 'cross-platform', 'broad-regression'].includes(factor))) {
          errors.push(`${label}: lean validation profile requires localized reversible known-pattern single-wave work`);
        }
      }
      const policyHash = autoSddValidationPolicyHash(validationPolicy);
      if (state.validation_policy_hash !== policyHash) errors.push(`${label}: auto-sdd validation_policy_hash is stale`);
    }
    if (['awaiting_implementation_approval', 'implementation', 'validation', 'complete'].includes(state.stage) && !validationProfile) {
      errors.push(`${label}: auto-sdd implementation boundary requires a selected validation profile`);
    }
  }
  const modelPolicy = state.model_policy;
  const modelCatalog = new Map();
  if (modelPolicy !== undefined) {
    if (modelPolicy?.strategy !== 'lowest-adequate' || modelPolicy?.require_explicit_model !== true || modelPolicy?.on_no_adequate_model !== 'block') {
      errors.push(`${label}: auto-sdd model policy must require explicit lowest-adequate selection and block on missing capability`);
    }
    for (const entry of Array.isArray(modelPolicy?.catalog) ? modelPolicy.catalog : []) {
      if (typeof entry?.model !== 'string' || !entry.model.trim() || !MODEL_CAPABILITY_RANK.has(entry.capability) || !Number.isInteger(entry.cost_rank) || entry.cost_rank < 1) {
        errors.push(`${label}: auto-sdd model catalog has an invalid entry`);
        continue;
      }
      if (modelCatalog.has(entry.model)) errors.push(`${label}: auto-sdd model catalog repeats ${entry.model}`);
      modelCatalog.set(entry.model, entry);
    }
    if (['awaiting_implementation_approval', 'implementation', 'validation', 'complete'].includes(state.stage)) {
      if (typeof modelPolicy?.provider !== 'string' || !modelPolicy.provider.trim() || Number.isNaN(Date.parse(modelPolicy.cataloged_at)) || modelCatalog.size === 0) {
        errors.push(`${label}: auto-sdd implementation boundary requires a current provider model catalog`);
      }
    }
  }
  const planHash = autoSddPlanHash(waves);
  if (waves.length && state.plan_hash !== planHash) errors.push(`${label}: auto-sdd plan_hash is stale`);
  const tasksFile = path.join(dir, 'tasks.md');
  const taskRecords = loadTaskRecords(dir);
  const knownTasks = new Map(taskRecords.map((record) => [record.id, record]));
  const taskToWave = new Map(waves.flatMap((wave) => (wave.task_ids ?? []).map((taskId) => [taskId, wave.id])));
  const evidenceFile = path.join(dir, 'evidence.jsonl');
  const evidenceEvents = existsSync(evidenceFile) ? readFileSync(evidenceFile, 'utf8').split(/\r?\n/).flatMap((line) => {
    if (!line.trim()) return [];
    try { return [JSON.parse(line)]; } catch { return []; }
  }) : [];
  const seenWaves = new Set();
  const seenTasks = new Set();
  function lintModelRequirement(requirement, context) {
    const riskFactors = requirement?.risk_factors;
    if (!requirement || !MODEL_CAPABILITY_RANK.has(requirement.capability) || !Array.isArray(riskFactors) || riskFactors.some((factor) => !MODEL_RISK_FACTORS.has(factor)) || new Set(riskFactors).size !== riskFactors.length || typeof requirement.rationale !== 'string' || !requirement.rationale.trim()) {
      errors.push(`${label}: ${context} has an invalid model requirement`);
      return false;
    }
    if (modelCatalog.size > 0 && ![...modelCatalog.values()].some((entry) => MODEL_CAPABILITY_RANK.get(entry.capability) >= MODEL_CAPABILITY_RANK.get(requirement.capability))) {
      errors.push(`${label}: ${context} has no adequate model in the persisted catalog`);
      return false;
    }
    return true;
  }
  function lintModelAssignment(assignment, requirement, context) {
    if (!assignment || typeof assignment.agent !== 'string' || !assignment.agent.trim() || !['executor', 'fixer', 'validator'].includes(assignment.role) || typeof assignment.rationale !== 'string' || !assignment.rationale.trim()) {
      errors.push(`${label}: ${context} has an invalid explicit model assignment`);
      return;
    }
    const catalogEntry = modelCatalog.get(assignment.model);
    if (!catalogEntry || assignment.capability !== catalogEntry.capability || assignment.cost_rank !== catalogEntry.cost_rank) {
      errors.push(`${label}: ${context} model ${assignment.model} is not bound to the persisted catalog`);
      return;
    }
    const requiredRank = MODEL_CAPABILITY_RANK.get(requirement?.capability);
    if (!requiredRank || MODEL_CAPABILITY_RANK.get(catalogEntry.capability) < requiredRank) {
      errors.push(`${label}: ${context} model ${assignment.model} is below required capability ${requirement?.capability}`);
      return;
    }
    const adequate = [...modelCatalog.values()].filter((entry) => MODEL_CAPABILITY_RANK.get(entry.capability) >= requiredRank);
    const lowestCost = Math.min(...adequate.map((entry) => entry.cost_rank));
    if (catalogEntry.cost_rank !== lowestCost) errors.push(`${label}: ${context} model ${assignment.model} is not the lowest-cost adequate model`);
  }
  for (const wave of waves) {
    if (!/^wave-[1-9][0-9]*$/.test(wave.id ?? '') || seenWaves.has(wave.id)) errors.push(`${label}: invalid or duplicate auto-sdd wave id ${wave.id}`);
    for (const dependency of wave.depends_on ?? []) if (!seenWaves.has(dependency)) errors.push(`${label}: wave ${wave.id} has unknown or forward dependency ${dependency}`);
    if (wave.validation_batch !== undefined && wave.validation_batch !== null && !/^batch-[1-9][0-9]*$/.test(wave.validation_batch)) errors.push(`${label}: wave ${wave.id} has invalid validation_batch`);
    const records = [];
    if (!['pending', 'in_progress', 'failed', 'partial', 'validated'].includes(wave.status)) errors.push(`${label}: wave ${wave.id} has invalid status`);
    if (!Number.isInteger(wave.attempt) || wave.attempt < 0) errors.push(`${label}: wave ${wave.id} has invalid attempt`);
    for (const taskId of wave.task_ids ?? []) {
      if (!knownTasks.has(taskId)) errors.push(`${label}: wave ${wave.id} references unknown task ${taskId}`);
      if (seenTasks.has(taskId)) errors.push(`${label}: task ${taskId} appears in multiple waves`);
      seenTasks.add(taskId);
      if (knownTasks.has(taskId)) records.push(knownTasks.get(taskId));
    }
    for (const record of records) {
      if (record.scopes.length === 0) errors.push(`${label}: wave ${wave.id} task ${record.id} has no write scope`);
      for (const dependency of record.dependencies) {
        const dependencyWave = taskToWave.get(dependency);
        if (dependencyWave === wave.id) errors.push(`${label}: wave ${wave.id} co-schedules dependent tasks ${dependency} and ${record.id}`);
        if (dependencyWave && dependencyWave !== wave.id && !(wave.depends_on ?? []).includes(dependencyWave)) errors.push(`${label}: wave ${wave.id} omits dependency wave ${dependencyWave} for task ${record.id}`);
      }
    }
    if (records.length > 1) {
      if (records.some((record) => !record.parallel)) errors.push(`${label}: concurrent wave ${wave.id} contains a task without (P)`);
      for (let left = 0; left < records.length; left += 1) for (let right = left + 1; right < records.length; right += 1) {
        if (records[left].scopes.some((a) => records[right].scopes.some((b) => scopesOverlap(a, b)))) errors.push(`${label}: concurrent wave ${wave.id} has overlapping write scopes`);
      }
    }
    const executors = new Set(wave.executor_agents ?? []);
    const validators = new Set(wave.validator_agents ?? []);
    if (modelPolicy !== undefined) {
      const executorRequirement = wave.model_requirements?.executor;
      const validatorRequirement = wave.model_requirements?.validator;
      const validExecutorRequirement = lintModelRequirement(executorRequirement, `wave ${wave.id} executor`);
      const validValidatorRequirement = lintModelRequirement(validatorRequirement, `wave ${wave.id} validator`);
      if (validExecutorRequirement && validValidatorRequirement && MODEL_CAPABILITY_RANK.get(validatorRequirement.capability) < MODEL_CAPABILITY_RANK.get(executorRequirement.capability)) {
        errors.push(`${label}: wave ${wave.id} validator capability is below executor capability`);
      }
      const assignments = Array.isArray(wave.model_assignments) ? wave.model_assignments : [];
      if (!Array.isArray(wave.model_assignments)) errors.push(`${label}: wave ${wave.id} model_assignments must be an array`);
      const assignmentKeys = new Set();
      for (const assignment of assignments) {
        const key = `${assignment?.role}:${assignment?.agent}`;
        if (assignmentKeys.has(key)) errors.push(`${label}: wave ${wave.id} repeats model assignment ${key}`);
        assignmentKeys.add(key);
        const requirement = assignment?.role === 'validator' ? validatorRequirement : executorRequirement;
        lintModelAssignment(assignment, requirement, `wave ${wave.id} ${assignment?.role ?? 'unknown'} ${assignment?.agent ?? 'unknown'}`);
      }
      for (const executor of executors) {
        if (!assignments.some((assignment) => assignment.agent === executor && ['executor', 'fixer'].includes(assignment.role))) errors.push(`${label}: wave ${wave.id} executor ${executor} lacks an explicit model assignment`);
      }
      for (const validator of validators) {
        if (!assignments.some((assignment) => assignment.agent === validator && assignment.role === 'validator')) errors.push(`${label}: wave ${wave.id} validator ${validator} lacks an explicit model assignment`);
      }
    }
    for (const validator of validators) if (executors.has(validator)) errors.push(`${label}: wave ${wave.id} validator ${validator} also implemented the wave`);
    if (wave.status === 'validated' && executors.size === 0) errors.push(`${label}: validated wave ${wave.id} has no executor agents`);
    if (wave.status === 'validated' && validators.size === 0) errors.push(`${label}: validated wave ${wave.id} has no independent validator`);
    if (wave.status === 'validated') {
      for (const taskId of wave.task_ids ?? []) {
        if (!knownTasks.get(taskId)?.done) errors.push(`${label}: validated wave ${wave.id} has incomplete task ${taskId}`);
        if (!evidenceEvents.some((event) => event.wave === wave.id && event.attempt === wave.attempt && event.role === 'executor' && event.task === taskId && executors.has(event.agent) && event.status === 'passed')) errors.push(`${label}: validated wave ${wave.id} lacks current passed executor evidence for task ${taskId}`);
      }
      for (const executor of executors) if (!evidenceEvents.some((event) => event.wave === wave.id && event.attempt === wave.attempt && event.role === 'executor' && event.agent === executor && event.status === 'passed')) {
        errors.push(`${label}: validated wave ${wave.id} lacks passed executor evidence for ${executor}`);
      }
      for (const validator of validators) if (!evidenceEvents.some((event) => event.wave === wave.id && event.attempt === wave.attempt && event.role === 'validator' && event.agent === validator && event.kind === 'review' && event.status === 'passed')) {
        errors.push(`${label}: validated wave ${wave.id} lacks passed review evidence for ${validator}`);
      }
    }
    if (['in_progress', 'validated'].includes(wave.status)) for (const dependency of wave.depends_on ?? []) {
      const dependencyWave = waves.find((candidate) => candidate.id === dependency);
      if (dependencyWave?.status !== 'validated') errors.push(`${label}: wave ${wave.id} advanced before ${dependency} was validated`);
    }
    seenWaves.add(wave.id);
  }
  if (validationProfile === 'lean' && waves.length !== 1) errors.push(`${label}: lean validation profile requires exactly one wave`);
  const wavesById = new Map(waves.map((wave) => [wave.id, wave]));
  function waveDependsOn(wave, targetId, visited = new Set()) {
    if (!wave || visited.has(wave.id)) return false;
    visited.add(wave.id);
    return (wave.depends_on ?? []).some((dependency) => dependency === targetId || waveDependsOn(wavesById.get(dependency), targetId, visited));
  }
  for (const wave of waves.filter((entry) => entry.validation_batch)) {
    if (validationProfile !== 'standard' || validationPolicy?.wave_validation_mode !== 'batched-independent') {
      errors.push(`${label}: validation batches require the standard batched-independent profile`);
    }
    const peers = waves.filter((entry) => entry.id !== wave.id && entry.validation_batch === wave.validation_batch);
    if (peers.some((peer) => waveDependsOn(wave, peer.id) || waveDependsOn(peer, wave.id))) {
      errors.push(`${label}: validation batch ${wave.validation_batch} contains dependent waves`);
    }
  }
  const requiredTasks = taskRecords.filter((record) => !record.optional).map((record) => record.id);
  if (['awaiting_implementation_approval', 'implementation', 'validation', 'complete'].includes(state.stage)) {
    if (!waves.length) errors.push(`${label}: auto-sdd stage ${state.stage} requires a wave plan`);
    for (const taskId of requiredTasks) if (!seenTasks.has(taskId)) errors.push(`${label}: auto-sdd wave plan omits required task ${taskId}`);
    for (const artifact of ARTIFACTS) {
      if (spec.lifecycle?.[artifact]?.status !== 'approved') errors.push(`${label}: auto-sdd implementation boundary requires approved ${artifact}`);
      if (!state.artifact_hashes?.[artifact] || state.artifact_hashes[artifact] !== spec.lifecycle?.[artifact]?.content_hash) errors.push(`${label}: auto-sdd implementation boundary has unbound ${artifact} hash`);
      if (!spec.lifecycle?.[artifact]?.approved_by || !spec.lifecycle?.[artifact]?.approved_at) errors.push(`${label}: auto-sdd approved ${artifact} lacks approval provenance`);
      if (state.reviews?.[artifact]?.status !== 'passed' || state.reviews[artifact].content_hash !== spec.lifecycle?.[artifact]?.content_hash) errors.push(`${label}: auto-sdd implementation boundary lacks current passed ${artifact} review`);
    }
  }
  const gate = state.implementation_gate ?? {};
  if (!['pending', 'approved', 'revoked'].includes(gate.status)) errors.push(`${label}: auto-sdd implementation gate has invalid status`);
  if (gate.status === 'pending' && spec.lifecycle?.implementation !== 'not_started') errors.push(`${label}: auto-sdd implementation started before manual gate approval`);
  if (['implementation', 'validation', 'complete'].includes(state.stage) && gate.status !== 'approved') errors.push(`${label}: auto-sdd stage ${state.stage} requires approved implementation gate`);
  if (gate.status === 'approved') {
    if (!gate.approved_by || !gate.approved_at) errors.push(`${label}: approved auto-sdd gate lacks human approval metadata`);
    if (typeof gate.approved_by === 'string' && /^(?:delegated-)?auto-sdd:/i.test(gate.approved_by)) errors.push(`${label}: auto-sdd implementation gate cannot be self-approved`);
    if (Number.isNaN(Date.parse(gate.approved_at))) errors.push(`${label}: approved auto-sdd gate has invalid timestamp`);
    if (gate.spec_revision !== spec.revision || gate.requirements_hash !== spec.lifecycle?.requirements?.content_hash || gate.design_hash !== spec.lifecycle?.design?.content_hash || gate.tasks_hash !== spec.lifecycle?.tasks?.content_hash || gate.plan_hash !== state.plan_hash
      || (validationPolicy !== undefined && gate.validation_policy_hash !== state.validation_policy_hash)) {
      errors.push(`${label}: approved auto-sdd gate is stale`);
    }
  }
  const finalValidation = state.final_validation ?? {};
  if (!['pending', 'passed', 'failed', 'partial'].includes(finalValidation.status) || !Number.isInteger(finalValidation.attempt) || finalValidation.attempt < 0) errors.push(`${label}: invalid auto-sdd final validation state`);
  if (modelPolicy !== undefined) {
    const requirementPending = finalValidation.model_requirement?.capability === 'pending' && !validationProfile && ['requirements', 'design', 'tasks'].includes(state.stage);
    const validFinalRequirement = requirementPending ? false : lintModelRequirement(finalValidation.model_requirement, 'final validation');
    const minimumFinalCapability = validationProfile && validationProfile !== 'critical' ? 'advanced' : 'frontier';
    if (validFinalRequirement && MODEL_CAPABILITY_RANK.get(finalValidation.model_requirement.capability) < MODEL_CAPABILITY_RANK.get(minimumFinalCapability)) errors.push(`${label}: auto-sdd ${validationProfile ?? 'legacy'} final validation requires at least ${minimumFinalCapability} capability`);
    if (finalValidation.agent) {
      if (!finalValidation.model_assignment || finalValidation.model_assignment.agent !== finalValidation.agent || finalValidation.model_assignment.role !== 'validator') {
        errors.push(`${label}: auto-sdd final validator ${finalValidation.agent} lacks a matching explicit model assignment`);
      } else {
        lintModelAssignment(finalValidation.model_assignment, finalValidation.model_requirement, `final validator ${finalValidation.agent}`);
      }
    }
  }
  if (root) {
    const maxParallel = readJson(path.join(root, '.sdd/config.json')).auto_sdd?.max_parallel_executors;
    if (Number.isInteger(maxParallel) && waves.some((wave) => (wave.task_ids?.length ?? 0) > maxParallel)) errors.push(`${label}: auto-sdd wave exceeds configured max_parallel_executors`);
    const activeClaims = loadClaims(root).claims;
    for (const wave of waves.filter((entry) => entry.status === 'validated')) for (const taskId of wave.task_ids ?? []) {
      if (activeClaims.some((claim) => claim.feature === label && claim.task === taskId)) errors.push(`${label}: validated wave ${wave.id} still has active claim for ${taskId}`);
    }
  }
  if (state.stage === 'complete') {
    if (waves.some((wave) => wave.status !== 'validated') || spec.lifecycle?.phase !== 'complete') errors.push(`${label}: completed auto-sdd run requires all waves and spec complete`);
    const final = state.final_validation ?? {};
    const priorAgents = new Set(waves.flatMap((wave) => [...(wave.executor_agents ?? []), ...(wave.validator_agents ?? [])]));
    const reuseSingleWave = validationProfile === 'lean' && final.mode === 'reuse-single-wave';
    if (reuseSingleWave) {
      const wave = waves[0];
      if (final.status !== 'passed' || !final.agent || final.reused_wave !== wave?.id || !(wave?.validator_agents ?? []).includes(final.agent) || (wave?.executor_agents ?? []).includes(final.agent)
        || typeof final.scope_summary !== 'string' || !final.scope_summary.trim()) {
        errors.push(`${label}: lean completion requires the independent single-wave validator to cover final validation`);
      }
    } else if (final.status !== 'passed' || !final.agent || priorAgents.has(final.agent)) {
      errors.push(`${label}: completed auto-sdd run requires a fresh independent final validator`);
    }
    if (validationProfile && final.mode !== validationPolicy.final_validation_mode) errors.push(`${label}: final validation mode does not match the selected profile`);
    if (!evidenceEvents.some((event) => event.task === 'final-validation' && event.attempt === final.attempt && event.role === 'validator' && event.agent === final.agent && event.kind === 'review' && event.status === 'passed')) errors.push(`${label}: completed auto-sdd run lacks current final review evidence`);
  }
}

export function validateAutoSddDirectory(dir) {
  const errors = [];
  const spec = readJson(path.join(dir, 'spec.json'));
  lintAutoSdd(null, dir, spec, path.basename(dir), errors);
  return errors;
}

export function validateResearchSource(source) {
  const errors = [];
  if (!source || typeof source !== 'object' || Array.isArray(source)) return ['must be a JSON object'];
  if (Object.hasOwn(source, 'accessed_at') && !Object.hasOwn(source, 'captured_at')) {
    errors.push('uses accessed_at; rename it to captured_at');
  }
  if (typeof source.captured_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(source.captured_at) || Number.isNaN(Date.parse(source.captured_at))) {
    errors.push('has invalid captured_at');
  }
  if (!source.evidence_type || source.evidence_type === 'web') {
    let parsedUrl;
    try {
      parsedUrl = new URL(source.url);
    } catch {
      parsedUrl = null;
    }
    if (!parsedUrl || !['http:', 'https:'].includes(parsedUrl.protocol)) errors.push('has invalid url');
  } else if (!['interview', 'observation', 'usability-test', 'survey', 'analytics', 'support', 'experiment', 'repository', 'document'].includes(source.evidence_type)) {
    errors.push('has invalid evidence_type');
  }
  const missing = RESEARCH_SOURCE_STRING_FIELDS.filter((field) => typeof source[field] !== 'string' || !source[field].trim());
  if (missing.length) errors.push(`is missing required fields: ${missing.join(', ')}`);
  if (!RESEARCH_SOURCE_DIRECTIONS.has(source.direction)) {
    errors.push(`has invalid direction; expected one of ${[...RESEARCH_SOURCE_DIRECTIONS].join(', ')}`);
  }
  return errors;
}

function lintResearchSources(dir, label, requireEvidence, requiredMessage, emptyMessage, errors) {
  const file = path.join(dir, 'research-sources.jsonl');
  if (!existsSync(file)) {
    if (requireEvidence) errors.push(`${label}: ${requiredMessage}`);
    return;
  }
  let records = 0;
  for (const [index, line] of readFileSync(file, 'utf8').split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    records += 1;
    try {
      const source = JSON.parse(line);
      const recordErrors = validateResearchSource(source);
      if (recordErrors.length) errors.push(`${label}: source line ${index + 1} ${recordErrors.join('; ')}`);
    } catch (error) {
      errors.push(`${label}: invalid source JSONL line ${index + 1} (${error.message})`);
    }
  }
  if (requireEvidence && records === 0) errors.push(`${label}: ${emptyMessage}`);
}

const STORE_SCORE_CRITERIA = new Map([
  ['distinct_user_value', 25],
  ['functional_depth', 20],
  ['original_identity', 15],
  ['mobile_quality', 15],
  ['honest_presentation', 10],
  ['sustainable_experience', 10],
  ['platform_policy_fit', 5],
]);
const STORE_SCORE_VERDICTS = new Set(['strong', 'conditional', 'high_risk', 'stop']);
const STORE_RISK_LEVELS = new Set(['low', 'medium', 'high', 'unknown', 'not_applicable']);
const APPLE_SPAM_RISKS = new Set(['low', 'medium', 'high', 'unknown']);
const APPLE_STRONG_DIFFERENCE_AXES = new Set(['core_mechanic', 'user_outcome', 'exclusive_or_proprietary_data', 'unique_integration', 'recurring_workflow']);
const APPLE_SUPPORTING_DIFFERENCE_AXES = new Set(['business_model', 'trust_or_privacy_model', 'accessibility', 'operational_model']);
const APPLE_WEAK_DIFFERENCE_AXES = new Set(['audience_niche', 'cosmetic_ui', 'branding', 'language', 'content_volume', 'generic_ai', 'peripheral_feature']);

function expectedStoreVerdict(score) {
  if (score >= 80) return 'strong';
  if (score >= 65) return 'conditional';
  if (score >= 50) return 'high_risk';
  return 'stop';
}

function lintAppleSpamAssessment(scorecard, targets, criteria, label, errors) {
  if (!Object.hasOwn(scorecard, 'apple_spam_assessment')) return;
  const targeted = Array.isArray(targets) && targets.includes('ios');
  const assessment = scorecard.apple_spam_assessment;
  if (!targeted) {
    if (assessment !== null) errors.push(`${label}: non-target Apple spam assessment must be null`);
    return;
  }
  if (!assessment || typeof assessment !== 'object') {
    errors.push(`${label}: Apple target requires a structured apple_spam_assessment when the field is present`);
    return;
  }
  if (assessment.assessment_version !== 1) errors.push(`${label}: Apple spam assessment_version must be 1`);
  if (!['low', 'medium', 'high'].includes(assessment.confidence)) errors.push(`${label}: Apple spam assessment has invalid confidence`);
  if (typeof assessment.residual_subjectivity !== 'string' || !assessment.residual_subjectivity.trim()) errors.push(`${label}: Apple spam assessment requires residual_subjectivity`);

  const trackA = assessment.track_4_3_a;
  if (!trackA || typeof trackA !== 'object') {
    errors.push(`${label}: Apple spam assessment missing track_4_3_a`);
  } else {
    if (!APPLE_SPAM_RISKS.has(trackA.risk)) errors.push(`${label}: Apple 4.3(a) assessment has invalid risk`);
    if (!['original', 'licensed_template', 'shared_codebase', 'unknown'].includes(trackA.code_asset_provenance)) errors.push(`${label}: Apple 4.3(a) assessment has invalid code_asset_provenance`);
    if (typeof trackA.near_duplicate_portfolio !== 'boolean') errors.push(`${label}: Apple 4.3(a) assessment requires near_duplicate_portfolio`);
    if (typeof trackA.rationale !== 'string' || !trackA.rationale.trim()) errors.push(`${label}: Apple 4.3(a) assessment requires rationale`);
    if (!Array.isArray(trackA.evidence_refs)) errors.push(`${label}: Apple 4.3(a) assessment requires evidence_refs`);
  }

  const trackB = assessment.track_4_3_b;
  if (!trackB || typeof trackB !== 'object') {
    errors.push(`${label}: Apple spam assessment missing track_4_3_b`);
    return;
  }
  if (!APPLE_SPAM_RISKS.has(trackB.risk)) errors.push(`${label}: Apple 4.3(b) assessment has invalid risk`);
  for (const field of ['likely_category', 'comparison_scope', 'adversarial_rejection_case', 'reviewer_case']) {
    if (typeof trackB[field] !== 'string' || !trackB[field].trim()) errors.push(`${label}: Apple 4.3(b) assessment requires ${field}`);
  }
  if (typeof trackB.explicitly_established_category !== 'boolean') errors.push(`${label}: Apple 4.3(b) assessment requires explicitly_established_category`);
  if (!Number.isInteger(trackB.closest_comparator_count) || trackB.closest_comparator_count < 0) errors.push(`${label}: Apple 4.3(b) assessment has invalid closest_comparator_count`);
  if (typeof trackB.market_has_fewer_comparators !== 'boolean') errors.push(`${label}: Apple 4.3(b) assessment requires market_has_fewer_comparators`);
  if (!['low', 'medium', 'high', 'unknown'].includes(trackB.core_loop_overlap)) errors.push(`${label}: Apple 4.3(b) assessment has invalid core_loop_overlap`);
  if (!['immediately', 'before_first_value', 'after_first_value', 'buried', 'absent', 'unknown'].includes(trackB.first_value_visibility)) errors.push(`${label}: Apple 4.3(b) assessment has invalid first_value_visibility`);
  if (!['concept_only', 'prototype', 'implemented', 'implemented_and_user_validated', 'unknown'].includes(trackB.proof_level)) errors.push(`${label}: Apple 4.3(b) assessment has invalid proof_level`);
  if (!Array.isArray(trackB.evidence_refs)) errors.push(`${label}: Apple 4.3(b) assessment requires evidence_refs`);

  const axisGroups = [
    ['strong_difference_axes', APPLE_STRONG_DIFFERENCE_AXES],
    ['supporting_difference_axes', APPLE_SUPPORTING_DIFFERENCE_AXES],
    ['weak_difference_axes', APPLE_WEAK_DIFFERENCE_AXES],
  ];
  const allAxes = new Set();
  for (const [field, allowed] of axisGroups) {
    if (!Array.isArray(trackB[field])) {
      errors.push(`${label}: Apple 4.3(b) assessment requires ${field}`);
      continue;
    }
    for (const axis of trackB[field]) {
      if (!allowed.has(axis)) errors.push(`${label}: Apple 4.3(b) assessment misclassifies ${axis} in ${field}`);
      if (allAxes.has(axis)) errors.push(`${label}: Apple 4.3(b) difference axis ${axis} is duplicated across classifications`);
      allAxes.add(axis);
    }
  }

  const strongAxes = Array.isArray(trackB.strong_difference_axes) ? trackB.strong_difference_axes : [];
  const lowEvidence = trackB.closest_comparator_count < 3 && trackB.market_has_fewer_comparators !== true;
  const visibleByFirstValue = ['immediately', 'before_first_value'].includes(trackB.first_value_visibility);
  const demonstrable = ['prototype', 'implemented', 'implemented_and_user_validated'].includes(trackB.proof_level);
  if (trackB.risk === 'low' && (lowEvidence || strongAxes.length === 0 || !visibleByFirstValue || !demonstrable || ['high', 'unknown'].includes(trackB.core_loop_overlap))) {
    errors.push(`${label}: low Apple 4.3(b) risk requires comparator coverage, a strong difference, first-value visibility, demonstrable proof, and non-high core-loop overlap`);
  }
  const objectivelyHigh = (trackB.explicitly_established_category === true && (strongAxes.length === 0 || ['buried', 'absent'].includes(trackB.first_value_visibility)))
    || (trackB.core_loop_overlap === 'high' && strongAxes.length === 0);
  if (objectivelyHigh && trackB.risk !== 'high') errors.push(`${label}: Apple 4.3(b) risk must be high for an established/substitutable category without a visible strong difference`);

  if (scorecard.apple?.policy_risks?.apple_4_3_b !== trackB.risk) errors.push(`${label}: Apple 4.3(b) detailed and summary risks must match`);
  const riskOrder = ['low', 'medium', 'unknown', 'high'];
  const worstRisk = [trackA?.risk, trackB.risk].filter((risk) => APPLE_SPAM_RISKS.has(risk)).sort((a, b) => riskOrder.indexOf(b) - riskOrder.indexOf(a))[0];
  const scoreCap = { low: 5, medium: 3, unknown: 2, high: 1 }[worstRisk];
  const policyFit = criteria.find((criterion) => criterion?.id === 'platform_policy_fit')?.apple_score;
  if (Number.isInteger(scoreCap) && Number.isInteger(policyFit) && policyFit > scoreCap) errors.push(`${label}: Apple platform_policy_fit exceeds the ${scoreCap} cap for ${worstRisk} spam risk`);
  if ([trackA?.risk, trackB.risk].includes('high') && (!Array.isArray(scorecard.apple?.hard_flags) || scorecard.apple.hard_flags.length === 0)) {
    errors.push(`${label}: high Apple 4.3(a) or 4.3(b) risk requires an Apple hard flag`);
  }
}

function lintStoreDesignScore(dir, label, required, errors) {
  const file = path.join(dir, 'store-design-score.json');
  if (!existsSync(file)) {
    if (required) errors.push(`${label}: completed market validation requires store-design-score.json`);
    return null;
  }

  let scorecard;
  try {
    scorecard = readJson(file);
  } catch (error) {
    errors.push(`${label}: invalid store-design-score.json (${error.message})`);
    return null;
  }

  if (scorecard.schema_version !== 1) errors.push(`${label}: store design score schema_version must be 1`);
  for (const field of ['assessed_at', 'policy_checked_at']) {
    if (typeof scorecard[field] !== 'string' || Number.isNaN(Date.parse(scorecard[field]))) {
      errors.push(`${label}: store design score has invalid ${field}`);
    }
  }

  const targets = scorecard.target_platforms;
  if (!Array.isArray(targets) || targets.length === 0 || new Set(targets).size !== targets.length || targets.some((value) => !['ios', 'android'].includes(value))) {
    errors.push(`${label}: store design score target_platforms must contain unique ios/android values`);
  }

  const criteria = Array.isArray(scorecard.criteria) ? scorecard.criteria : [];
  const seen = new Set();
  for (const criterion of criteria) {
    if (!criterion || !STORE_SCORE_CRITERIA.has(criterion.id) || seen.has(criterion.id)) {
      errors.push(`${label}: store design score has invalid or duplicate criterion`);
      continue;
    }
    seen.add(criterion.id);
    if (criterion.weight !== STORE_SCORE_CRITERIA.get(criterion.id)) {
      errors.push(`${label}: store design criterion ${criterion.id} has invalid weight`);
    }
    if (typeof criterion.rationale !== 'string' || !criterion.rationale.trim()) {
      errors.push(`${label}: store design criterion ${criterion.id} requires rationale`);
    }
    if (!Array.isArray(criterion.evidence_refs)) {
      errors.push(`${label}: store design criterion ${criterion.id} requires evidence_refs`);
    }
  }
  for (const id of STORE_SCORE_CRITERIA.keys()) {
    if (!seen.has(id)) errors.push(`${label}: store design score missing criterion ${id}`);
  }

  lintAppleSpamAssessment(scorecard, targets, criteria, label, errors);

  const platformScores = [];
  for (const [platform, targetName, field] of [['apple', 'ios', 'apple_score'], ['google', 'android', 'google_score']]) {
    const targeted = Array.isArray(targets) && targets.includes(targetName);
    const summary = scorecard[platform];
    if (!summary || typeof summary !== 'object') {
      errors.push(`${label}: store design score missing ${platform} summary`);
      continue;
    }
    if (summary.applicable !== targeted) errors.push(`${label}: ${platform} applicability must match target_platforms`);
    if (!Array.isArray(summary.hard_flags)) errors.push(`${label}: ${platform} hard_flags must be an array`);
    const risks = summary.policy_risks;
    for (const risk of ['apple_4_3_b', 'repetitive_content', 'minimum_functionality']) {
      if (!risks || !STORE_RISK_LEVELS.has(risks[risk])) errors.push(`${label}: ${platform} has invalid ${risk} risk`);
    }
    if (platform === 'google' && risks?.apple_4_3_b !== 'not_applicable') {
      errors.push(`${label}: Apple 4.3(b) must be not_applicable for Google`);
    }
    if (!targeted) {
      if (summary.score !== null || summary.verdict !== 'not_applicable') {
        errors.push(`${label}: non-target ${platform} score must be null/not_applicable`);
      }
      for (const criterion of criteria) {
        if (criterion?.[field] !== null) errors.push(`${label}: non-target ${platform} criterion scores must be null`);
      }
      continue;
    }
    if (platform === 'apple' && risks?.apple_4_3_b === 'not_applicable') {
      errors.push(`${label}: Apple target requires an Apple 4.3(b) risk assessment`);
    }
    let calculated = 0;
    let complete = criteria.length === STORE_SCORE_CRITERIA.size;
    for (const criterion of criteria) {
      const value = criterion?.[field];
      if (!Number.isInteger(value) || value < 0 || value > 5) {
        errors.push(`${label}: targeted ${platform} criterion ${criterion?.id ?? 'unknown'} must score 0-5`);
        complete = false;
      } else if (STORE_SCORE_CRITERIA.has(criterion.id)) {
        calculated += STORE_SCORE_CRITERIA.get(criterion.id) * value / 5;
      }
    }
    calculated = Math.round(calculated);
    if (!Number.isInteger(summary.score) || summary.score < 0 || summary.score > 100) {
      errors.push(`${label}: ${platform} score must be 0-100`);
    } else if (complete && summary.score !== calculated) {
      errors.push(`${label}: ${platform} score ${summary.score} does not match calculated ${calculated}`);
    }
    if (!STORE_SCORE_VERDICTS.has(summary.verdict) || (Number.isInteger(summary.score) && summary.verdict !== expectedStoreVerdict(summary.score))) {
      errors.push(`${label}: ${platform} verdict does not match score`);
    }
    if (Number.isInteger(summary.score)) platformScores.push(summary.score);
  }

  const overall = scorecard.overall;
  if (!overall || typeof overall !== 'object') {
    errors.push(`${label}: store design score missing overall summary`);
  } else {
    const expected = platformScores.length ? Math.min(...platformScores) : null;
    if (!Number.isInteger(overall.score) || overall.score < 0 || overall.score > 100 || (expected !== null && overall.score !== expected)) {
      errors.push(`${label}: overall store design score must equal the lower targeted-platform score`);
    }
    if (!STORE_SCORE_VERDICTS.has(overall.verdict) || (Number.isInteger(overall.score) && overall.verdict !== expectedStoreVerdict(overall.score))) {
      errors.push(`${label}: overall store design verdict does not match score`);
    }
    if (typeof overall.hard_stop !== 'boolean') errors.push(`${label}: overall store design hard_stop must be boolean`);
    if (typeof overall.rationale !== 'string' || !overall.rationale.trim()) errors.push(`${label}: overall store design score requires rationale`);
    const hasFlags = ['apple', 'google'].some((platform) => Array.isArray(scorecard[platform]?.hard_flags) && scorecard[platform].hard_flags.length > 0);
    if (typeof overall.hard_stop === 'boolean' && overall.hard_stop !== hasFlags) {
      errors.push(`${label}: overall hard_stop must reflect platform hard_flags`);
    }
  }

  return scorecard;
}

function lintDiscovery(dir, errors) {
  const label = path.basename(dir);
  const metadataFile = path.join(dir, 'discovery.json');
  if (!existsSync(metadataFile)) {
    errors.push(`${label}: missing discovery.json`);
    return;
  }
  let discovery;
  try {
    discovery = readJson(metadataFile);
  } catch (error) {
    errors.push(`${label}: invalid discovery.json (${error.message})`);
    return;
  }
  if (discovery.schema_version !== 1) errors.push(`${label}: discovery schema_version must be 1`);
  if (discovery.profile !== undefined && discovery.profile !== 'single-mobile-indie') errors.push(`${label}: unsupported discovery profile ${discovery.profile}`);
  if (discovery.evidence_mode !== undefined && !['desk_only', 'primary', 'mixed', 'not_assessed'].includes(discovery.evidence_mode)) errors.push(`${label}: invalid discovery evidence_mode`);
  if (discovery.discovery_name !== label || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(discovery.discovery_name ?? '')) {
    errors.push(`${label}: discovery_name must match its kebab-case directory`);
  }
  if (!Number.isInteger(discovery.iteration) || discovery.iteration < 1) errors.push(`${label}: iteration must be a positive integer`);
  const lifecycle = discovery.lifecycle ?? {};
  if (!DISCOVERY_PHASES.has(lifecycle.phase)) errors.push(`${label}: invalid discovery lifecycle.phase`);
  if (!DISCOVERY_BRAINSTORM_STATES.has(lifecycle.brainstorm)) errors.push(`${label}: invalid discovery lifecycle.brainstorm`);
  if (!DISCOVERY_MARKET_STATES.has(lifecycle.market_validation)) errors.push(`${label}: invalid discovery lifecycle.market_validation`);
  if (!DISCOVERY_BUSINESS_STATES.has(lifecycle.business_case)) errors.push(`${label}: invalid discovery lifecycle.business_case`);
  if (!DISCOVERY_PRODUCT_STATES.has(lifecycle.product_outline)) errors.push(`${label}: invalid discovery lifecycle.product_outline`);
  if (!DISCOVERY_DECISION_STATES.has(lifecycle.decision)) errors.push(`${label}: invalid discovery lifecycle.decision`);
  if (!DISCOVERY_PROMOTION_STATES.has(lifecycle.promotion)) errors.push(`${label}: invalid discovery lifecycle.promotion`);
  for (const [index, entry] of (discovery.gate_history ?? []).entries()) {
    if (!['market_validation', 'business_case', 'product_outline', 'decision'].includes(entry?.gate) || !validManualOverride(entry, entry?.gate, entry?.decision)) errors.push(`${label}: invalid manual gate override ${index + 1}`);
  }
  const manualGo = (gate) => (discovery.gate_history ?? []).some((entry) => validManualOverride(entry, gate));

  for (const artifact of ['constraints.md', 'brainstorm.md']) {
    if (!existsSync(path.join(dir, artifact))) errors.push(`${label}: missing ${artifact}`);
  }
  if (lifecycle.brainstorm === 'selected' && (typeof discovery.selected_hypothesis !== 'string' || !discovery.selected_hypothesis.trim())) {
    errors.push(`${label}: selected brainstorm requires selected_hypothesis`);
  }

  const completedMarket = ['supports', 'mixed', 'contradicts'].includes(lifecycle.market_validation);
  const completedBusiness = ['viable', 'conditional', 'unviable'].includes(lifecycle.business_case);
  if (lifecycle.market_validation !== 'not_started' && !existsSync(path.join(dir, 'market-validation.md'))) {
    errors.push(`${label}: market-validation.md missing for ${lifecycle.market_validation}`);
  }
  lintResearchSources(dir, label, completedMarket && !manualGo('market_validation'), 'completed market validation requires research-sources.jsonl', 'completed market validation has no source records', errors);
  const storeDesignScore = lintStoreDesignScore(dir, label, completedMarket && !manualGo('market_validation'), errors);

  if (lifecycle.business_case !== 'not_started' && !existsSync(path.join(dir, 'business-case.md'))) {
    errors.push(`${label}: business-case.md missing for ${lifecycle.business_case}`);
  }
  if (lifecycle.product_outline !== 'not_started' && !existsSync(path.join(dir, 'product-outline.md'))) {
    errors.push(`${label}: product-outline.md missing for ${lifecycle.product_outline}`);
  }
  if (lifecycle.decision !== 'not_started' && !existsSync(path.join(dir, 'decision.md'))) {
    errors.push(`${label}: decision.md missing for ${lifecycle.decision}`);
  }
  if (lifecycle.phase === 'complete' && !['go', 'stop'].includes(lifecycle.decision)) {
    errors.push(`${label}: complete discovery requires go or stop decision`);
  }
  if (lifecycle.decision === 'go' && lifecycle.product_outline !== 'ready' && !manualGo('decision')) {
    errors.push(`${label}: go decision requires a ready product outline`);
  }
  if (lifecycle.decision === 'go' && (!completedMarket || !completedBusiness) && !manualGo('decision')) {
    errors.push(`${label}: go decision requires completed market validation and business case`);
  }
  if (lifecycle.decision === 'go' && storeDesignScore?.overall?.hard_stop !== false && !manualGo('decision')) {
    errors.push(`${label}: go decision requires a store design score without hard-stop flags`);
  }
  if (['market_validation', 'business_case', 'product_outline', 'decision'].includes(lifecycle.phase) && lifecycle.brainstorm !== 'selected') {
    errors.push(`${label}: phase ${lifecycle.phase} requires a selected brainstorm hypothesis`);
  }
  if (['business_case', 'product_outline', 'decision'].includes(lifecycle.phase) && !completedMarket && !manualGo('market_validation')) {
    errors.push(`${label}: phase ${lifecycle.phase} requires completed market validation`);
  }
  if (['product_outline', 'decision'].includes(lifecycle.phase) && !completedBusiness && !manualGo('business_case')) {
    errors.push(`${label}: phase ${lifecycle.phase} requires completed business case`);
  }
  if (lifecycle.phase === 'decision' && lifecycle.product_outline !== 'ready' && !manualGo('product_outline')) {
    errors.push(`${label}: decision phase requires a ready product outline`);
  }
  if (['eligible', 'created'].includes(lifecycle.promotion) && lifecycle.decision !== 'go') {
    errors.push(`${label}: promotion ${lifecycle.promotion} requires a go decision`);
  }
  if (lifecycle.decision === 'go' && lifecycle.promotion === 'not_eligible') {
    errors.push(`${label}: go decision must be eligible for promotion`);
  }
  if (lifecycle.promotion === 'created' && (typeof discovery.promoted_spec !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(discovery.promoted_spec))) {
    errors.push(`${label}: created promotion requires promoted_spec`);
  }
}

export function validateDiscoveryDirectory(dir) {
  const errors = [];
  lintDiscovery(dir, errors);
  return errors;
}

const RELEASE_ARTIFACTS = {
  pre_release_checklist: 'pre-release-checklist.md',
  marketing_plan: 'marketing-plan.md',
  store_assets: 'store-assets.md',
  measurement_plan: 'measurement-plan.md',
  launch_plan: 'launch-plan.md',
};

function lintReleaseJsonl(dir, label, name, validate, errors) {
  const file = path.join(dir, name);
  if (!existsSync(file)) return 0;
  let records = 0;
  for (const [index, line] of readFileSync(file, 'utf8').split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    records += 1;
    try {
      validate(JSON.parse(line), index + 1);
    } catch (error) {
      errors.push(`${label}: invalid ${name} line ${index + 1} (${error.message})`);
    }
  }
  return records;
}

function lintRelease(root, dir, errors) {
  const label = path.basename(dir);
  const metadataFile = path.join(dir, 'release.json');
  if (!existsSync(metadataFile)) {
    errors.push(`${label}: missing release.json`);
    return;
  }
  let release;
  try {
    release = readJson(metadataFile);
  } catch (error) {
    errors.push(`${label}: invalid release.json (${error.message})`);
    return;
  }
  if (release.schema_version !== 1) errors.push(`${label}: release schema_version must be 1`);
  if (release.release_name !== label || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(release.release_name ?? '')) errors.push(`${label}: release_name must match its kebab-case directory`);
  if (Number.isNaN(Date.parse(release.created_at)) || Number.isNaN(Date.parse(release.updated_at))) errors.push(`${label}: release timestamps are invalid`);
  if (!Array.isArray(release.target_platforms) || release.target_platforms.length === 0 || release.target_platforms.some((platform) => !['ios', 'android', 'web', 'backend', 'other'].includes(platform))) errors.push(`${label}: release target_platforms are invalid`);
  if (!Array.isArray(release.source_specs) || !Array.isArray(release.context_profiles)) errors.push(`${label}: release source_specs and context_profiles must be arrays`);
  for (const [index, entry] of (release.gate_history ?? []).entries()) {
    if (!['readiness', 'go_to_market', 'assets', 'measurement'].includes(entry?.gate) || !validManualOverride(entry, entry?.gate, entry?.decision)) errors.push(`${label}: invalid manual gate override ${index + 1}`);
  }
  const candidate = release.candidate;
  if (candidate !== undefined) {
    for (const field of ['commit', 'version', 'build', 'artifact_digest', 'environment']) {
      if (typeof candidate[field] !== 'string' || !candidate[field].trim()) errors.push(`${label}: release candidate has invalid ${field}`);
    }
    if (Number.isNaN(Date.parse(candidate.verified_at))) errors.push(`${label}: release candidate has invalid verified_at`);
  }
  const scope = release.scope;
  if (scope !== undefined && (!Array.isArray(scope.platforms) || !Array.isArray(scope.storefronts) || !Array.isArray(scope.markets) || !Array.isArray(scope.locales))) {
    errors.push(`${label}: release scope arrays are invalid`);
  }
  if (root && Array.isArray(release.context_profiles)) {
    const config = readJson(path.join(root, '.sdd/config.json'));
    for (const profile of release.context_profiles) if (!config.context.profiles[profile]) errors.push(`${label}: unknown release context profile ${profile}`);
    for (const feature of release.source_specs ?? []) {
      const specFile = path.join(root, '.sdd/specs', feature, 'spec.json');
      if (!existsSync(specFile)) errors.push(`${label}: source spec ${feature} does not exist`);
      else {
        const spec = readJson(specFile);
        if (spec.lifecycle?.phase !== 'complete' || spec.lifecycle?.validation !== 'passed') errors.push(`${label}: source spec ${feature} is not complete with passed validation`);
      }
    }
  }
  if (!existsSync(path.join(dir, 'release-context.md'))) errors.push(`${label}: missing release-context.md`);

  const lifecycle = release.lifecycle ?? {};
  if (!RELEASE_PHASES.has(lifecycle.phase)) errors.push(`${label}: invalid release lifecycle.phase`);
  if (!RELEASE_READINESS_STATES.has(lifecycle.readiness)) errors.push(`${label}: invalid release readiness state`);
  for (const field of ['go_to_market', 'assets', 'measurement']) if (!RELEASE_PLAN_STATES.has(lifecycle[field])) errors.push(`${label}: invalid release ${field} state`);
  if (!RELEASE_LAUNCH_STATES.has(lifecycle.launch)) errors.push(`${label}: invalid release launch state`);
  if (!RELEASE_OBSERVATION_STATES.has(lifecycle.observation)) errors.push(`${label}: invalid release observation state`);
  if (!RELEASE_GROWTH_STATES.has(lifecycle.growth)) errors.push(`${label}: invalid release growth state`);

  const requiredFiles = [
    [lifecycle.readiness !== 'not_started', 'pre-release-checklist.md'],
    [lifecycle.go_to_market !== 'not_started', 'marketing-plan.md'],
    [lifecycle.assets !== 'not_started', 'store-assets.md'],
    [lifecycle.measurement !== 'not_started', 'measurement-plan.md'],
    [lifecycle.launch !== 'not_started', 'launch-plan.md'],
    [lifecycle.growth !== 'not_started', 'growth-plan.md'],
  ];
  for (const [required, name] of requiredFiles) if (required && !existsSync(path.join(dir, name))) errors.push(`${label}: missing ${name} for current release state`);
  const manualGo = (gateName) => (release.gate_history ?? []).some((entry) => validManualOverride(entry, gateName));
  lintResearchSources(dir, label, (lifecycle.go_to_market === 'ready' && !manualGo('go_to_market')) || (lifecycle.assets === 'ready' && !manualGo('assets')), 'ready release research requires research-sources.jsonl', 'ready release research has no source records', errors);

  const gate = release.launch_gate ?? {};
  if (!['pending', 'approved', 'revoked'].includes(gate.status)) errors.push(`${label}: invalid release launch gate status`);
  const hashes = gate.artifact_hashes ?? {};
  for (const [key, name] of Object.entries(RELEASE_ARTIFACTS)) {
    const hash = hashes[key];
    if (hash !== null && hash !== undefined && !/^[a-f0-9]{64}$/.test(hash)) errors.push(`${label}: invalid launch gate hash for ${name}`);
  }
  if (gate.status === 'approved') {
    if (!gate.approved_by || Number.isNaN(Date.parse(gate.approved_at))) errors.push(`${label}: approved launch gate lacks human provenance`);
    for (const [key, name] of Object.entries(RELEASE_ARTIFACTS)) {
      const file = path.join(dir, name);
      if (!existsSync(file) || hashes[key] !== sha256(file)) errors.push(`${label}: approved launch gate has stale ${name}`);
    }
    if (release.contract_version >= 2 && (!candidate || !scope)) errors.push(`${label}: approved launch gate requires structured candidate and scope`);
    else {
      if (candidate && gate.candidate_digest !== sha256Value(candidate)) errors.push(`${label}: approved launch gate has stale candidate digest`);
      if (scope && gate.scope_digest !== sha256Value(scope)) errors.push(`${label}: approved launch gate has stale scope digest`);
    }
    if (lifecycle.readiness !== 'ready' || lifecycle.go_to_market !== 'ready' || lifecycle.assets !== 'ready' || lifecycle.measurement !== 'ready') errors.push(`${label}: approved launch gate requires ready readiness, go-to-market, assets, and measurement`);
  }
  if (['approved', 'in_progress', 'launched', 'paused'].includes(lifecycle.launch) && gate.status !== 'approved') errors.push(`${label}: launch state ${lifecycle.launch} requires an approved gate`);
  const paidGate = release.paid_media_gate ?? {};
  if (!['not_configured', 'pending', 'approved', 'revoked', 'exhausted'].includes(paidGate.status)) errors.push(`${label}: invalid paid media gate status`);
  if (paidGate.status === 'approved') {
    if (!paidGate.approved_by || Number.isNaN(Date.parse(paidGate.approved_at))) errors.push(`${label}: approved paid media gate lacks human provenance`);
    if (typeof paidGate.channel !== 'string' || !paidGate.channel.trim()) errors.push(`${label}: approved paid media gate lacks channel`);
    if (typeof paidGate.currency !== 'string' || !/^[A-Z]{3}$/.test(paidGate.currency)) errors.push(`${label}: approved paid media gate lacks ISO currency`);
    if (!Number.isFinite(paidGate.hard_cap) || paidGate.hard_cap <= 0) errors.push(`${label}: approved paid media gate requires a positive hard cap`);
    if (typeof paidGate.starts_on !== 'string' || Number.isNaN(Date.parse(paidGate.starts_on)) || typeof paidGate.ends_on !== 'string' || Number.isNaN(Date.parse(paidGate.ends_on)) || paidGate.ends_on < paidGate.starts_on) errors.push(`${label}: approved paid media gate has invalid dates`);
    if (typeof paidGate.experiment_id !== 'string' || !paidGate.experiment_id.trim()) errors.push(`${label}: approved paid media gate lacks experiment_id`);
    if (typeof paidGate.stop_rules !== 'string' || !paidGate.stop_rules.trim()) errors.push(`${label}: approved paid media gate lacks stop_rules`);
    if (typeof paidGate.timezone !== 'string' || !paidGate.timezone.trim()) errors.push(`${label}: approved paid media gate lacks timezone`);
    if (!Number.isFinite(paidGate.spend_actual) || paidGate.spend_actual < 0 || paidGate.spend_actual > paidGate.hard_cap) errors.push(`${label}: approved paid media gate has invalid spend_actual`);
  }
  if (['observation', 'growth', 'complete'].includes(lifecycle.phase) && !['launched', 'paused', 'rolled_back'].includes(lifecycle.launch)) errors.push(`${label}: phase ${lifecycle.phase} requires a release that reached launch`);
  if (lifecycle.phase === 'growth' && !['stable', 'alert', 'insufficient_data'].includes(lifecycle.observation)) errors.push(`${label}: growth phase requires a completed observation snapshot`);
  if (lifecycle.phase === 'complete' && lifecycle.growth !== 'complete') errors.push(`${label}: complete release requires completed growth state`);

  const evidenceRecords = lintReleaseJsonl(dir, label, 'evidence.jsonl', (event, line) => {
    if (event.release !== label) errors.push(`${label}: evidence line ${line} has wrong release`);
    if (typeof event.at !== 'string' || Number.isNaN(Date.parse(event.at))) errors.push(`${label}: evidence line ${line} has invalid at`);
    if (!['readiness', 'test', 'build', 'manual', 'store', 'launch', 'rollback', 'data-quality', 'environment-boundary'].includes(event.kind)) errors.push(`${label}: evidence line ${line} has invalid kind`);
    if (!['passed', 'failed', 'partial', 'not_run'].includes(event.status)) errors.push(`${label}: evidence line ${line} has invalid status`);
    if (typeof event.summary !== 'string' || !event.summary.trim()) errors.push(`${label}: evidence line ${line} has missing summary`);
  }, errors);
  const evidenceFile = path.join(dir, 'evidence.jsonl');
  const actualLaunchEvidence = existsSync(evidenceFile) && readFileSync(evidenceFile, 'utf8').split(/\r?\n/).some((line) => {
    if (!line.trim()) return false;
    try {
      const event = JSON.parse(line);
      return event.release === label && event.kind === 'launch' && event.status === 'passed';
    } catch {
      return false;
    }
  });
  if ((lifecycle.launch === 'launched' || ['observation', 'growth', 'complete'].includes(lifecycle.phase)) && (!evidenceRecords || !actualLaunchEvidence)) errors.push(`${label}: launched release requires passed launch availability evidence`);

  const metricRecords = lintReleaseJsonl(dir, label, 'metrics-snapshots.jsonl', (snapshot, line) => {
    for (const field of ['recorded_at', 'window_start', 'window_end']) if (typeof snapshot[field] !== 'string' || Number.isNaN(Date.parse(snapshot[field]))) errors.push(`${label}: metrics line ${line} has invalid ${field}`);
    if (typeof snapshot.source !== 'string' || !snapshot.source.trim()) errors.push(`${label}: metrics line ${line} has missing source`);
    if (!snapshot.metrics || typeof snapshot.metrics !== 'object' || Array.isArray(snapshot.metrics)) errors.push(`${label}: metrics line ${line} has invalid metrics`);
    if (!['stable', 'alert', 'insufficient_data'].includes(snapshot.decision)) errors.push(`${label}: metrics line ${line} has invalid decision`);
    if (snapshot.schema_version === 1) {
      for (const field of ['snapshot_id', 'release', 'candidate_digest', 'timezone', 'data_quality']) if (typeof snapshot[field] !== 'string' || !snapshot[field].trim()) errors.push(`${label}: metrics line ${line} has missing ${field}`);
      if (!Array.isArray(snapshot.cohorts)) errors.push(`${label}: metrics line ${line} has invalid cohorts`);
    }
  }, errors);
  if (lifecycle.observation !== 'not_started' && metricRecords === 0) errors.push(`${label}: observation state requires metrics-snapshots.jsonl`);

  const experimentRecords = lintReleaseJsonl(dir, label, 'experiments.jsonl', (experiment, line) => {
    for (const field of ['id', 'hypothesis']) if (typeof experiment[field] !== 'string' || !experiment[field].trim()) errors.push(`${label}: experiment line ${line} has missing ${field}`);
    if (!['planned', 'running', 'win', 'loss', 'inconclusive', 'invalid', 'stopped'].includes(experiment.status)) errors.push(`${label}: experiment line ${line} has invalid status`);
    if (experiment.spend !== undefined && (!Number.isFinite(experiment.spend) || experiment.spend < 0)) errors.push(`${label}: experiment line ${line} has invalid spend`);
    if (experiment.schema_version === 1) {
      for (const field of ['owner', 'release', 'candidate_digest', 'exposure_unit', 'assignment_method', 'primary_metric', 'decision_rule', 'learning_destination']) {
        if (typeof experiment[field] !== 'string' || !experiment[field].trim()) errors.push(`${label}: experiment line ${line} has missing ${field}`);
      }
      if (!Array.isArray(experiment.guardrails)) errors.push(`${label}: experiment line ${line} has invalid guardrails`);
    }
  }, errors);
  if (['learning', 'scaling', 'complete'].includes(lifecycle.growth) && experimentRecords === 0) errors.push(`${label}: growth state ${lifecycle.growth} requires experiments.jsonl`);
}

export function validateReleaseDirectory(dir) {
  const errors = [];
  lintRelease(null, dir, errors);
  return errors;
}

function lintSteeringLinks(root, errors) {
  const dir = path.join(root, '.sdd/steering');
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir).filter((file) => file.endsWith('.md'))) {
    const file = path.join(dir, name);
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/\[[^\]]+\]\(([^)#]+)(?:#[^)]+)?\)/g)) {
      const target = match[1];
      if (/^[a-z]+:/i.test(target)) continue;
      if (!existsSync(path.resolve(path.dirname(file), target))) errors.push(`${path.relative(root, file)}: broken link ${target}`);
    }
  }
}

function lintAdapters(root, errors) {
  const dir = path.join(root, '.claude/commands/sdd');
  for (const name of readdirSync(dir).filter((file) => file.endsWith('.md'))) {
    const text = readFileSync(path.join(dir, name), 'utf8');
    if (!text.includes('.sdd/settings/workflows/')) errors.push(`Claude adapter ${name} does not reference canonical workflows`);
    if (!text.includes(`.sdd/settings/workflows/${name}`)) errors.push(`Claude adapter ${name} does not reference its matching canonical workflow`);
  }
  const codex = path.join(root, '.codex/skills/sdd/SKILL.md');
  if (!existsSync(codex)) errors.push('missing Codex SDD adapter');
  else {
    const text = readFileSync(codex, 'utf8');
    for (const contract of ['.sdd/settings/workflows/', '.sdd/settings/lifecycle.md', 'auto-sdd', 'spec-close', 'release-*', 'discovery-*']) {
      if (!text.includes(contract)) errors.push(`Codex SDD adapter does not reference canonical ${contract} contract`);
    }
  }
}

function lint(root) {
  const errors = [];
  const warnings = [];
  for (const required of ['.sdd/config.json', '.sdd/settings/lifecycle.md', '.sdd/settings/schemas/spec.schema.json', '.sdd/settings/schemas/auto-sdd.schema.json', '.sdd/settings/schemas/release.schema.json']) {
    if (!existsSync(path.join(root, required))) errors.push(`missing ${required}`);
  }
  for (const dir of activeSpecDirs(root)) lintSpec(root, dir, errors, warnings);
  for (const dir of activeDiscoveryDirs(root)) lintDiscovery(dir, errors);
  for (const dir of activeReleaseDirs(root)) lintRelease(root, dir, errors);
  lintSteeringLinks(root, errors);
  lintAdapters(root, errors);
  for (const warning of warnings) console.warn(`WARN ${warning}`);
  for (const error of errors) console.error(`ERROR ${error}`);
  console.log(`SDD lint: ${errors.length} error(s), ${warnings.length} warning(s)`);
  return errors.length === 0 ? 0 : 1;
}

function claimsFile(root) {
  return path.join(root, '.sdd/runtime/claims.json');
}

function loadClaims(root) {
  const file = claimsFile(root);
  return existsSync(file) ? readJson(file) : { version: 1, claims: [] };
}

function saveClaims(root, data) {
  const file = claimsFile(root);
  mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(data, null, 2)}\n`);
  renameSync(temporary, file);
}

function withClaimsLock(root, action) {
  const dir = path.join(root, '.sdd/runtime');
  const lock = path.join(dir, 'claims.lock');
  mkdirSync(dir, { recursive: true });
  let descriptor;
  try {
    descriptor = openSync(lock, 'wx');
  } catch {
    const ageMs = existsSync(lock) ? Date.now() - statSync(lock).mtimeMs : 0;
    if (ageMs > 15 * 60 * 1000) {
      console.error('claim registry has an orphaned lock older than 15 minutes; run claims-unlock with an actor and reason');
    } else {
      console.error('claim registry is busy; retry after the other agent finishes');
    }
    return 1;
  }
  try {
    writeFileSync(descriptor, `${JSON.stringify({ pid: process.pid, acquired_at: new Date().toISOString() })}\n`);
    return action();
  } finally {
    closeSync(descriptor);
    unlinkSync(lock);
  }
}

function unlockClaims(root, args) {
  const [actor, ...flags] = args;
  const reason = flagValue(flags, '--reason');
  const lock = path.join(root, '.sdd/runtime/claims.lock');
  if (!actor || !reason) {
    console.error('usage: claims-unlock <actor> --reason <reason>');
    return 2;
  }
  if (!existsSync(lock)) {
    console.error('claim registry lock not found');
    return 1;
  }
  const ageMs = Date.now() - statSync(lock).mtimeMs;
  if (ageMs <= 15 * 60 * 1000) {
    console.error('refusing to remove a claim lock younger than 15 minutes');
    return 1;
  }
  unlinkSync(lock);
  const audit = path.join(root, '.sdd/runtime/claims-unlock.jsonl');
  appendFileSync(audit, `${JSON.stringify({ at: new Date().toISOString(), actor, reason, prior_lock_age_ms: ageMs })}\n`);
  console.log('removed orphaned claim lock with audit record');
  return 0;
}

function claim(root, args) {
  const [feature, task, agent, ...rest] = args;
  const scopeIndex = rest.indexOf('--scope');
  const scopes = scopeIndex >= 0 ? rest[scopeIndex + 1]?.split(',').map((value) => value.trim()).filter(Boolean) : [];
  if (!feature || !task || !agent || scopes.length === 0) {
    console.error('usage: claim <feature> <task> <agent> --scope path[,path]');
    return 2;
  }
  let autoContext = null;
  const specDir = path.join(root, '.sdd/specs', feature);
  const specFile = path.join(specDir, 'spec.json');
  if (existsSync(specFile) && readJson(specFile).lifecycle?.phase === 'closed') {
    console.error('closed specs cannot acquire implementation claims');
    return 1;
  }
  const autoFile = path.join(specDir, 'auto-sdd.json');
  if (!existsSync(specFile)) {
    console.error('spec not found');
    return 1;
  }
  const spec = readJson(specFile);
  const tasksFile = path.join(specDir, 'tasks.md');
  const taskRecord = loadTaskRecords(specDir).find((entry) => entry.id === task);
  const normalizeScopes = (values) => values.map((value) => value.replace(/^\.\//, '').replace(/\/+$/, '')).sort();
  const declaredScopes = taskRecord ? normalizeScopes(taskRecord.scopes) : [];
  const claimedScopes = normalizeScopes(scopes);
  const scopeMatches = declaredScopes.length === claimedScopes.length && declaredScopes.every((value, index) => value === claimedScopes[index]);
  if (spec.lifecycle?.tasks?.status !== 'approved' || !taskRecord || taskRecord.done || !scopeMatches) {
    console.error('claim requires an existing unfinished task, approved tasks, and the exact declared write scope');
    return 1;
  }
  if (existsSync(autoFile)) {
    const state = readJson(autoFile);
    const gate = state.implementation_gate ?? {};
    const humanApproved = typeof gate.approved_by === 'string' && gate.approved_by.trim() && !/^(?:delegated-)?auto-sdd:/i.test(gate.approved_by) && !Number.isNaN(Date.parse(gate.approved_at));
    const gateCurrent = gate.status === 'approved' && humanApproved && gate.spec_revision === spec.revision && gate.requirements_hash === spec.lifecycle?.requirements?.content_hash && gate.design_hash === spec.lifecycle?.design?.content_hash && gate.tasks_hash === spec.lifecycle?.tasks?.content_hash && gate.plan_hash === state.plan_hash
      && (state.validation_policy === undefined || gate.validation_policy_hash === state.validation_policy_hash);
    const wave = state.waves?.find((entry) => entry.task_ids?.includes(task));
    const assigned = wave?.executor_agents?.includes(agent);
    if (!gateCurrent || state.stage !== 'implementation' || wave?.status !== 'in_progress' || !assigned || !scopeMatches) {
      console.error('auto-sdd claim requires a current approved gate and an in-progress assigned wave');
      return 1;
    }
    autoContext = { wave: wave.id, attempt: wave.attempt };
  }
  return withClaimsLock(root, () => {
    const data = loadClaims(root);
    const existingTask = data.claims.find((entry) => entry.feature === feature && entry.task === task);
    if (existingTask) {
      console.error(`task already claimed by ${existingTask.agent}`);
      return 1;
    }
    const conflict = data.claims.find((entry) => entry.scopes.some((left) => scopes.some((right) => scopesOverlap(left, right))));
    if (conflict) {
      console.error(`write scope conflicts with ${conflict.feature} ${conflict.task} (${conflict.agent})`);
      return 1;
    }
    let baseCommit = process.env.SDD_BASE_COMMIT;
    if (!baseCommit) {
      try {
        baseCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
      } catch {
        baseCommit = 'unknown';
      }
    }
    data.claims.push({ feature, task, agent, scopes, base_commit: baseCommit, claimed_at: new Date().toISOString(), ...(autoContext ?? {}) });
    saveClaims(root, data);
    console.log(`claimed ${feature} ${task} for ${agent}`);
    return 0;
  });
}

export function claimTask(root, args) {
  return claim(root, args);
}

function evidence(root, args) {
  const [feature, task, agent, kind, status, ...rest] = args;
  const option = (name) => {
    const index = rest.indexOf(name);
    return index >= 0 ? rest[index + 1] : undefined;
  };
  const optionIndexes = new Set(['--wave', '--attempt', '--role'].flatMap((name) => {
    const index = rest.indexOf(name);
    return index >= 0 ? [index, index + 1] : [];
  }));
  const summaryParts = rest.filter((_, index) => !optionIndexes.has(index));
  const wave = option('--wave');
  const attemptValue = option('--attempt');
  const role = option('--role');
  const attempt = attemptValue === undefined ? undefined : Number(attemptValue);
  if (!feature || !task || !agent || !kind || !status || summaryParts.length === 0) {
    console.error('usage: evidence <feature> <task> <agent> <kind> <passed|failed|partial|not_run> <summary> [--wave wave-N] [--attempt N] [--role role]');
    return 2;
  }
  if (!EVIDENCE_KINDS.has(kind) || !EVIDENCE_STATES.has(status)) {
    console.error('invalid evidence kind or status');
    return 2;
  }
  if (wave && !/^wave-[1-9][0-9]*$/.test(wave)) {
    console.error('invalid evidence wave');
    return 2;
  }
  if (attempt !== undefined && (!Number.isInteger(attempt) || attempt < 1)) {
    console.error('invalid evidence attempt');
    return 2;
  }
  if (role && !EVIDENCE_ROLES.has(role)) {
    console.error('invalid evidence role');
    return 2;
  }
  const dir = path.join(root, '.sdd/specs', feature);
  if (!existsSync(path.join(dir, 'spec.json'))) {
    console.error('spec not found');
    return 1;
  }
  if (readJson(path.join(dir, 'spec.json')).lifecycle?.phase === 'closed') {
    console.error('closed specs cannot receive implementation evidence');
    return 1;
  }
  const event = {
    at: new Date().toISOString(),
    feature,
    task,
    agent,
    kind,
    status,
    summary: summaryParts.join(' '),
  };
  if (wave) event.wave = wave;
  if (attempt !== undefined) event.attempt = attempt;
  if (role) event.role = role;
  appendFileSync(path.join(dir, 'evidence.jsonl'), `${JSON.stringify(event)}\n`);
  console.log(`recorded ${kind} evidence for ${feature} ${task}`);
  return 0;
}

function approve(root, args) {
  const [feature, artifact, approver, ...flags] = args;
  const modeIndex = flags.indexOf('--mode');
  const mode = modeIndex >= 0 ? flags[modeIndex + 1] : 'manual';
  const overrideReason = flagValue(flags, '--override-reason');
  if (!feature || !ARTIFACTS.includes(artifact) || !approver) {
    console.error('usage: approve <feature> <requirements|design|tasks> <approver> [--mode manual|delegated-auto-sdd] [--override-reason <reason>]');
    return 2;
  }
  if (!['manual', 'delegated-auto-sdd'].includes(mode)) {
    console.error('invalid approval mode');
    return 2;
  }
  const dir = path.join(root, '.sdd/specs', feature);
  const specFile = path.join(dir, 'spec.json');
  const artifactFile = path.join(dir, `${artifact}.md`);
  if (!existsSync(specFile) || !existsSync(artifactFile)) {
    console.error('spec or artifact not found');
    return 1;
  }
  const spec = readJson(specFile);
  if (spec.lifecycle?.phase === 'closed') {
    console.error('closed specs cannot approve artifacts');
    return 1;
  }
  const autoFile = path.join(dir, 'auto-sdd.json');
  const autoState = existsSync(autoFile) ? readJson(autoFile) : null;
  if (spec.lifecycle?.[artifact]?.status !== 'review_required') {
    console.error(`${artifact} must be review_required before approval`);
    return 1;
  }
  if (mode === 'delegated-auto-sdd' && !autoState) {
    console.error('delegated auto-sdd approval requires auto-sdd.json');
    return 1;
  }
  if (artifact === 'design' && spec.lifecycle?.requirements?.status !== 'approved') {
    console.error('design approval requires approved requirements');
    return 1;
  }
  if (artifact === 'tasks' && (spec.lifecycle?.requirements?.status !== 'approved' || spec.lifecycle?.design?.status !== 'approved')) {
    console.error('tasks approval requires approved requirements and design');
    return 1;
  }
  const approvedAt = new Date().toISOString();
  const hash = sha256(artifactFile);
  if (mode === 'delegated-auto-sdd') {
    const review = autoState.reviews?.[artifact];
    const reviewProvenance = typeof review?.reviewer === 'string' && review.reviewer.trim() && !Number.isNaN(Date.parse(review.reviewed_at)) && Number.isInteger(review.attempt) && review.attempt > 0;
    if (review?.status !== 'passed' || review.content_hash !== hash || !reviewProvenance) {
      console.error(`delegated auto-sdd approval requires a passed current-hash ${artifact} review`);
      return 1;
    }
  }
  if (overrideReason && mode !== 'manual') {
    console.error('only a human manual approval may override a NO-GO recommendation');
    return 2;
  }
  if (overrideReason && /^(?:delegated-)?auto-sdd:/i.test(approver)) {
    console.error('manual override requires a human approver identity');
    return 2;
  }
  const previousHash = autoState?.artifact_hashes?.[artifact];
  const changed = previousHash !== null && previousHash !== undefined && previousHash !== hash;
  if (autoState && changed) {
    spec.revision = (spec.revision ?? 1) + 1;
    autoState.implementation_gate.status = 'revoked';
    for (const field of ['approved_by', 'approved_at', 'spec_revision', 'requirements_hash', 'design_hash', 'tasks_hash', 'plan_hash', 'validation_policy_hash']) autoState.implementation_gate[field] = null;
    const downstream = artifact === 'requirements' ? ['design', 'tasks'] : artifact === 'design' ? ['tasks'] : [];
    for (const item of downstream) {
      if (spec.lifecycle?.[item]?.status !== 'missing') spec.lifecycle[item] = { status: 'superseded' };
      if (spec.approvals?.[item]) spec.approvals[item].approved = false;
      autoState.artifact_hashes[item] = null;
      if (autoState.reviews?.[item]) autoState.reviews[item] = { status: 'pending', content_hash: null, reviewed_at: null, reviewer: null, attempt: 0 };
    }
    if (artifact !== 'tasks') spec.ready_for_implementation = false;
    autoState.plan_hash = null;
    autoState.waves = [];
    autoState.stage = artifact;
  }
  spec.lifecycle[artifact] = { status: 'approved', approved_by: `${mode}:${approver}`, approved_at: approvedAt, content_hash: hash };
  spec.gate_history ??= [];
  spec.gate_history.push({
    at: approvedAt,
    gate: artifact,
    decision: 'go',
    actor: approver,
    mode: overrideReason ? 'manual-override' : mode,
    content_hash: hash,
    ...(overrideReason ? { reason: overrideReason } : {}),
  });
  if (spec.approvals?.[artifact]) {
    spec.approvals[artifact].generated = true;
    spec.approvals[artifact].approved = true;
  }
  if (artifact === 'tasks') spec.ready_for_implementation = true;
  spec.lifecycle.phase = deriveLifecyclePhase(spec.lifecycle);
  if (spec.phase !== undefined) {
    const legacyPhase = { design: 'design', tasks: 'tasks', implementation: 'implementation-ready', validation: 'validation', complete: 'complete' };
    spec.phase = legacyPhase[spec.lifecycle.phase] ?? spec.phase;
  }
  spec.updated_at = approvedAt;
  const temporary = `${specFile}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(spec, null, 2)}\n`);
  renameSync(temporary, specFile);
  if (autoState) {
    autoState.artifact_hashes ??= {};
    autoState.artifact_hashes[artifact] = hash;
    autoState.updated_at = approvedAt;
    const autoTemporary = `${autoFile}.${process.pid}.tmp`;
    writeFileSync(autoTemporary, `${JSON.stringify(autoState, null, 2)}\n`);
    renameSync(autoTemporary, autoFile);
  }
  console.log(`approved ${feature} ${artifact} ${hash}`);
  return 0;
}

export function approveArtifact(root, args) {
  return approve(root, args);
}

function revise(root, args) {
  const [feature, artifact, actor, ...flags] = args;
  const reason = flagValue(flags, '--reason');
  if (!feature || !ARTIFACTS.includes(artifact) || !actor || !reason) {
    console.error('usage: revise <feature> <requirements|design|tasks> <actor> --reason <reason>');
    return 2;
  }
  const dir = path.join(root, '.sdd/specs', feature);
  const specFile = path.join(dir, 'spec.json');
  if (!existsSync(specFile)) {
    console.error('spec not found');
    return 1;
  }
  const spec = readJson(specFile);
  if (spec.lifecycle?.phase === 'closed') {
    console.error('closed specs cannot be revised');
    return 1;
  }
  if (!['approved', 'superseded'].includes(spec.lifecycle?.[artifact]?.status)) {
    console.error(`${artifact} must be approved or superseded before deterministic revision`);
    return 1;
  }
  const at = new Date().toISOString();
  spec.revision = (spec.revision ?? 1) + 1;
  spec.lifecycle[artifact] = { status: 'review_required' };
  const downstream = artifact === 'requirements' ? ['design', 'tasks'] : artifact === 'design' ? ['tasks'] : [];
  for (const item of downstream) if (spec.lifecycle?.[item]?.status !== 'missing') spec.lifecycle[item] = { status: 'superseded' };
  spec.lifecycle.implementation = 'not_started';
  spec.lifecycle.validation = 'not_started';
  spec.lifecycle.phase = artifact;
  spec.ready_for_implementation = false;
  for (const item of [artifact, ...downstream]) if (spec.approvals?.[item]) spec.approvals[item].approved = false;
  spec.gate_history ??= [];
  const artifactFile = path.join(dir, `${artifact}.md`);
  spec.gate_history.push({ at, gate: artifact, decision: 'no-go', actor, mode: 'manual', content_hash: existsSync(artifactFile) ? sha256(artifactFile) : '0'.repeat(64), reason });
  spec.updated_at = at;

  const autoFile = path.join(dir, 'auto-sdd.json');
  if (existsSync(autoFile)) {
    const state = readJson(autoFile);
    state.implementation_gate = {
      ...state.implementation_gate,
      status: 'revoked',
      approved_by: null,
      approved_at: null,
      spec_revision: null,
      requirements_hash: null,
      design_hash: null,
      tasks_hash: null,
      plan_hash: null,
      validation_policy_hash: null,
    };
    state.stage = artifact;
    state.artifact_hashes ??= {};
    state.reviews ??= {};
    for (const item of [artifact, ...downstream]) {
      state.artifact_hashes[item] = null;
      state.reviews[item] = { status: 'pending', content_hash: null, reviewed_at: null, reviewer: null, attempt: 0 };
    }
    if (state.validation_policy) {
      state.validation_policy = {
        profile: 'pending',
        selected_at: null,
        rationale: null,
        risk_factors: [],
        artifact_review_mode: 'pending',
        wave_validation_mode: 'pending',
        final_validation_mode: 'pending',
      };
      state.validation_policy_hash = null;
      state.final_validation = {
        status: 'pending',
        agent: null,
        attempt: 0,
        mode: 'pending',
        reused_wave: null,
        scope_summary: null,
        model_requirement: { capability: 'pending', risk_factors: [], rationale: 'Derived after validation profile selection.' },
        model_assignment: null,
      };
    }
    state.plan_hash = null;
    state.waves = [];
    state.updated_at = at;
    writeFileSync(autoFile, `${JSON.stringify(state, null, 2)}\n`);
  }
  writeFileSync(specFile, `${JSON.stringify(spec, null, 2)}\n`);
  console.log(`revised ${feature} ${artifact}; downstream state invalidated`);
  return 0;
}

export function reviseArtifact(root, args) {
  return revise(root, args);
}

function release(root, args) {
  const [feature, task, agent, ...flags] = args;
  const abandoned = flags.includes('--abandon');
  return withClaimsLock(root, () => {
    const data = loadClaims(root);
    const index = data.claims.findIndex((entry) => entry.feature === feature && entry.task === task && (!agent || entry.agent === agent));
    if (index < 0) {
      console.error('matching claim not found');
      return 1;
    }
    if (!abandoned) {
      const evidenceFile = path.join(root, '.sdd/specs', feature, 'evidence.jsonl');
      const hasEvidence = existsSync(evidenceFile) && readFileSync(evidenceFile, 'utf8').split(/\r?\n/).some((line) => {
        if (!line.trim()) return false;
        try {
          const event = JSON.parse(line);
          return event.feature === feature && event.task === task && (!agent || event.agent === agent) && event.status === 'passed';
        } catch {
          return false;
        }
      });
      if (!hasEvidence) {
        console.error('record passed evidence before completion release, or use --abandon');
        return 1;
      }
      const autoFile = path.join(root, '.sdd/specs', feature, 'auto-sdd.json');
      if (existsSync(autoFile)) {
        const state = readJson(autoFile);
        const wave = state.waves?.find((entry) => entry.task_ids?.includes(task));
        const evidenceFile = path.join(root, '.sdd/specs', feature, 'evidence.jsonl');
        const hasCurrentPassedEvidence = wave && existsSync(evidenceFile) && readFileSync(evidenceFile, 'utf8').split(/\r?\n/).some((line) => {
          if (!line.trim()) return false;
          try {
            const event = JSON.parse(line);
            return event.feature === feature && event.task === task && event.agent === agent && event.wave === wave.id && event.attempt === wave.attempt && event.role === 'executor' && event.status === 'passed';
          } catch { return false; }
        });
        const hasCurrentPassedReview = wave && existsSync(evidenceFile) && readFileSync(evidenceFile, 'utf8').split(/\r?\n/).some((line) => {
          if (!line.trim()) return false;
          try {
            const event = JSON.parse(line);
            return event.feature === feature && event.wave === wave.id && event.attempt === wave.attempt && event.role === 'validator' && event.kind === 'review' && event.status === 'passed' && wave.validator_agents?.includes(event.agent) && !wave.executor_agents?.includes(event.agent);
          } catch { return false; }
        });
        if (wave?.status !== 'validated' || !hasCurrentPassedEvidence || !hasCurrentPassedReview) {
          console.error('auto-sdd claim release requires a validated wave plus current passed executor and independent review evidence');
          return 1;
        }
      }
    }
    data.claims.splice(index, 1);
    saveClaims(root, data);
    console.log(`released ${feature} ${task}${abandoned ? ' as abandoned' : ''}`);
    return 0;
  });
}

export function releaseTask(root, args) {
  return release(root, args);
}

function closeSpec(root, args) {
  const [feature, reason, actor, ...flags] = args;
  const note = flagValue(flags, '--note');
  const supersededBy = flagValue(flags, '--superseded-by');
  if (!feature || !CLOSE_REASONS.has(reason) || !actor || !note) {
    console.error('usage: close <feature> <obsolete|superseded|cancelled|duplicate|no-longer-needed> <actor> --note <text> [--superseded-by <feature>]');
    return 2;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(feature) || (supersededBy && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(supersededBy))) {
    console.error('feature names must be lowercase kebab-case');
    return 2;
  }
  if (reason === 'superseded' && !supersededBy) {
    console.error('superseded closure requires --superseded-by <feature>');
    return 2;
  }
  const dir = path.join(root, '.sdd/specs', feature);
  const specFile = path.join(dir, 'spec.json');
  if (!existsSync(specFile)) {
    console.error('spec not found');
    return 1;
  }
  const activeClaims = loadClaims(root).claims.filter((claim) => claim.feature === feature);
  if (activeClaims.length) {
    console.error(`cannot close ${feature}: ${activeClaims.length} active claim(s) must be completed or explicitly abandoned`);
    return 1;
  }
  const spec = readJson(specFile);
  const inferPhase = () => {
    const value = String(spec.lifecycle?.phase ?? spec.phase ?? '').toLowerCase();
    if (value.includes('complete')) return 'complete';
    if (value.includes('valid')) return 'validation';
    if (value.includes('implement')) return 'implementation';
    if (value.includes('task')) return 'tasks';
    if (value.includes('design')) return 'design';
    return 'requirements';
  };
  const closedAt = new Date().toISOString();
  if (spec.schema_version !== 2 || !spec.lifecycle || !PHASES.has(spec.lifecycle.phase)) {
    const artifactState = (artifact) => {
      const current = spec.lifecycle?.[artifact];
      if (current && ARTIFACT_STATES.has(current.status)) return current;
      const legacy = spec.approvals?.[artifact];
      if (legacy?.approved === true) return { status: 'approved' };
      if (legacy?.generated === true) return { status: 'review_required' };
      return { status: existsSync(path.join(dir, `${artifact}.md`)) ? 'draft' : 'missing' };
    };
    const priorPhase = inferPhase();
    spec.schema_version = 2;
    spec.feature_name = typeof spec.feature_name === 'string' && spec.feature_name ? spec.feature_name : feature;
    spec.created_at = typeof spec.created_at === 'string' && !Number.isNaN(Date.parse(spec.created_at)) ? spec.created_at : closedAt;
    spec.updated_at = closedAt;
    spec.language = typeof spec.language === 'string' && spec.language.length >= 2 ? spec.language : 'en';
    spec.revision = Number.isInteger(spec.revision) && spec.revision > 0 ? spec.revision : 1;
    spec.task_contract_version = Number.isInteger(spec.task_contract_version) && spec.task_contract_version > 0 ? spec.task_contract_version : 1;
    spec.context_profiles = Array.isArray(spec.context_profiles) ? [...new Set(spec.context_profiles.filter((profile) => typeof profile === 'string'))] : [];
    spec.lifecycle = {
      phase: priorPhase,
      requirements: artifactState('requirements'),
      design: artifactState('design'),
      tasks: artifactState('tasks'),
      implementation: IMPLEMENTATION_STATES.has(spec.lifecycle?.implementation) ? spec.lifecycle.implementation : priorPhase === 'implementation' ? 'in_progress' : 'not_started',
      validation: VALIDATION_STATES.has(spec.lifecycle?.validation) ? spec.lifecycle.validation : priorPhase === 'validation' ? 'in_progress' : 'not_started',
    };
    spec.migration_history = Array.isArray(spec.migration_history) ? spec.migration_history : [];
    spec.migration_history.push({ at: closedAt, event: 'closure_metadata_upgrade', from_phase: String(spec.phase ?? priorPhase), note: 'Added the minimal v2 lifecycle envelope required for administrative closure; artifact bytes were not changed.' });
  }
  if (spec.lifecycle.phase === 'closed') {
    console.log(`${feature} is already closed`);
    return 0;
  }
  const priorPhase = spec.lifecycle.phase;
  spec.lifecycle.phase = 'closed';
  spec.phase = 'closed';
  spec.ready_for_implementation = false;
  spec.updated_at = closedAt;
  spec.closure = {
    status: 'closed',
    reason,
    closed_by: actor,
    closed_at: closedAt,
    prior_phase: priorPhase,
    note,
    ...(supersededBy ? { superseded_by: supersededBy } : {}),
  };

  const autoFile = path.join(dir, 'auto-sdd.json');
  let autoState = null;
  if (existsSync(autoFile)) {
    autoState = readJson(autoFile);
    autoState.stage = 'closed';
    autoState.updated_at = closedAt;
    autoState.implementation_gate = {
      status: 'revoked',
      approved_by: null,
      approved_at: null,
      spec_revision: null,
      requirements_hash: null,
      design_hash: null,
      tasks_hash: null,
      plan_hash: null,
      validation_policy_hash: null,
    };
    autoState.history ??= [];
    autoState.history.push({ at: closedAt, event: 'spec_closed', summary: `${reason}: ${note}` });
  }

  writeJsonAtomic(specFile, spec);
  if (autoState) writeJsonAtomic(autoFile, autoState);
  console.log(`closed ${feature} as ${reason}`);
  return 0;
}

export function closeSpecification(root, args) {
  return closeSpec(root, args);
}

function autoSddResumeGateErrors(dir, state, spec) {
  const errors = [];
  const gate = state.implementation_gate ?? {};
  const humanApproved = typeof gate.approved_by === 'string' && gate.approved_by.trim() && !/^(?:delegated-)?auto-sdd:/i.test(gate.approved_by) && !Number.isNaN(Date.parse(gate.approved_at));
  if (gate.status !== 'approved' || !humanApproved) errors.push('implementation gate is not currently human-approved');
  if (gate.spec_revision !== spec.revision) errors.push('spec revision changed');
  for (const artifact of ARTIFACTS) {
    const lifecycleHash = spec.lifecycle?.[artifact]?.content_hash;
    const artifactFile = path.join(dir, `${artifact}.md`);
    if (spec.lifecycle?.[artifact]?.status !== 'approved') errors.push(`${artifact} is not approved`);
    if (!existsSync(artifactFile) || !lifecycleHash || sha256(artifactFile) !== lifecycleHash) errors.push(`${artifact} bytes no longer match the approved hash`);
    if (state.artifact_hashes?.[artifact] !== lifecycleHash || gate[`${artifact}_hash`] !== lifecycleHash) errors.push(`${artifact} binding is stale`);
  }
  const currentPlanHash = autoSddPlanHash(Array.isArray(state.waves) ? state.waves : []);
  if (!state.plan_hash || state.plan_hash !== currentPlanHash || gate.plan_hash !== state.plan_hash) errors.push('wave plan binding is stale');
  if (state.validation_policy !== undefined) {
    const currentPolicyHash = autoSddValidationPolicyHash(state.validation_policy);
    if (!state.validation_policy_hash || state.validation_policy_hash !== currentPolicyHash || gate.validation_policy_hash !== state.validation_policy_hash) errors.push('validation policy binding is stale');
  }
  return errors;
}

function resumeAutoSdd(root, args) {
  const [feature, actor, ...flags] = args;
  const mode = flagValue(flags, '--mode');
  const requestedWave = flagValue(flags, '--wave');
  const reason = flagValue(flags, '--reason');
  if (!feature || !actor || !['continue', 'recover'].includes(mode) || !reason) {
    console.error('usage: resume <feature> <actor> --mode continue|recover --reason TEXT [--wave wave-N]');
    return 2;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(feature) || (requestedWave && !/^wave-[1-9][0-9]*$/.test(requestedWave))) {
    console.error('resume requires a lowercase kebab-case feature and an optional wave-N target');
    return 2;
  }
  const dir = path.join(root, '.sdd/specs', feature);
  const specFile = path.join(dir, 'spec.json');
  const autoFile = path.join(dir, 'auto-sdd.json');
  if (!existsSync(specFile) || !existsSync(autoFile)) {
    console.error(`auto-sdd spec not found: ${feature}`);
    return 1;
  }
  const state = readJson(autoFile);
  const spec = readJson(specFile);
  if (spec.lifecycle?.phase === 'closed' || state.stage === 'closed') {
    console.error('closed auto-sdd specs cannot be resumed');
    return 1;
  }
  if (spec.lifecycle?.phase === 'complete' || state.stage === 'complete') {
    console.log(JSON.stringify({ feature, decision: 'already-complete' }));
    return 0;
  }
  const gateErrors = autoSddResumeGateErrors(dir, state, spec);
  if (gateErrors.length) {
    console.error(`replan required: ${gateErrors.join('; ')}`);
    return 1;
  }
  if (!['implementation', 'validation', 'blocked'].includes(state.stage)) {
    console.error(`auto-sdd stage ${state.stage} is not resumable; use the canonical workflow for that stage`);
    return 1;
  }
  const waves = Array.isArray(state.waves) ? state.waves : [];
  const allWavesValidated = waves.length > 0 && waves.every((wave) => wave.status === 'validated');
  let target = null;
  if (requestedWave) {
    target = waves.find((wave) => wave.id === requestedWave) ?? null;
    if (!target) {
      console.error(`resume target not found: ${requestedWave}`);
      return 1;
    }
  } else {
    const candidates = waves.filter((wave) => ['in_progress', 'failed', 'partial'].includes(wave.status));
    if (candidates.length > 1) {
      console.error(`multiple interrupted waves require --wave: ${candidates.map((wave) => wave.id).join(', ')}`);
      return 1;
    }
    target = candidates[0] ?? null;
  }
  const finalTarget = !target && allWavesValidated && ['validation', 'blocked'].includes(state.stage) && ['pending', 'failed', 'partial'].includes(state.final_validation?.status);
  if (!target && !finalTarget) {
    console.error('no interrupted wave or final validation is available to resume');
    return 1;
  }
  if (target) {
    if (!['in_progress', 'failed', 'partial'].includes(target.status)) {
      console.error(`wave ${target.id} with status ${target.status} is not interrupted`);
      return 1;
    }
    for (const dependency of target.depends_on ?? []) {
      if (waves.find((wave) => wave.id === dependency)?.status !== 'validated') {
        console.error(`wave ${target.id} cannot resume before dependency ${dependency} is validated`);
        return 1;
      }
    }
    if (mode === 'continue' && (target.status !== 'in_progress' || target.attempt < 1)) {
      console.error('continue requires an in-progress wave with an existing attempt');
      return 1;
    }
  } else if (mode === 'continue' && (!state.final_validation?.agent || state.final_validation.attempt < 1 || state.final_validation.status !== 'pending')) {
    console.error('continue requires pending final validation with an assigned live validator');
    return 1;
  }

  return withClaimsLock(root, () => {
    const claims = loadClaims(root);
    const featureClaims = claims.claims.filter((claim) => claim.feature === feature);
    const targetTasks = new Set(target?.task_ids ?? []);
    const targetClaims = target ? featureClaims.filter((claim) => targetTasks.has(claim.task)) : [];
    const unexpectedClaims = target
      ? targetClaims.filter((claim) => claim.wave && claim.wave !== target.id)
      : featureClaims;
    if (unexpectedClaims.length) {
      console.error(`resume found claims outside the target: ${unexpectedClaims.map((claim) => `${claim.task}:${claim.agent}`).join(', ')}`);
      return 1;
    }
    if (mode === 'continue' && target) {
      if (targetClaims.length === 0) {
        console.error('continue requires at least one current claim for the in-progress wave');
        return 1;
      }
      const staleClaims = targetClaims.filter((claim) => claim.attempt !== target.attempt || !target.executor_agents?.includes(claim.agent));
      if (staleClaims.length) {
        console.error(`continue found stale target claims: ${staleClaims.map((claim) => `${claim.task}:${claim.agent}`).join(', ')}`);
        return 1;
      }
    }
    const now = new Date().toISOString();
    const fromAttempt = target ? target.attempt : state.final_validation.attempt;
    const abandonedClaims = mode === 'recover'
      ? targetClaims.map((claim) => ({ task: claim.task, agent: claim.agent, attempt: Number.isInteger(claim.attempt) ? claim.attempt : null }))
      : [];
    const toAttempt = mode === 'recover' ? fromAttempt + 1 : fromAttempt;
    const targetId = target?.id ?? 'final-validation';
    state.recoveries ??= [];
    state.recoveries.push({
      at: now,
      actor,
      target: targetId,
      decision: mode,
      from_attempt: fromAttempt,
      to_attempt: toAttempt,
      reason,
      abandoned_claims: abandonedClaims,
    });
    state.history ??= [];
    state.history.push({
      at: now,
      event: mode === 'recover' ? 'auto_sdd_recovered' : 'auto_sdd_continued',
      summary: `${targetId} attempt ${fromAttempt}${mode === 'recover' ? ` -> ${toAttempt}` : ''}: ${reason}`,
    });
    state.updated_at = now;

    if (mode === 'recover') {
      if (target) {
        target.attempt = toAttempt;
        target.status = 'in_progress';
        target.validator_agents = [];
        target.blockers = [];
        state.stage = 'implementation';
        spec.lifecycle.phase = 'implementation';
        spec.lifecycle.implementation = 'in_progress';
      } else {
        state.final_validation.status = 'pending';
        state.final_validation.agent = null;
        state.final_validation.attempt = toAttempt;
        state.final_validation.model_assignment = null;
        state.final_validation.scope_summary = null;
        state.stage = 'validation';
        spec.lifecycle.phase = 'validation';
        if (spec.lifecycle.implementation !== 'validated') spec.lifecycle.implementation = 'implemented';
        spec.lifecycle.validation = 'in_progress';
      }
      if (target) {
        claims.claims = claims.claims.filter((claim) => claim.feature !== feature || !targetTasks.has(claim.task));
      } else {
        claims.claims = claims.claims.filter((claim) => claim.feature !== feature);
      }
    }
    spec.updated_at = now;
    writeJsonAtomic(specFile, spec);
    writeJsonAtomic(autoFile, state);
    if (mode === 'recover') saveClaims(root, claims);
    console.log(JSON.stringify({
      feature,
      target: targetId,
      decision: mode,
      from_attempt: fromAttempt,
      to_attempt: toAttempt,
      abandoned_claims: abandonedClaims.length,
      next: mode === 'continue' ? 'reattach to the persisted live agent' : 'audit the preserved diff, assign a new explicit model, reacquire claims, and reverify the complete target',
    }));
    return 0;
  });
}

export function resumeAutoSddRun(root, args) {
  return resumeAutoSdd(root, args);
}

function status(root, args) {
  const [feature] = args;
  const dirs = activeSpecDirs(root).filter((dir) => !feature || path.basename(dir) === feature);
  if (!dirs.length) {
    console.error('spec not found');
    return 1;
  }
  const claims = loadClaims(root).claims;
  for (const dir of dirs) {
    const spec = readJson(path.join(dir, 'spec.json'));
    const tasksFile = path.join(dir, 'tasks.md');
    const progress = existsSync(tasksFile) || existsSync(path.join(dir, 'tasks.json')) ? taskProgressForDir(dir) : { done: 0, total: 0, pending: 0 };
    const activeClaims = claims.filter((entry) => entry.feature === spec.feature_name);
    const autoFile = path.join(dir, 'auto-sdd.json');
    const auto = existsSync(autoFile) ? readJson(autoFile) : null;
    const interrupted = auto?.waves?.filter((wave) => ['in_progress', 'failed', 'partial'].includes(wave.status)).map((wave) => `${wave.id}:${wave.status}:attempt-${wave.attempt}`) ?? [];
    const lastRecovery = auto?.recoveries?.at(-1);
    const autoSummary = auto ? ` auto=${auto.stage} gate=${auto.implementation_gate?.status ?? 'unknown'} waves=${auto.waves?.filter((wave) => wave.status === 'validated').length ?? 0}/${auto.waves?.length ?? 0}${interrupted.length ? ` interrupted=${interrupted.join(',')}` : ''}${lastRecovery ? ` recovery=${lastRecovery.decision}:${lastRecovery.target}:attempt-${lastRecovery.to_attempt}` : ''}` : '';
    const closureSummary = spec.closure ? ` closure=${spec.closure.reason} closed_by=${spec.closure.closed_by}` : '';
    const effectivePhase = deriveLifecyclePhase(spec.lifecycle);
    const stale = ARTIFACTS.filter((artifact) => {
      const file = path.join(dir, `${artifact}.md`);
      return spec.lifecycle?.[artifact]?.status === 'approved' && existsSync(file) && sha256(file) !== spec.lifecycle[artifact].content_hash;
    });
    const next = effectivePhase === 'requirements' ? 'generate/review requirements'
      : effectivePhase === 'design' ? 'generate/review design'
        : effectivePhase === 'tasks' ? 'generate/review tasks'
          : effectivePhase === 'implementation' ? 'claim and implement approved tasks'
            : effectivePhase === 'validation' ? 'validate implementation'
              : effectivePhase === 'complete' ? 'initialize release or close'
                : 'none';
    console.log(`${spec.feature_name}: phase=${spec.lifecycle?.phase ?? spec.phase} effective=${effectivePhase} implementation=${spec.lifecycle?.implementation ?? 'legacy'} validation=${spec.lifecycle?.validation ?? 'legacy'} tasks=${progress.done}/${progress.total} claims=${activeClaims.length} stale=${stale.length ? stale.join(',') : 'none'} next="${next}"${closureSummary}${autoSummary}`);
  }
  return 0;
}

function discoveryStatus(root, args) {
  const [name] = args;
  const dirs = activeDiscoveryDirs(root).filter((dir) => !name || path.basename(dir) === name);
  if (!dirs.length) {
    console.error('discovery not found');
    return 1;
  }
  for (const dir of dirs) {
    const discovery = readJson(path.join(dir, 'discovery.json'));
    const lifecycle = discovery.lifecycle ?? {};
    console.log(`${discovery.discovery_name}: phase=${lifecycle.phase} iteration=${discovery.iteration} market=${lifecycle.market_validation} business=${lifecycle.business_case} product=${lifecycle.product_outline} decision=${lifecycle.decision} promotion=${lifecycle.promotion}`);
  }
  return 0;
}

function flagValue(flags, name) {
  const index = flags.indexOf(name);
  const value = index >= 0 ? flags[index + 1] : undefined;
  return value && !value.startsWith('--') ? value : undefined;
}

function validManualOverride(entry, gate, decision = 'go') {
  return entry?.gate === gate
    && entry?.decision === decision
    && ['go', 'no-go'].includes(entry?.decision)
    && entry?.mode === 'manual-override'
    && typeof entry.actor === 'string'
    && entry.actor.trim()
    && !/^(?:delegated-)?auto-sdd:/i.test(entry.actor)
    && typeof entry.reason === 'string'
    && entry.reason.trim()
    && typeof entry.at === 'string'
    && !Number.isNaN(Date.parse(entry.at));
}

function manualOverride(root, args) {
  const [scope, name, gate, decision, actor, ...flags] = args;
  const reason = flagValue(flags, '--reason');
  if (!['spec', 'discovery', 'release'].includes(scope) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name ?? '') || !['go', 'no-go'].includes(decision) || !actor || !reason) {
    console.error('usage: override <spec|discovery|release> <name> <gate> <go|no-go> <actor> --reason <reason>');
    return 2;
  }
  if (/^(?:delegated-)?auto-sdd:/i.test(actor)) {
    console.error('manual override requires a human actor identity');
    return 2;
  }
  if (scope === 'spec' && !ARTIFACTS.includes(gate)) {
    console.error('invalid spec gate; use requirements, design, or tasks');
    return 2;
  }
  if (scope === 'spec' && decision === 'go') return approve(root, [name, gate, actor, '--override-reason', reason]);
  const directory = scope === 'spec' ? 'specs' : scope === 'discovery' ? 'discoveries' : 'releases';
  const metadataName = scope === 'spec' ? 'spec.json' : scope === 'discovery' ? 'discovery.json' : 'release.json';
  const file = path.join(root, '.sdd', directory, name, metadataName);
  if (!existsSync(file)) {
    console.error(`${scope} not found: ${name}`);
    return 1;
  }
  const state = readJson(file);
  const at = new Date().toISOString();
  state.gate_history ??= [];
  const record = { at, gate, decision, actor, mode: 'manual-override', reason };

  if (scope === 'spec') {
    const artifactFile = path.join(path.dirname(file), `${gate}.md`);
    if (!existsSync(artifactFile)) {
      console.error(`artifact not found: ${gate}`);
      return 1;
    }
    if (state.lifecycle?.[gate]?.status !== 'review_required') {
      console.error('spec NO-GO override requires a review_required artifact; use revise for an approved artifact');
      return 1;
    }
    record.content_hash = sha256(artifactFile);
    state.lifecycle[gate] = { status: 'review_required' };
    state.lifecycle.phase = gate;
  } else if (scope === 'discovery') {
    const transitions = {
      market_validation: { go: 'supports', 'no-go': 'contradicts', next: 'business_case' },
      business_case: { go: 'viable', 'no-go': 'unviable', next: 'product_outline' },
      product_outline: { go: 'ready', 'no-go': 'rework_required', next: 'decision' },
    };
    if (gate === 'decision') {
      state.lifecycle.decision = decision === 'go' ? 'go' : 'stop';
      state.lifecycle.phase = 'complete';
      state.lifecycle.promotion = decision === 'go' ? 'eligible' : 'not_eligible';
    } else if (transitions[gate]) {
      state.lifecycle[gate] = transitions[gate][decision];
      state.lifecycle.phase = decision === 'go' ? transitions[gate].next : gate;
    } else {
      console.error('invalid discovery gate; use market_validation, business_case, product_outline, or decision');
      return 2;
    }
  } else {
    const planning = new Set(['readiness', 'go_to_market', 'assets', 'measurement']);
    if (!planning.has(gate)) {
      console.error('invalid release gate; use readiness, go_to_market, assets, or measurement');
      return 2;
    }
    state.lifecycle[gate] = decision === 'go' ? 'ready' : gate === 'readiness' ? 'blocked' : 'rework_required';
  }

  state.gate_history.push(record);
  if (scope !== 'spec') {
    state.history ??= [];
    state.history.push({ at, event: 'manual-gate-override', note: `${gate} ${decision} by ${actor}: ${reason}`, ...(scope === 'discovery' ? { iteration: state.iteration } : {}) });
  }
  state.updated_at = at;
  writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`);
  console.log(`recorded manual ${decision} override for ${scope} ${name} ${gate}`);
  return 0;
}

export function overrideGate(root, args) {
  return manualOverride(root, args);
}

function source(root, args) {
  const [scope, name, ...flags] = args;
  if (!['discovery', 'release'].includes(scope) || !name) {
    console.error('usage: source <discovery|release> <name> [--url URL | --reference REF --evidence-type TYPE] --title TITLE --source-type TYPE --direction supports|contradicts|constrains|context --claim CLAIM --note NOTE [--captured-at ISO_TIMESTAMP]');
    return 2;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    console.error('source name must be lowercase kebab-case');
    return 2;
  }
  const directory = scope === 'discovery' ? 'discoveries' : 'releases';
  const dir = path.join(root, '.sdd', directory, name);
  if (!existsSync(dir)) {
    console.error(`${scope} not found: ${name}`);
    return 1;
  }
  const record = {
    captured_at: flagValue(flags, '--captured-at') ?? new Date().toISOString(),
    url: flagValue(flags, '--url'),
    reference: flagValue(flags, '--reference'),
    evidence_type: flagValue(flags, '--evidence-type') ?? 'web',
    evidence_id: flagValue(flags, '--evidence-id'),
    method: flagValue(flags, '--method'),
    confidence: flagValue(flags, '--confidence'),
    limitations: flagValue(flags, '--limitations'),
    fresh_until: flagValue(flags, '--fresh-until'),
    title: flagValue(flags, '--title'),
    source_type: flagValue(flags, '--source-type'),
    direction: flagValue(flags, '--direction'),
    claim: flagValue(flags, '--claim'),
    note: flagValue(flags, '--note'),
  };
  const errors = validateResearchSource(record);
  if (errors.length) {
    for (const error of errors) console.error(`invalid research source: ${error}`);
    return 2;
  }
  appendFileSync(path.join(dir, 'research-sources.jsonl'), `${JSON.stringify(record)}\n`);
  console.log(`recorded research source for ${scope} ${name}`);
  return 0;
}

export function recordResearchSource(root, args) {
  return source(root, args);
}

function main() {
  const [command = 'help', ...args] = process.argv.slice(2);
  const root = process.cwd();
  if (command === 'lint') return lint(root);
  if (command === 'claim') return claim(root, args);
  if (command === 'claims-unlock') return unlockClaims(root, args);
  if (command === 'release') return release(root, args);
  if (command === 'evidence') return evidence(root, args);
  if (command === 'approve') return approve(root, args);
  if (command === 'revise') return revise(root, args);
  if (command === 'status') return status(root, args);
  if (command === 'resume') return resumeAutoSdd(root, args);
  if (command === 'close') return closeSpec(root, args);
  if (command === 'discovery-status') return discoveryStatus(root, args);
  if (command === 'source') return source(root, args);
  if (command === 'override') return manualOverride(root, args);
  console.log('usage: node .sdd/tools/sdd.mjs <lint|status|resume|close|discovery-status|approve|revise|override|claim|claims-unlock|release|evidence|source> [arguments]');
  return command === 'help' ? 0 : 2;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exitCode = main();
}
