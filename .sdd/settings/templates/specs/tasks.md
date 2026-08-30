# Implementation Plan

## Task Format Template

Use whichever pattern fits the work breakdown:

### Major task only
- [ ] {{NUMBER}}. {{TASK_DESCRIPTION}}{{PARALLEL_MARK}}
  - {{DETAIL_ITEM_1}} *(Include details only when needed. If the task stands alone, omit bullet items.)*
  - _Requirements: {{REQUIREMENT_IDS}}_
  - _Dependencies: {{TASK_IDS_OR_NONE}}_
  - _Write Scope: {{PATH_OR_MODULE_PREFIXES}}_
  - _Verification: {{STRATEGY}}_
  - _Evidence: {{EXPECTED_EVIDENCE}}_

### Major + Sub-task structure
- [ ] {{MAJOR_NUMBER}}. {{MAJOR_TASK_SUMMARY}}
- [ ] {{MAJOR_NUMBER}}.{{SUB_NUMBER}} {{SUB_TASK_DESCRIPTION}}{{SUB_PARALLEL_MARK}}
  - {{DETAIL_ITEM_1}}
  - {{DETAIL_ITEM_2}}
  - _Requirements: {{REQUIREMENT_IDS}}_ *(IDs only; do not add descriptions or parentheses.)*
  - _Dependencies: {{TASK_IDS_OR_NONE}}_
  - _Write Scope: {{PATH_OR_MODULE_PREFIXES}}_
  - _Verification: {{STRATEGY}}_
  - _Evidence: {{EXPECTED_EVIDENCE}}_

> **Parallel marker**: Append ` (P)` only to tasks that can be executed in parallel. Omit the marker when running in `--sequential` mode.
>
> **Optional test coverage**: When a sub-task is deferrable test work tied to acceptance criteria, mark the checkbox as `- [ ]*` and explain the referenced requirements in the detail bullets.
