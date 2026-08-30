import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { approveArtifact, autoSddPlanHash, autoSddValidationPolicyHash, buildExecutionWaves, claimTask, closeSpecification, deriveLifecyclePhase, overrideGate, parseRequirementIds, parseTaskRecords, parseTaskRequirementIds, recordResearchSource, releaseTask, resumeAutoSddRun, reviseArtifact, scopesOverlap, sha256, taskProgress, validateAutoSddDirectory, validateDiscoveryDirectory, validateReleaseDirectory, validateResearchSource } from './sdd.mjs';

test('parses localized numeric acceptance criteria', () => {
  const markdown = `### Requisito 1: Login\n1. Quando solicitado, o app deve entrar.\n2. Se falhar, o app deve informar.\n### Requirement 2: Logout\n1. When requested, the app shall sign out.`;
  assert.deepEqual(parseRequirementIds(markdown), ['1.1', '1.2', '2.1']);
});

test('parses explicit N.M acceptance criterion IDs', () => {
  const markdown = `### Requirement 3: Funnel\n3.1 When started, the app shall track.\n3.2. If denied, the app shall continue.`;
  assert.deepEqual(parseRequirementIds(markdown), ['3.1', '3.2']);
});

test('parses task requirement mappings', () => {
  assert.deepEqual(parseTaskRequirementIds('- _Requirements: 1.1, 2.3_\n- _Requirements: 1.1_'), ['1.1', '2.3']);
});

test('detects overlapping path scopes', () => {
  assert.equal(scopesOverlap('MobileApp-iOS/App', 'MobileApp-iOS/App/Sources'), true);
  assert.equal(scopesOverlap('MobileApp-iOS', 'Product-backend'), false);
});

test('counts leaf task progress without container duplication', () => {
  const markdown = `- [ ] 1. Container\n- [x] 1.1 First\n- [ ] 1.2 Second\n- [x] 2. Standalone`;
  assert.deepEqual(taskProgress(markdown), { done: 2, total: 3, pending: 1 });
});

test('builds dependency waves from leaf tasks and only co-schedules safe parallel work', () => {
  const markdown = `- [ ] 1. Foundations
- [ ] 1.1 (P) Build iOS boundary
  - _Dependencies: none_
  - _Write Scope: Mobile-iOS/App_
- [ ] 1.2 (P) Build backend boundary
  - _Dependencies: none_
  - _Write Scope: Service-backend/src_
- [ ] 2. Integrate boundaries
  - _Dependencies: 1.1, 1.2_
  - _Write Scope: integration_
`;
  const records = parseTaskRecords(markdown);
  assert.deepEqual(records.map((record) => record.id), ['1.1', '1.2', '2']);
  assert.deepEqual(buildExecutionWaves(records), [
    { id: 'wave-1', task_ids: ['1.1', '1.2'], depends_on: [] },
    { id: 'wave-2', task_ids: ['2'], depends_on: ['wave-1'] },
  ]);
  assert.deepEqual(buildExecutionWaves(records, 1).map((wave) => wave.task_ids), [['1.1'], ['1.2'], ['2']]);
  const overlapping = parseTaskRecords(`- [ ] 1 (P) First\n  - _Dependencies: none_\n  - _Write Scope: app_\n- [ ] 2 (P) Second\n  - _Dependencies: none_\n  - _Write Scope: app/feature_\n`);
  assert.deepEqual(buildExecutionWaves(overlapping).map((wave) => wave.task_ids), [['1'], ['2']]);
});

test('recognizes the canonical parallel marker at the end of a task description', () => {
  const records = parseTaskRecords(`- [ ] 1. First task (P)\n  - _Dependencies: none_\n  - _Write Scope: a_\n- [ ] 2. Second task (P)\n  - _Dependencies: none_\n  - _Write Scope: b_\n`);
  assert.equal(records.every((record) => record.parallel), true);
  assert.deepEqual(buildExecutionWaves(records).map((wave) => wave.task_ids), [['1', '2']]);
});

test('derives the effective lifecycle phase from artifact and execution states', () => {
  assert.equal(deriveLifecyclePhase({ requirements: { status: 'draft' } }), 'requirements');
  assert.equal(deriveLifecyclePhase({ requirements: { status: 'approved' }, design: { status: 'approved' }, tasks: { status: 'approved' }, implementation: 'not_started', validation: 'not_started' }), 'implementation');
  assert.equal(deriveLifecyclePhase({ requirements: { status: 'approved' }, design: { status: 'approved' }, tasks: { status: 'approved' }, implementation: 'validated', validation: 'passed' }), 'complete');
});

test('uses the canonical task ledger for claims and requires passed completion evidence', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-task-ledger-'));
  const dir = path.join(root, '.sdd/specs/ledger-feature');
  const previousBase = process.env.SDD_BASE_COMMIT;
  try {
    process.env.SDD_BASE_COMMIT = 'test-base';
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'spec.json'), `${JSON.stringify({
      schema_version: 2,
      feature_name: 'ledger-feature',
      lifecycle: {
        phase: 'implementation',
        requirements: { status: 'approved' },
        design: { status: 'approved' },
        tasks: { status: 'approved' },
        implementation: 'not_started',
        validation: 'not_started',
      },
    })}\n`);
    writeFileSync(path.join(dir, 'tasks.json'), `${JSON.stringify({
      schema_version: 1,
      feature: 'ledger-feature',
      tasks: [{
        id: '1', title: 'Implement', status: 'pending', optional: false, parallel: false,
        requirements: ['1.1'], dependencies: [], write_scope: ['app/feature'], verification: 'test-first', evidence: 'focused test',
      }],
    })}\n`);
    assert.equal(claimTask(root, ['ledger-feature', '1', 'agent-a', '--scope', 'app/feature']), 0);
    writeFileSync(path.join(dir, 'evidence.jsonl'), `${JSON.stringify({ feature: 'ledger-feature', task: '1', agent: 'agent-a', kind: 'test', status: 'failed' })}\n`);
    assert.equal(releaseTask(root, ['ledger-feature', '1', 'agent-a']), 1);
    writeFileSync(path.join(dir, 'evidence.jsonl'), `${JSON.stringify({ feature: 'ledger-feature', task: '1', agent: 'agent-a', kind: 'test', status: 'passed' })}\n`);
    assert.equal(releaseTask(root, ['ledger-feature', '1', 'agent-a']), 0);
  } finally {
    if (previousBase === undefined) delete process.env.SDD_BASE_COMMIT;
    else process.env.SDD_BASE_COMMIT = previousBase;
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejects missing or cyclic task dependencies during wave planning', () => {
  const missing = parseTaskRecords(`- [ ] 1. Work\n  - _Dependencies: 9_\n  - _Write Scope: app_\n`);
  assert.throws(() => buildExecutionWaves(missing), /unknown dependencies/);
  const cyclic = parseTaskRecords(`- [ ] 1. First\n  - _Dependencies: 2_\n  - _Write Scope: a_\n- [ ] 2. Second\n  - _Dependencies: 1_\n  - _Write Scope: b_\n`);
  assert.throws(() => buildExecutionWaves(cyclic), /cycle or blocked dependency/);
  const optionalDependency = parseTaskRecords(`- [ ]* 1. Optional test\n  - _Dependencies: none_\n  - _Write Scope: tests_\n- [ ] 2. Required work\n  - _Dependencies: 1_\n  - _Write Scope: app_\n`);
  assert.throws(() => buildExecutionWaves(optionalDependency), /depends on optional unfinished tasks/);
});

function writeAutoSddFixture(dir) {
  mkdirSync(dir, { recursive: true });
  const tasks = `- [ ] 1. Implement feature\n  - _Requirements: 1.1_\n  - _Dependencies: none_\n  - _Write Scope: app/feature_\n  - _Verification: test-first_\n  - _Evidence: focused tests_\n`;
  writeFileSync(path.join(dir, 'requirements.md'), '# Requirements\n### Requirement 1\n1.1 The app shall work.\n');
  writeFileSync(path.join(dir, 'design.md'), '# Design\n');
  writeFileSync(path.join(dir, 'tasks.md'), tasks);
  const requirementsHash = 'a'.repeat(64);
  const designHash = 'b'.repeat(64);
  const tasksHash = 'c'.repeat(64);
  writeFileSync(path.join(dir, 'spec.json'), `${JSON.stringify({
    schema_version: 2,
    feature_name: path.basename(dir),
    created_at: '2026-07-14T12:00:00.000Z',
    updated_at: '2026-07-14T12:00:00.000Z',
    language: 'en', revision: 1, task_contract_version: 2, context_profiles: [],
    lifecycle: {
      phase: 'tasks',
      requirements: { status: 'approved', approved_by: 'delegated-auto-sdd:agent', approved_at: '2026-07-14T12:00:00.000Z', content_hash: requirementsHash },
      design: { status: 'approved', approved_by: 'delegated-auto-sdd:agent', approved_at: '2026-07-14T12:00:00.000Z', content_hash: designHash },
      tasks: { status: 'approved', approved_by: 'delegated-auto-sdd:agent', approved_at: '2026-07-14T12:00:00.000Z', content_hash: tasksHash },
      implementation: 'not_started', validation: 'not_started',
    },
  }, null, 2)}\n`);
  const waves = [{ id: 'wave-1', task_ids: ['1'], depends_on: [], status: 'pending', attempt: 0, executor_agents: [], validator_agents: [], blockers: [] }];
  const state = {
    schema_version: 1, feature: path.basename(dir), mode: 'auto-sdd',
    started_at: '2026-07-14T12:00:00.000Z', updated_at: '2026-07-14T12:00:00.000Z', initiated_by: 'user',
    stage: 'awaiting_implementation_approval',
    artifact_hashes: { requirements: requirementsHash, design: designHash, tasks: tasksHash },
    reviews: {
      requirements: { status: 'passed', content_hash: requirementsHash, reviewed_at: '2026-07-14T12:00:00.000Z', reviewer: 'agent', attempt: 1 },
      design: { status: 'passed', content_hash: designHash, reviewed_at: '2026-07-14T12:00:00.000Z', reviewer: 'agent', attempt: 1 },
      tasks: { status: 'passed', content_hash: tasksHash, reviewed_at: '2026-07-14T12:00:00.000Z', reviewer: 'agent', attempt: 1 },
    },
    correction_cycles: { requirements: 0, design: 0, tasks: 0, implementation: 0, validation: 0 },
    implementation_gate: { status: 'pending', approved_by: null, approved_at: null, spec_revision: null, requirements_hash: null, design_hash: null, tasks_hash: null, plan_hash: null },
    plan_hash: autoSddPlanHash(waves), waves, final_validation: { status: 'pending', agent: null, attempt: 0 }, history: [],
  };
  writeFileSync(path.join(dir, 'auto-sdd.json'), `${JSON.stringify(state, null, 2)}\n`);
  return state;
}

test('validates a pending auto-sdd implementation boundary and rejects stale or non-independent execution', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-auto-'));
  const dir = path.join(root, 'sample-feature');
  try {
    const state = writeAutoSddFixture(dir);
    assert.deepEqual(validateAutoSddDirectory(dir), []);
    state.stage = 'implementation';
    state.implementation_gate = {
      status: 'approved', approved_by: 'user', approved_at: '2026-07-14T13:00:00.000Z', spec_revision: 1,
      requirements_hash: 'a'.repeat(64), design_hash: 'b'.repeat(64), tasks_hash: 'c'.repeat(64), plan_hash: state.plan_hash,
    };
    state.waves[0] = { ...state.waves[0], status: 'validated', attempt: 1, executor_agents: ['agent-a'], validator_agents: ['agent-b'] };
    writeFileSync(path.join(dir, 'tasks.md'), readFileSync(path.join(dir, 'tasks.md'), 'utf8').replace('- [ ] 1.', '- [x] 1.'));
    writeFileSync(path.join(dir, 'auto-sdd.json'), `${JSON.stringify(state, null, 2)}\n`);
    writeFileSync(path.join(dir, 'evidence.jsonl'), `${JSON.stringify({ feature: 'sample-feature', task: '1', agent: 'agent-a', kind: 'test', status: 'passed', role: 'executor', wave: 'wave-1', attempt: 1 })}\n${JSON.stringify({ feature: 'sample-feature', task: 'wave-1', agent: 'agent-b', kind: 'review', status: 'passed', role: 'validator', wave: 'wave-1', attempt: 1 })}\n`);
    assert.deepEqual(validateAutoSddDirectory(dir), []);
    state.implementation_gate.tasks_hash = 'stale';
    state.waves[0].attempt = 2;
    state.waves[0].validator_agents = ['agent-a'];
    writeFileSync(path.join(dir, 'auto-sdd.json'), `${JSON.stringify(state, null, 2)}\n`);
    const errors = validateAutoSddDirectory(dir);
    assert.equal(errors.some((error) => error.includes('gate is stale')), true);
    assert.equal(errors.some((error) => error.includes('also implemented the wave')), true);
    assert.equal(errors.some((error) => error.includes('current passed executor evidence')), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('requires explicit lowest-cost adequate models for new auto-sdd runs while preserving legacy state', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-auto-model-'));
  const dir = path.join(root, 'sample-feature');
  try {
    const state = writeAutoSddFixture(dir);
    assert.deepEqual(validateAutoSddDirectory(dir), []);
    state.model_policy = {
      strategy: 'lowest-adequate',
      require_explicit_model: true,
      on_no_adequate_model: 'block',
      provider: 'codex',
      cataloged_at: '2026-07-17T12:00:00.000Z',
      catalog: [
        { model: 'gpt-5.6-terra', capability: 'advanced', cost_rank: 1 },
        { model: 'gpt-5.6-sol', capability: 'frontier', cost_rank: 2 },
      ],
    };
    state.waves[0].model_requirements = {
      executor: { capability: 'routine', risk_factors: ['localized'], rationale: 'Localized implementation with focused tests.' },
      validator: { capability: 'advanced', risk_factors: ['broad-regression'], rationale: 'Independent integration review.' },
    };
    state.waves[0].model_assignments = [];
    state.final_validation = {
      status: 'pending',
      agent: null,
      attempt: 0,
      model_requirement: { capability: 'frontier', risk_factors: ['broad-regression'], rationale: 'Complete feature validation.' },
      model_assignment: null,
    };
    state.plan_hash = autoSddPlanHash(state.waves);
    writeFileSync(path.join(dir, 'auto-sdd.json'), `${JSON.stringify(state, null, 2)}\n`);
    assert.deepEqual(validateAutoSddDirectory(dir), []);

    state.waves[0].executor_agents = ['agent-a'];
    state.waves[0].model_assignments = [{
      agent: 'agent-a', role: 'executor', model: 'gpt-5.6-sol', capability: 'frontier', cost_rank: 2, rationale: 'Inherited coordinator model.',
    }];
    writeFileSync(path.join(dir, 'auto-sdd.json'), `${JSON.stringify(state, null, 2)}\n`);
    assert.equal(validateAutoSddDirectory(dir).some((error) => error.includes('not the lowest-cost adequate model')), true);

    state.waves[0].model_assignments[0] = {
      agent: 'agent-a', role: 'executor', model: 'gpt-5.6-terra', capability: 'advanced', cost_rank: 1, rationale: 'Lowest-cost model meeting routine capability.',
    };
    writeFileSync(path.join(dir, 'auto-sdd.json'), `${JSON.stringify(state, null, 2)}\n`);
    assert.deepEqual(validateAutoSddDirectory(dir), []);

    state.waves[0].model_assignments = [];
    writeFileSync(path.join(dir, 'auto-sdd.json'), `${JSON.stringify(state, null, 2)}\n`);
    assert.equal(validateAutoSddDirectory(dir).some((error) => error.includes('lacks an explicit model assignment')), true);

    state.waves[0].executor_agents = [];
    state.model_policy.catalog = [{ model: 'gpt-5.6-terra', capability: 'advanced', cost_rank: 1 }];
    writeFileSync(path.join(dir, 'auto-sdd.json'), `${JSON.stringify(state, null, 2)}\n`);
    assert.equal(validateAutoSddDirectory(dir).some((error) => error.includes('final validation has no adequate model')), true);

    state.model_policy = {
      ...state.model_policy,
      provider: 'claude',
      catalog: [
        { model: 'claude-haiku-4-5-20251001', capability: 'routine', cost_rank: 1 },
        { model: 'claude-sonnet-5', capability: 'advanced', cost_rank: 2 },
        { model: 'claude-opus-4-8', capability: 'frontier', cost_rank: 3 },
      ],
    };
    state.waves[0].executor_agents = ['claude-executor'];
    state.waves[0].model_requirements.executor = { capability: 'advanced', risk_factors: ['cross-component'], rationale: 'Cross-component Claude implementation.' };
    state.waves[0].model_assignments = [{
      agent: 'claude-executor', role: 'executor', model: 'claude-sonnet-5', capability: 'advanced', cost_rank: 2, rationale: 'Lowest-cost Claude model meeting advanced capability.',
    }];
    state.plan_hash = autoSddPlanHash(state.waves);
    writeFileSync(path.join(dir, 'auto-sdd.json'), `${JSON.stringify(state, null, 2)}\n`);
    assert.deepEqual(validateAutoSddDirectory(dir), []);

    state.waves[0].model_assignments[0] = {
      agent: 'claude-executor', role: 'executor', model: 'claude-opus-4-8', capability: 'frontier', cost_rank: 3, rationale: 'More capable Claude model than required.',
    };
    writeFileSync(path.join(dir, 'auto-sdd.json'), `${JSON.stringify(state, null, 2)}\n`);
    assert.equal(validateAutoSddDirectory(dir).some((error) => error.includes('not the lowest-cost adequate model')), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('reuses one independent validator for lean completion and promotes critical risks', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-auto-lean-'));
  const dir = path.join(root, 'sample-feature');
  try {
    const state = writeAutoSddFixture(dir);
    const policy = {
      profile: 'lean',
      selected_at: '2026-07-18T12:00:00.000Z',
      rationale: 'Localized reversible single-wave change using a known pattern.',
      risk_factors: ['localized', 'single-wave', 'reversible', 'known-pattern'],
      artifact_review_mode: 'hash-reuse-focused',
      wave_validation_mode: 'dependency-boundary',
      final_validation_mode: 'reuse-single-wave',
    };
    state.validation_policy = policy;
    state.validation_policy_hash = autoSddValidationPolicyHash(policy);
    state.model_policy = {
      strategy: 'lowest-adequate', require_explicit_model: true, on_no_adequate_model: 'block',
      provider: 'codex', cataloged_at: '2026-07-18T12:00:00.000Z',
      catalog: [{ model: 'gpt-5.6-terra', capability: 'advanced', cost_rank: 1 }],
    };
    state.waves[0] = {
      ...state.waves[0],
      status: 'validated', attempt: 1, executor_agents: ['executor-a'], validator_agents: ['validator-a'],
      model_requirements: {
        executor: { capability: 'routine', risk_factors: ['localized'], rationale: 'Localized implementation.' },
        validator: { capability: 'advanced', risk_factors: ['broad-regression'], rationale: 'Complete independent feature review.' },
      },
      model_assignments: [
        { agent: 'executor-a', role: 'executor', model: 'gpt-5.6-terra', capability: 'advanced', cost_rank: 1, rationale: 'Lowest adequate available model.' },
        { agent: 'validator-a', role: 'validator', model: 'gpt-5.6-terra', capability: 'advanced', cost_rank: 1, rationale: 'Lowest adequate available model.' },
      ],
    };
    state.plan_hash = autoSddPlanHash(state.waves);
    state.stage = 'complete';
    state.implementation_gate = {
      status: 'approved', approved_by: 'user', approved_at: '2026-07-18T12:05:00.000Z', spec_revision: 1,
      requirements_hash: 'a'.repeat(64), design_hash: 'b'.repeat(64), tasks_hash: 'c'.repeat(64),
      plan_hash: state.plan_hash, validation_policy_hash: state.validation_policy_hash,
    };
    state.final_validation = {
      status: 'passed', agent: 'validator-a', attempt: 1, mode: 'reuse-single-wave', reused_wave: 'wave-1',
      scope_summary: 'The wave review covered the complete feature and focused regression.',
      model_requirement: { capability: 'advanced', risk_factors: ['broad-regression'], rationale: 'Complete lean feature review.' },
      model_assignment: { agent: 'validator-a', role: 'validator', model: 'gpt-5.6-terra', capability: 'advanced', cost_rank: 1, rationale: 'Reused independent complete-feature validator.' },
    };
    const spec = JSON.parse(readFileSync(path.join(dir, 'spec.json'), 'utf8'));
    spec.lifecycle.phase = 'complete';
    spec.lifecycle.implementation = 'validated';
    spec.lifecycle.validation = 'passed';
    writeFileSync(path.join(dir, 'spec.json'), `${JSON.stringify(spec, null, 2)}\n`);
    writeFileSync(path.join(dir, 'tasks.md'), readFileSync(path.join(dir, 'tasks.md'), 'utf8').replace('- [ ] 1.', '- [x] 1.'));
    writeFileSync(path.join(dir, 'evidence.jsonl'), [
      { feature: 'sample-feature', task: '1', agent: 'executor-a', kind: 'test', status: 'passed', role: 'executor', wave: 'wave-1', attempt: 1 },
      { feature: 'sample-feature', task: 'wave-1', agent: 'validator-a', kind: 'review', status: 'passed', role: 'validator', wave: 'wave-1', attempt: 1 },
      { feature: 'sample-feature', task: 'final-validation', agent: 'validator-a', kind: 'review', status: 'passed', role: 'validator', wave: 'wave-1', attempt: 1 },
    ].map((event) => JSON.stringify(event)).join('\n') + '\n');
    writeFileSync(path.join(dir, 'auto-sdd.json'), `${JSON.stringify(state, null, 2)}\n`);
    assert.deepEqual(validateAutoSddDirectory(dir), []);

    state.validation_policy.risk_factors.push('security');
    state.validation_policy_hash = autoSddValidationPolicyHash(state.validation_policy);
    state.implementation_gate.validation_policy_hash = state.validation_policy_hash;
    writeFileSync(path.join(dir, 'auto-sdd.json'), `${JSON.stringify(state, null, 2)}\n`);
    assert.equal(validateAutoSddDirectory(dir).some((error) => error.includes('critical validation risks require the critical profile')), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('resumes live auto-sdd work in place and recovers lost wave and final-validation attempts', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-auto-resume-'));
  const dir = path.join(root, '.sdd/specs/sample-feature');
  try {
    const state = writeAutoSddFixture(dir);
    const specFile = path.join(dir, 'spec.json');
    const autoFile = path.join(dir, 'auto-sdd.json');
    const spec = JSON.parse(readFileSync(specFile, 'utf8'));
    for (const artifact of ['requirements', 'design', 'tasks']) {
      const hash = sha256(path.join(dir, `${artifact}.md`));
      spec.lifecycle[artifact].content_hash = hash;
      state.artifact_hashes[artifact] = hash;
      state.reviews[artifact].content_hash = hash;
    }
    spec.lifecycle.phase = 'implementation';
    spec.lifecycle.implementation = 'in_progress';
    state.stage = 'implementation';
    state.waves[0] = {
      ...state.waves[0],
      status: 'in_progress',
      attempt: 1,
      executor_agents: ['executor-old'],
      validator_agents: ['validator-stale'],
      blockers: ['session interrupted'],
    };
    state.plan_hash = autoSddPlanHash(state.waves);
    state.implementation_gate = {
      status: 'approved',
      approved_by: 'user',
      approved_at: '2026-07-19T12:00:00.000Z',
      spec_revision: spec.revision,
      requirements_hash: state.artifact_hashes.requirements,
      design_hash: state.artifact_hashes.design,
      tasks_hash: state.artifact_hashes.tasks,
      plan_hash: state.plan_hash,
    };
    writeFileSync(specFile, `${JSON.stringify(spec, null, 2)}\n`);
    writeFileSync(autoFile, `${JSON.stringify(state, null, 2)}\n`);
    mkdirSync(path.join(root, '.sdd/runtime'), { recursive: true });
    writeFileSync(path.join(root, '.sdd/runtime/claims.json'), `${JSON.stringify({
      version: 1,
      claims: [{
        feature: 'sample-feature',
        task: '1',
        agent: 'executor-old',
        scopes: ['app/feature'],
        base_commit: 'base',
        claimed_at: '2026-07-19T12:00:00.000Z',
        wave: 'wave-1',
        attempt: 1,
      }],
    }, null, 2)}\n`);

    assert.equal(resumeAutoSddRun(root, ['sample-feature', 'coordinator', '--mode', 'continue', '--reason', 'Live executor reattached.']), 0);
    let resumed = JSON.parse(readFileSync(autoFile, 'utf8'));
    let claims = JSON.parse(readFileSync(path.join(root, '.sdd/runtime/claims.json'), 'utf8'));
    assert.equal(resumed.waves[0].attempt, 1);
    assert.equal(resumed.recoveries[0].decision, 'continue');
    assert.equal(claims.claims.length, 1);

    assert.equal(resumeAutoSddRun(root, ['sample-feature', 'coordinator', '--mode', 'recover', '--reason', 'Executor session was lost.']), 0);
    resumed = JSON.parse(readFileSync(autoFile, 'utf8'));
    claims = JSON.parse(readFileSync(path.join(root, '.sdd/runtime/claims.json'), 'utf8'));
    assert.equal(resumed.waves[0].attempt, 2);
    assert.equal(resumed.waves[0].status, 'in_progress');
    assert.deepEqual(resumed.waves[0].validator_agents, []);
    assert.deepEqual(resumed.waves[0].executor_agents, ['executor-old']);
    assert.equal(resumed.recoveries[1].abandoned_claims[0].agent, 'executor-old');
    assert.equal(claims.claims.length, 0);
    assert.deepEqual(validateAutoSddDirectory(dir), []);

    resumed.waves[0].status = 'validated';
    resumed.final_validation = { status: 'pending', agent: 'final-old', attempt: 1 };
    resumed.stage = 'validation';
    const validationSpec = JSON.parse(readFileSync(specFile, 'utf8'));
    validationSpec.lifecycle.phase = 'validation';
    validationSpec.lifecycle.implementation = 'implemented';
    validationSpec.lifecycle.validation = 'in_progress';
    writeFileSync(specFile, `${JSON.stringify(validationSpec, null, 2)}\n`);
    writeFileSync(autoFile, `${JSON.stringify(resumed, null, 2)}\n`);
    assert.equal(resumeAutoSddRun(root, ['sample-feature', 'coordinator', '--mode', 'recover', '--reason', 'Final validator session was lost.']), 0);
    resumed = JSON.parse(readFileSync(autoFile, 'utf8'));
    assert.equal(resumed.final_validation.attempt, 2);
    assert.equal(resumed.final_validation.agent, null);
    assert.equal(resumed.recoveries.at(-1).target, 'final-validation');

    resumed.waves[0].status = 'in_progress';
    resumed.stage = 'implementation';
    resumed.implementation_gate.tasks_hash = 'd'.repeat(64);
    writeFileSync(autoFile, `${JSON.stringify(resumed, null, 2)}\n`);
    assert.equal(resumeAutoSddRun(root, ['sample-feature', 'coordinator', '--mode', 'recover', '--reason', 'Try stale recovery.']), 1);
    assert.equal(JSON.parse(readFileSync(autoFile, 'utf8')).waves[0].attempt, 2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('closes obsolete specs without reconciling artifacts or running auto-sdd validation', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-close-'));
  const dir = path.join(root, '.sdd/specs/old-feature');
  try {
    writeAutoSddFixture(dir);
    const tasksFile = path.join(dir, 'tasks.md');
    const historicalTasks = `${readFileSync(tasksFile, 'utf8')}\nHistorical stale note.\n`;
    writeFileSync(tasksFile, historicalTasks);
    mkdirSync(path.join(root, '.sdd/runtime'), { recursive: true });
    writeFileSync(path.join(root, '.sdd/runtime/claims.json'), `${JSON.stringify({
      version: 1,
      claims: [{ feature: 'old-feature', task: '1', agent: 'agent-a', scopes: ['app/feature'], base_commit: 'base', claimed_at: '2026-07-17T12:00:00.000Z' }],
    }, null, 2)}\n`);

    assert.equal(closeSpecification(root, ['old-feature', 'no-longer-needed', 'user', '--note', 'Product direction changed.']), 1);
    writeFileSync(path.join(root, '.sdd/runtime/claims.json'), '{"version":1,"claims":[]}\n');
    assert.equal(closeSpecification(root, ['old-feature', 'no-longer-needed', 'user', '--note', 'Product direction changed.']), 0);

    const spec = JSON.parse(readFileSync(path.join(dir, 'spec.json'), 'utf8'));
    const auto = JSON.parse(readFileSync(path.join(dir, 'auto-sdd.json'), 'utf8'));
    assert.equal(spec.lifecycle.phase, 'closed');
    assert.equal(spec.lifecycle.implementation, 'not_started');
    assert.equal(spec.lifecycle.validation, 'not_started');
    assert.equal(spec.closure.reason, 'no-longer-needed');
    assert.equal(spec.closure.prior_phase, 'tasks');
    assert.equal(spec.ready_for_implementation, false);
    assert.equal(auto.stage, 'closed');
    assert.equal(auto.implementation_gate.status, 'revoked');
    assert.equal(readFileSync(tasksFile, 'utf8'), historicalTasks);
    assert.deepEqual(validateAutoSddDirectory(dir), []);
    assert.equal(claimTask(root, ['old-feature', '1', 'agent-b', '--scope', 'app/feature']), 1);

    const legacyDir = path.join(root, '.sdd/specs/legacy-feature');
    mkdirSync(legacyDir, { recursive: true });
    const legacyRequirements = '# Legacy requirements\nHistorical content must remain byte-identical.\n';
    writeFileSync(path.join(legacyDir, 'requirements.md'), legacyRequirements);
    writeFileSync(path.join(legacyDir, 'spec.json'), `${JSON.stringify({
      feature_name: 'legacy-feature',
      phase: 'requirements-generated',
      approvals: {
        requirements: { generated: true, approved: false },
        design: { generated: false, approved: false },
        tasks: { generated: false, approved: false },
      },
    }, null, 2)}\n`);
    assert.equal(closeSpecification(root, ['legacy-feature', 'obsolete', 'user', '--note', 'Legacy direction was retired.']), 0);
    const legacySpec = JSON.parse(readFileSync(path.join(legacyDir, 'spec.json'), 'utf8'));
    assert.equal(legacySpec.schema_version, 2);
    assert.equal(legacySpec.lifecycle.phase, 'closed');
    assert.equal(legacySpec.closure.prior_phase, 'requirements');
    assert.equal(legacySpec.migration_history.at(-1).event, 'closure_metadata_upgrade');
    assert.equal(readFileSync(path.join(legacyDir, 'requirements.md'), 'utf8'), legacyRequirements);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('approval helper hashes the final bytes and synchronizes legacy task approval', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-approve-'));
  const dir = path.join(root, '.sdd/specs/sample');
  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'requirements.md'), '# Requirements\n');
    writeFileSync(path.join(dir, 'design.md'), '# Design\n');
    writeFileSync(path.join(dir, 'tasks.md'), '# Tasks\n');
    writeFileSync(path.join(dir, 'spec.json'), `${JSON.stringify({
      schema_version: 2, feature_name: 'sample', updated_at: '2026-07-14T12:00:00.000Z', revision: 1,
      lifecycle: { requirements: { status: 'approved' }, design: { status: 'approved' }, tasks: { status: 'review_required' } },
      approvals: { tasks: { generated: true, approved: false } }, ready_for_implementation: false,
    }, null, 2)}\n`);
    writeFileSync(path.join(dir, 'auto-sdd.json'), `${JSON.stringify({
      artifact_hashes: { requirements: null, design: null, tasks: null },
      reviews: { tasks: { status: 'passed', content_hash: sha256(path.join(dir, 'tasks.md')), reviewed_at: '2026-07-14T12:00:00.000Z', reviewer: null, attempt: 1 } },
      updated_at: '2026-07-14T12:00:00.000Z',
    })}\n`);
    assert.equal(approveArtifact(root, ['sample', 'tasks', 'agent-1', '--mode', 'delegated-auto-sdd']), 1);
    const autoState = JSON.parse(readFileSync(path.join(dir, 'auto-sdd.json'), 'utf8'));
    autoState.reviews.tasks.reviewer = 'reviewer';
    writeFileSync(path.join(dir, 'auto-sdd.json'), `${JSON.stringify(autoState)}\n`);
    assert.equal(approveArtifact(root, ['sample', 'tasks', 'agent-1', '--mode', 'delegated-auto-sdd']), 0);
    const spec = JSON.parse(readFileSync(path.join(dir, 'spec.json'), 'utf8'));
    assert.match(spec.lifecycle.tasks.content_hash, /^[a-f0-9]{64}$/);
    assert.equal(spec.lifecycle.tasks.approved_by, 'delegated-auto-sdd:agent-1');
    assert.equal(spec.approvals.tasks.approved, true);
    assert.equal(spec.ready_for_implementation, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('records human NO-GO and GO decisions for a spec review gate', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-spec-override-'));
  const dir = path.join(root, '.sdd/specs/manual-review');
  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'design.md'), '# Design under review\n');
    writeFileSync(path.join(dir, 'spec.json'), `${JSON.stringify({
      schema_version: 2, feature_name: 'manual-review', created_at: '2026-07-20T12:00:00.000Z', updated_at: '2026-07-20T12:00:00.000Z',
      language: 'en', revision: 1, task_contract_version: 3, context_profiles: [],
      lifecycle: {
        phase: 'design',
        requirements: { status: 'approved', approved_by: 'manual:owner', approved_at: '2026-07-20T12:00:00.000Z', content_hash: 'a'.repeat(64) },
        design: { status: 'review_required' },
        tasks: { status: 'missing' },
        implementation: 'not_started', validation: 'not_started',
      },
      gate_history: [],
    }, null, 2)}\n`);
    assert.equal(overrideGate(root, ['spec', 'manual-review', 'design', 'no-go', 'product-owner', '--reason', 'The rollback contract is incomplete']), 0);
    assert.equal(overrideGate(root, ['spec', 'manual-review', 'design', 'go', 'product-owner', '--reason', 'Accept the documented rollback risk for the pilot']), 0);
    const spec = JSON.parse(readFileSync(path.join(dir, 'spec.json'), 'utf8'));
    assert.deepEqual(spec.gate_history.map((entry) => entry.decision), ['no-go', 'go']);
    assert.equal(spec.gate_history.at(-1).mode, 'manual-override');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('auto-sdd claims require the manual gate and release only after current validated evidence', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-auto-claim-'));
  const dir = path.join(root, '.sdd/specs/sample-feature');
  try {
    const state = writeAutoSddFixture(dir);
    assert.equal(claimTask(root, ['sample-feature', '1', 'agent-a', '--scope', 'app/feature']), 1);
    state.stage = 'implementation';
    state.implementation_gate = {
      status: 'approved', approved_by: 'auto-sdd:agent', approved_at: '2026-07-14T13:00:00.000Z', spec_revision: 1,
      requirements_hash: 'a'.repeat(64), design_hash: 'b'.repeat(64), tasks_hash: 'c'.repeat(64), plan_hash: state.plan_hash,
    };
    state.waves[0] = { ...state.waves[0], status: 'in_progress', attempt: 1, executor_agents: ['agent-a'] };
    writeFileSync(path.join(dir, 'auto-sdd.json'), `${JSON.stringify(state, null, 2)}\n`);
    assert.equal(claimTask(root, ['sample-feature', '1', 'agent-a', '--scope', 'app/feature']), 1);
    state.implementation_gate.approved_by = 'user';
    writeFileSync(path.join(dir, 'auto-sdd.json'), `${JSON.stringify(state, null, 2)}\n`);
    assert.equal(claimTask(root, ['sample-feature', '1', 'agent-b', '--scope', 'app/feature']), 1);
    assert.equal(claimTask(root, ['sample-feature', '1', 'agent-a', '--scope', 'app']), 1);
    const previousBase = process.env.SDD_BASE_COMMIT;
    process.env.SDD_BASE_COMMIT = 'test-base';
    assert.equal(claimTask(root, ['sample-feature', '1', 'agent-a', '--scope', 'app/feature']), 0);
    writeFileSync(path.join(dir, 'evidence.jsonl'), `${JSON.stringify({ feature: 'sample-feature', task: '1', agent: 'agent-a', kind: 'test', status: 'passed', role: 'executor', wave: 'wave-1', attempt: 1 })}\n`);
    assert.equal(releaseTask(root, ['sample-feature', '1', 'agent-a']), 1);
    state.waves[0].status = 'validated';
    state.waves[0].validator_agents = ['agent-b'];
    writeFileSync(path.join(dir, 'evidence.jsonl'), `${JSON.stringify({ feature: 'sample-feature', task: '1', agent: 'agent-a', kind: 'test', status: 'passed', role: 'executor', wave: 'wave-1', attempt: 1 })}\n${JSON.stringify({ feature: 'sample-feature', task: 'wave-1', agent: 'agent-b', kind: 'review', status: 'passed', role: 'validator', wave: 'wave-1', attempt: 1 })}\n`);
    writeFileSync(path.join(dir, 'auto-sdd.json'), `${JSON.stringify(state, null, 2)}\n`);
    assert.equal(releaseTask(root, ['sample-feature', '1', 'agent-a']), 0);
    if (previousBase === undefined) delete process.env.SDD_BASE_COMMIT;
    else process.env.SDD_BASE_COMMIT = previousBase;
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('reapproving changed requirements revokes the gate and supersedes downstream artifacts', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-auto-revision-'));
  const dir = path.join(root, '.sdd/specs/sample-feature');
  try {
    const state = writeAutoSddFixture(dir);
    const specFile = path.join(dir, 'spec.json');
    const spec = JSON.parse(readFileSync(specFile, 'utf8'));
    spec.lifecycle.requirements = { status: 'review_required' };
    writeFileSync(specFile, `${JSON.stringify(spec, null, 2)}\n`);
    writeFileSync(path.join(dir, 'requirements.md'), '# Changed requirements\n');
    const currentHash = sha256(path.join(dir, 'requirements.md'));
    state.stage = 'implementation';
    state.implementation_gate = {
      status: 'approved', approved_by: 'user', approved_at: '2026-07-14T13:00:00.000Z', spec_revision: 1,
      requirements_hash: 'a'.repeat(64), design_hash: 'b'.repeat(64), tasks_hash: 'c'.repeat(64), plan_hash: state.plan_hash,
    };
    state.reviews.requirements = { status: 'passed', content_hash: currentHash, reviewed_at: '2026-07-14T14:00:00.000Z', reviewer: 'reviewer', attempt: 2 };
    writeFileSync(path.join(dir, 'auto-sdd.json'), `${JSON.stringify(state, null, 2)}\n`);
    assert.equal(approveArtifact(root, ['sample-feature', 'requirements', 'agent-1', '--mode', 'delegated-auto-sdd']), 0);
    const updatedSpec = JSON.parse(readFileSync(specFile, 'utf8'));
    const updatedState = JSON.parse(readFileSync(path.join(dir, 'auto-sdd.json'), 'utf8'));
    assert.equal(updatedSpec.revision, 2);
    assert.equal(updatedSpec.lifecycle.design.status, 'superseded');
    assert.equal(updatedSpec.lifecycle.tasks.status, 'superseded');
    assert.equal(updatedState.implementation_gate.status, 'revoked');
    assert.deepEqual(updatedState.waves, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('deterministically invalidates downstream state before revising an approved artifact', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-revise-'));
  const dir = path.join(root, '.sdd/specs/sample-feature');
  try {
    writeAutoSddFixture(dir);
    assert.equal(reviseArtifact(root, ['sample-feature', 'requirements', 'product-owner', '--reason', 'The accepted behavior changed']), 0);
    const spec = JSON.parse(readFileSync(path.join(dir, 'spec.json'), 'utf8'));
    const auto = JSON.parse(readFileSync(path.join(dir, 'auto-sdd.json'), 'utf8'));
    assert.equal(spec.lifecycle.requirements.status, 'review_required');
    assert.equal(spec.lifecycle.design.status, 'superseded');
    assert.equal(spec.lifecycle.tasks.status, 'superseded');
    assert.equal(spec.revision, 2);
    assert.equal(auto.implementation_gate.status, 'revoked');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

function writeDiscovery(dir, lifecycle, selectedHypothesis = 'Help freelancers prepare accessible invoices') {
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'discovery.json'), `${JSON.stringify({
    schema_version: 1,
    discovery_name: path.basename(dir),
    created_at: '2026-07-14T12:00:00.000Z',
    updated_at: '2026-07-14T12:00:00.000Z',
    language: 'en',
    iteration: 1,
    selected_hypothesis: selectedHypothesis,
    promoted_spec: null,
    lifecycle,
    history: [],
  }, null, 2)}\n`);
  writeFileSync(path.join(dir, 'constraints.md'), '# Constraints\n');
  writeFileSync(path.join(dir, 'brainstorm.md'), '# Brainstorm\n');
}

test('records a human discovery GO override with durable provenance', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-discovery-override-'));
  const dir = path.join(root, '.sdd/discoveries/manual-go');
  try {
    writeDiscovery(dir, {
      phase: 'decision',
      brainstorm: 'selected',
      market_validation: 'contradicts',
      business_case: 'unviable',
      product_outline: 'rework_required',
      decision: 'not_started',
      promotion: 'not_eligible',
    });
    assert.equal(overrideGate(root, ['discovery', 'manual-go', 'decision', 'go', 'product-owner', '--reason', 'Accept the documented market and usability risks for a capped pilot']), 0);
    const discovery = JSON.parse(readFileSync(path.join(dir, 'discovery.json'), 'utf8'));
    assert.equal(discovery.lifecycle.decision, 'go');
    assert.equal(discovery.lifecycle.promotion, 'eligible');
    assert.equal(discovery.gate_history.at(-1).mode, 'manual-override');
    assert.match(discovery.gate_history.at(-1).reason, /capped pilot/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

function writeStoreDesignScore(dir, {
  targetPlatforms = ['ios', 'android'], criterionScore = 4, hardFlags = [], appleSpamRisk = 'low', appleSpamTrackARisk = 'low',
  strongDifferenceAxes = ['core_mechanic'], weakDifferenceAxes = [], firstValueVisibility = 'before_first_value', proofLevel = 'prototype',
  closestComparatorCount = 3, explicitlyEstablishedCategory = false, coreLoopOverlap = 'low',
} = {}) {
  const ios = targetPlatforms.includes('ios');
  const android = targetPlatforms.includes('android');
  const criteria = [
    ['distinct_user_value', 25],
    ['functional_depth', 20],
    ['original_identity', 15],
    ['mobile_quality', 15],
    ['honest_presentation', 10],
    ['sustainable_experience', 10],
    ['platform_policy_fit', 5],
  ].map(([id, weight]) => ({
    id,
    weight,
    apple_score: ios ? criterionScore : null,
    google_score: android ? criterionScore : null,
    rationale: `Evidence for ${id}`,
    evidence_refs: ['https://example.org/policy'],
  }));
  const platformScore = criterionScore * 20;
  const verdict = platformScore >= 80 ? 'strong' : platformScore >= 65 ? 'conditional' : platformScore >= 50 ? 'high_risk' : 'stop';
  writeFileSync(path.join(dir, 'store-design-score.json'), `${JSON.stringify({
    schema_version: 1,
    assessed_at: '2026-07-14T12:00:00.000Z',
    policy_checked_at: '2026-07-14T12:00:00.000Z',
    target_platforms: targetPlatforms,
    criteria,
    apple_spam_assessment: ios ? {
      assessment_version: 1,
      confidence: 'medium',
      track_4_3_a: {
        risk: appleSpamTrackARisk,
        code_asset_provenance: 'original',
        near_duplicate_portfolio: false,
        rationale: 'Synthetic original-code provenance',
        evidence_refs: ['https://example.org/provenance'],
      },
      track_4_3_b: {
        risk: appleSpamRisk,
        likely_category: 'Focused utility',
        explicitly_established_category: explicitlyEstablishedCategory,
        closest_comparator_count: closestComparatorCount,
        market_has_fewer_comparators: false,
        comparison_scope: 'Three current synthetic App Store alternatives',
        core_loop_overlap: coreLoopOverlap,
        strong_difference_axes: strongDifferenceAxes,
        supporting_difference_axes: [],
        weak_difference_axes: weakDifferenceAxes,
        first_value_visibility: firstValueVisibility,
        proof_level: proofLevel,
        adversarial_rejection_case: 'A reviewer could view this as another focused utility',
        reviewer_case: 'The distinct mechanic is visible before first value in the prototype',
        evidence_refs: ['https://example.org/comparator'],
      },
      residual_subjectivity: 'A reviewer can still classify the category differently',
    } : null,
    apple: {
      applicable: ios,
      score: ios ? platformScore : null,
      verdict: ios ? verdict : 'not_applicable',
      hard_flags: ios ? hardFlags : [],
      policy_risks: {
        apple_4_3_b: ios ? appleSpamRisk : 'not_applicable',
        repetitive_content: 'not_applicable',
        minimum_functionality: ios ? 'low' : 'not_applicable',
      },
    },
    google: {
      applicable: android,
      score: android ? platformScore : null,
      verdict: android ? verdict : 'not_applicable',
      hard_flags: android ? hardFlags : [],
      policy_risks: {
        apple_4_3_b: 'not_applicable',
        repetitive_content: android ? 'low' : 'not_applicable',
        minimum_functionality: android ? 'low' : 'not_applicable',
      },
    },
    overall: {
      score: platformScore,
      verdict,
      hard_stop: hardFlags.length > 0,
      rationale: 'Lower targeted-platform score',
    },
  }, null, 2)}\n`);
}

test('keeps the research source template aligned with the executable contract', () => {
  const template = JSON.parse(readFileSync(path.join(import.meta.dirname, '../settings/templates/shared/research-source.json'), 'utf8'));
  assert.deepEqual(validateResearchSource(template), []);
});

test('reports actionable research source contract errors in one record result', () => {
  const errors = validateResearchSource({
    accessed_at: '2026-07-14T12:00:00.000Z',
    url: 'https://example.org/source',
    source_type: 'primary',
    claim: 'A claim',
    note: 'A limitation',
  });
  assert.equal(errors.includes('uses accessed_at; rename it to captured_at'), true);
  assert.equal(errors.some((error) => error.includes('title')), true);
  assert.equal(errors.some((error) => error.includes('invalid direction')), true);
  assert.equal(validateResearchSource({
    captured_at: '2026-07-14',
    url: 'https://',
    title: 'Malformed source',
    source_type: 'primary',
    direction: 'supports',
    claim: 'A claim',
    note: 'A limitation',
  }).includes('has invalid captured_at'), true);
  assert.equal(validateResearchSource({
    captured_at: '2026-07-14T12:00:00.000Z',
    url: 'https://',
    title: 'Malformed source',
    source_type: 'primary',
    direction: 'supports',
    claim: 'A claim',
    note: 'A limitation',
  }).includes('has invalid url'), true);
  assert.deepEqual(validateResearchSource({
    captured_at: '2026-07-14T12:00:00.000Z',
    evidence_type: 'usability-test',
    reference: 'private/session-001',
    title: 'Anonymous prototype session',
    source_type: 'primary-user-evidence',
    direction: 'contradicts',
    claim: 'The participant could not find the first-value action',
    note: 'One participant; no personal data stored',
  }), []);
});

test('validated source command appends one canonical discovery record and rejects invalid direction', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-source-'));
  try {
    const dir = path.join(root, '.sdd/discoveries/sample');
    mkdirSync(dir, { recursive: true });
    const valid = recordResearchSource(root, [
      'discovery', 'sample',
      '--url', 'https://example.org/current',
      '--title', 'Current source',
      '--source-type', 'primary',
      '--direction', 'supports',
      '--claim', 'A current alternative exists',
      '--note', 'Primary page with a limited sample',
      '--captured-at', '2026-07-14T12:00:00.000Z',
    ]);
    assert.equal(valid, 0);
    const records = readFileSync(path.join(dir, 'research-sources.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
    assert.equal(records.length, 1);
    assert.deepEqual(validateResearchSource(records[0]), []);

    const invalid = recordResearchSource(root, [
      'discovery', 'sample',
      '--url', 'https://example.org/other',
      '--title', 'Other source',
      '--source-type', 'primary',
      '--direction', 'maybe',
      '--claim', 'Another claim',
      '--note', 'Another limitation',
    ]);
    assert.equal(invalid, 2);
    assert.equal(readFileSync(path.join(dir, 'research-sources.jsonl'), 'utf8').trim().split('\n').length, 1);

    const traversal = recordResearchSource(root, [
      'discovery', '../escape',
      '--url', 'https://example.org/escape',
      '--title', 'Escape source',
      '--source-type', 'primary',
      '--direction', 'supports',
      '--claim', 'A traversal attempt',
      '--note', 'Must be rejected before resolving the destination',
    ]);
    assert.equal(traversal, 2);
    assert.equal(existsSync(path.join(root, '.sdd/discoveries/escape/research-sources.jsonl')), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('discovery lint groups source field failures by JSONL line', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-discovery-source-'));
  const dir = path.join(root, 'source-contract');
  try {
    writeDiscovery(dir, {
      phase: 'market_validation',
      brainstorm: 'selected',
      market_validation: 'in_progress',
      business_case: 'not_started',
      product_outline: 'not_started',
      decision: 'not_started',
      promotion: 'not_eligible',
    });
    writeFileSync(path.join(dir, 'market-validation.md'), '# Market validation\n');
    writeFileSync(path.join(dir, 'research-sources.jsonl'), `${JSON.stringify({
      accessed_at: '2026-07-14T12:00:00.000Z',
      url: 'https://example.org/product',
      source_type: 'primary',
      claim: 'A current alternative exists',
      note: 'First-party product page',
    })}\n`);
    const sourceErrors = validateDiscoveryDirectory(dir).filter((error) => error.includes('source line 1'));
    assert.equal(sourceErrors.length, 1);
    assert.equal(sourceErrors[0].includes('rename it to captured_at'), true);
    assert.equal(sourceErrors[0].includes('title'), true);
    assert.equal(sourceErrors[0].includes('direction'), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('accepts a completed discovery with durable market sources and explicit go promotion', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-discovery-'));
  const dir = path.join(root, 'invoice-helper');
  try {
    writeDiscovery(dir, {
      phase: 'complete',
      brainstorm: 'selected',
      market_validation: 'supports',
      business_case: 'conditional',
      product_outline: 'ready',
      decision: 'go',
      promotion: 'eligible',
    });
    writeFileSync(path.join(dir, 'market-validation.md'), '# Market validation\n');
    writeFileSync(path.join(dir, 'business-case.md'), '# Business case\n');
    writeFileSync(path.join(dir, 'product-outline.md'), '# Product outline\n');
    writeFileSync(path.join(dir, 'decision.md'), '# Decision\n');
    writeStoreDesignScore(dir);
    writeFileSync(path.join(dir, 'research-sources.jsonl'), `${JSON.stringify({
      captured_at: '2026-07-14T12:00:00.000Z',
      url: 'https://example.org/product',
      title: 'Example product',
      source_type: 'primary',
      direction: 'supports',
      claim: 'A current alternative exists',
      note: 'First-party product page',
    })}\n`);
    assert.deepEqual(validateDiscoveryDirectory(dir), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejects market verdicts without source evidence and go decisions without a ready outline', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-discovery-'));
  const dir = path.join(root, 'weak-idea');
  try {
    writeDiscovery(dir, {
      phase: 'complete',
      brainstorm: 'selected',
      market_validation: 'mixed',
      business_case: 'viable',
      product_outline: 'rework_required',
      decision: 'go',
      promotion: 'eligible',
    });
    writeFileSync(path.join(dir, 'market-validation.md'), '# Market validation\n');
    writeFileSync(path.join(dir, 'business-case.md'), '# Business case\n');
    writeFileSync(path.join(dir, 'product-outline.md'), '# Product outline\n');
    writeFileSync(path.join(dir, 'decision.md'), '# Decision\n');
    const errors = validateDiscoveryDirectory(dir);
    assert.equal(errors.some((error) => error.includes('requires research-sources.jsonl')), true);
    assert.equal(errors.some((error) => error.includes('requires store-design-score.json')), true);
    assert.equal(errors.some((error) => error.includes('requires a ready product outline')), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('allows an evidence-backed early stop without forcing business and product artifacts', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-discovery-'));
  const dir = path.join(root, 'stopped-idea');
  try {
    writeDiscovery(dir, {
      phase: 'complete',
      brainstorm: 'selected',
      market_validation: 'contradicts',
      business_case: 'not_started',
      product_outline: 'not_started',
      decision: 'stop',
      promotion: 'not_eligible',
    });
    writeFileSync(path.join(dir, 'market-validation.md'), '# Market validation\n');
    writeFileSync(path.join(dir, 'decision.md'), '# Decision\n');
    writeStoreDesignScore(dir);
    writeFileSync(path.join(dir, 'research-sources.jsonl'), `${JSON.stringify({
      captured_at: '2026-07-14T12:00:00.000Z',
      url: 'https://example.org/policy',
      title: 'Blocking policy',
      source_type: 'primary',
      direction: 'contradicts',
      claim: 'The required capability is prohibited',
      note: 'Current first-party policy',
    })}\n`);
    assert.deepEqual(validateDiscoveryDirectory(dir), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('keeps Apple 4.3(b) not applicable for an Android-only discovery', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-discovery-'));
  const dir = path.join(root, 'android-utility');
  try {
    writeDiscovery(dir, {
      phase: 'business_case',
      brainstorm: 'selected',
      market_validation: 'supports',
      business_case: 'in_progress',
      product_outline: 'not_started',
      decision: 'not_started',
      promotion: 'not_eligible',
    });
    writeFileSync(path.join(dir, 'market-validation.md'), '# Market validation\n');
    writeFileSync(path.join(dir, 'business-case.md'), '# Business case\n');
    writeFileSync(path.join(dir, 'research-sources.jsonl'), `${JSON.stringify({
      captured_at: '2026-07-14T12:00:00.000Z',
      url: 'https://example.org/google-policy',
      title: 'Google policy',
      source_type: 'primary',
      direction: 'supports',
      claim: 'The Android idea has distinct mobile value',
      note: 'Current first-party policy',
    })}\n`);
    writeStoreDesignScore(dir, { targetPlatforms: ['android'] });
    assert.deepEqual(validateDiscoveryDirectory(dir), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('keeps pre-2.4.1 store scorecards without the detailed Apple spam block compatible', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-discovery-'));
  const dir = path.join(root, 'legacy-scorecard');
  try {
    writeDiscovery(dir, {
      phase: 'business_case',
      brainstorm: 'selected',
      market_validation: 'supports',
      business_case: 'in_progress',
      product_outline: 'not_started',
      decision: 'not_started',
      promotion: 'not_eligible',
    });
    writeFileSync(path.join(dir, 'market-validation.md'), '# Market validation\n');
    writeFileSync(path.join(dir, 'business-case.md'), '# Business case\n');
    writeFileSync(path.join(dir, 'research-sources.jsonl'), `${JSON.stringify({
      captured_at: '2026-07-14T12:00:00.000Z',
      url: 'https://example.org/policy',
      title: 'Policy',
      source_type: 'primary',
      direction: 'supports',
      claim: 'Legacy scorecard evidence',
      note: 'Compatibility fixture',
    })}\n`);
    writeStoreDesignScore(dir);
    const scoreFile = path.join(dir, 'store-design-score.json');
    const legacy = JSON.parse(readFileSync(scoreFile, 'utf8'));
    delete legacy.apple_spam_assessment;
    writeFileSync(scoreFile, `${JSON.stringify(legacy, null, 2)}\n`);
    assert.deepEqual(validateDiscoveryDirectory(dir), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejects a low Apple 4.3(b) rating based only on weak and non-demonstrable differences', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-discovery-'));
  const dir = path.join(root, 'cosmetic-timer');
  try {
    writeDiscovery(dir, {
      phase: 'business_case',
      brainstorm: 'selected',
      market_validation: 'supports',
      business_case: 'in_progress',
      product_outline: 'not_started',
      decision: 'not_started',
      promotion: 'not_eligible',
    });
    writeFileSync(path.join(dir, 'market-validation.md'), '# Market validation\n');
    writeFileSync(path.join(dir, 'business-case.md'), '# Business case\n');
    writeFileSync(path.join(dir, 'research-sources.jsonl'), `${JSON.stringify({
      captured_at: '2026-07-14T12:00:00.000Z',
      url: 'https://example.org/comparator',
      title: 'Comparator',
      source_type: 'store-listing',
      direction: 'contradicts',
      claim: 'The core loop is already widely available',
      note: 'Synthetic comparator evidence',
    })}\n`);
    writeStoreDesignScore(dir, {
      strongDifferenceAxes: [],
      weakDifferenceAxes: ['cosmetic_ui', 'audience_niche'],
      firstValueVisibility: 'buried',
      proofLevel: 'concept_only',
      explicitlyEstablishedCategory: true,
      coreLoopOverlap: 'high',
    });
    const errors = validateDiscoveryDirectory(dir);
    assert.equal(errors.some((error) => error.includes('low Apple 4.3(b) risk requires')), true);
    assert.equal(errors.some((error) => error.includes('risk must be high')), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('requires a hard flag and capped policy-fit score for high Apple spam risk', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-discovery-'));
  const dir = path.join(root, 'duplicate-template');
  try {
    writeDiscovery(dir, {
      phase: 'business_case',
      brainstorm: 'selected',
      market_validation: 'mixed',
      business_case: 'in_progress',
      product_outline: 'not_started',
      decision: 'not_started',
      promotion: 'not_eligible',
    });
    writeFileSync(path.join(dir, 'market-validation.md'), '# Market validation\n');
    writeFileSync(path.join(dir, 'business-case.md'), '# Business case\n');
    writeFileSync(path.join(dir, 'research-sources.jsonl'), `${JSON.stringify({
      captured_at: '2026-07-14T12:00:00.000Z',
      url: 'https://example.org/template',
      title: 'Template provenance',
      source_type: 'repository',
      direction: 'constrains',
      claim: 'The app uses a shared commercial template',
      note: 'Synthetic provenance evidence',
    })}\n`);
    writeStoreDesignScore(dir, { appleSpamTrackARisk: 'high', appleSpamRisk: 'high', strongDifferenceAxes: [], coreLoopOverlap: 'high' });
    const errors = validateDiscoveryDirectory(dir);
    assert.equal(errors.some((error) => error.includes('platform_policy_fit exceeds the 1 cap')), true);
    assert.equal(errors.some((error) => error.includes('requires an Apple hard flag')), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejects a go decision with unresolved store design hard flags', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-discovery-'));
  const dir = path.join(root, 'template-clone');
  try {
    writeDiscovery(dir, {
      phase: 'complete',
      brainstorm: 'selected',
      market_validation: 'mixed',
      business_case: 'conditional',
      product_outline: 'ready',
      decision: 'go',
      promotion: 'eligible',
    });
    for (const artifact of ['market-validation.md', 'business-case.md', 'product-outline.md', 'decision.md']) {
      writeFileSync(path.join(dir, artifact), `# ${artifact}\n`);
    }
    writeFileSync(path.join(dir, 'research-sources.jsonl'), `${JSON.stringify({
      captured_at: '2026-07-14T12:00:00.000Z',
      url: 'https://example.org/apple-policy',
      title: 'Apple policy',
      source_type: 'primary',
      direction: 'contradicts',
      claim: 'The idea is not meaningfully differentiated',
      note: 'Synthetic fixture for a store hard flag',
    })}\n`);
    writeStoreDesignScore(dir, { hardFlags: ['Unresolved Apple 4.3(b) differentiation risk'] });
    const errors = validateDiscoveryDirectory(dir);
    assert.equal(errors.some((error) => error.includes('without hard-stop flags')), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

function writeReadyRelease(dir, gateStatus = 'pending') {
  mkdirSync(dir, { recursive: true });
  const artifacts = {
    pre_release_checklist: 'pre-release-checklist.md',
    marketing_plan: 'marketing-plan.md',
    store_assets: 'store-assets.md',
    measurement_plan: 'measurement-plan.md',
    launch_plan: 'launch-plan.md',
  };
  writeFileSync(path.join(dir, 'release-context.md'), '# Release context\n');
  for (const name of Object.values(artifacts)) writeFileSync(path.join(dir, name), `# ${name}\n`);
  writeFileSync(path.join(dir, 'research-sources.jsonl'), `${JSON.stringify({
    captured_at: '2026-07-14T12:00:00.000Z',
    url: 'https://example.org/store-policy',
    title: 'Current store policy',
    source_type: 'primary',
    direction: 'constrains',
    claim: 'Store assets must satisfy current policy',
    note: 'Synthetic fixture for release lint',
  })}\n`);
  const hashes = Object.fromEntries(Object.entries(artifacts).map(([key, name]) => [key, gateStatus === 'approved' ? sha256(path.join(dir, name)) : null]));
  writeFileSync(path.join(dir, 'release.json'), `${JSON.stringify({
    schema_version: 1,
    release_name: path.basename(dir),
    created_at: '2026-07-14T12:00:00.000Z',
    updated_at: '2026-07-14T12:00:00.000Z',
    language: 'en',
    release_version: '1.0.0',
    source_specs: [],
    target_platforms: ['ios'],
    context_profiles: [],
    lifecycle: {
      phase: 'launch',
      readiness: 'ready',
      go_to_market: 'ready',
      assets: 'ready',
      measurement: 'ready',
      launch: gateStatus === 'approved' ? 'approved' : 'planned',
      observation: 'not_started',
      growth: 'not_started',
    },
    launch_gate: {
      status: gateStatus,
      approved_by: gateStatus === 'approved' ? 'release-owner' : null,
      approved_at: gateStatus === 'approved' ? '2026-07-14T13:00:00.000Z' : null,
      artifact_hashes: hashes,
    },
    paid_media_gate: {
      status: 'not_configured',
      approved_by: null,
      approved_at: null,
      channel: null,
      currency: null,
      hard_cap: null,
      starts_on: null,
      ends_on: null,
    },
    history: [],
  }, null, 2)}\n`);
}

test('accepts a fully planned release with durable current research and a pending gate', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-release-'));
  const dir = path.join(root, 'mobile-v1');
  try {
    writeReadyRelease(dir);
    assert.deepEqual(validateReleaseDirectory(dir), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('binds approved release gates to current planning artifact hashes', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-release-'));
  const dir = path.join(root, 'mobile-v1');
  try {
    writeReadyRelease(dir, 'approved');
    assert.deepEqual(validateReleaseDirectory(dir), []);
    writeFileSync(path.join(dir, 'marketing-plan.md'), '# materially changed plan\n');
    const errors = validateReleaseDirectory(dir);
    assert.equal(errors.some((error) => error.includes('stale marketing-plan.md')), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejects unbounded paid media approval and launch claims without availability evidence', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sdd-release-'));
  const dir = path.join(root, 'mobile-v1');
  try {
    writeReadyRelease(dir, 'approved');
    const file = path.join(dir, 'release.json');
    const release = JSON.parse(readFileSync(file, 'utf8'));
    release.lifecycle.launch = 'launched';
    release.paid_media_gate = {
      status: 'approved',
      approved_by: 'release-owner',
      approved_at: '2026-07-14T13:00:00.000Z',
      channel: 'search',
      currency: null,
      hard_cap: null,
      starts_on: null,
      ends_on: null,
    };
    writeFileSync(file, `${JSON.stringify(release, null, 2)}\n`);
    const errors = validateReleaseDirectory(dir);
    assert.equal(errors.some((error) => error.includes('lacks ISO currency')), true);
    assert.equal(errors.some((error) => error.includes('positive hard cap')), true);
    assert.equal(errors.some((error) => error.includes('availability evidence')), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
