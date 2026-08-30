# Research Source Ledger Contract

`research-sources.jsonl` is an append-only evidence ledger shared by product discovery and release research. Each non-empty line is one JSON object conforming to `.sdd/settings/schemas/research-source.schema.json`. Never store personally identifiable participant data.

## Required fields

| Field | Contract |
| --- | --- |
| `captured_at` | ISO 8601 date-time when the source was inspected. Use this exact name, not `accessed_at`. |
| `url` or `reference` | Web evidence requires an absolute HTTP(S) URL. Interviews, observation, usability, survey, analytics, support, experiment, repository, and document evidence use a privacy-safe reference. |
| `evidence_type` | `web` or a supported primary/behavioral evidence type. Legacy web records without this field remain valid. |
| `title` | Human-readable source or page title. |
| `source_type` | Provenance category such as `official-policy`, `official-store-listing`, `primary`, `secondary`, or `user-community`. |
| `direction` | `supports`, `contradicts`, `constrains`, or `context`. |
| `claim` | One material claim supported, contradicted, constrained, or contextualized by the source. |
| `note` | Scope, market, sample, limitations, and project relevance. |

Use `.sdd/settings/templates/shared/research-source.json` as the canonical example. Keep one material claim per record; repeat a URL when it supports materially different claims. Never delete or rewrite prior valid records to change a conclusion—append a newer record that explains the update.

## Safe append command

Prefer the validated helper over hand-authoring JSONL:

```bash
node .sdd/tools/sdd.mjs source discovery <name> \
  --url "https://example.com/source" \
  --title "Current source title" \
  --source-type "primary" \
  --direction "supports" \
  --claim "The specific claim supported by this source" \
  --note "Market, sample, scope, limitations, and project relevance"
```

Use `source release <name>` for release-owned research. The helper supplies `captured_at` unless `--captured-at` is explicitly provided, validates the record before writing, and appends exactly one line. When manual append is unavoidable, validate immediately after the first record with `node .sdd/tools/sdd.mjs lint` before collecting the rest.

Use `fresh_until`, confidence, method, and limitations for mutable or decision-critical claims. Reuse still-applicable evidence and refresh only expired, contradicted, or scope-affected claims.
