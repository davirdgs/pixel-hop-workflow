# Workflow: steering-custom

1. Load `.sdd/config.json`, steering principles, and the selected custom template.
2. Analyze live project patterns for that domain; integration templates may instead provide setup instructions.
3. Write durable, project-specific guidance under `.sdd/steering/` without embedding agent-specific commands or secrets.
4. Register the file in an appropriate context profile in `.sdd/config.json`.
