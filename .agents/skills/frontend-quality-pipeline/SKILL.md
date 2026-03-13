---
name: frontend-quality-pipeline
description: >
  Run all three frontend quality checks (React best practices, composition
  patterns, web design guidelines) against specified files or directories.
  Use when asked to "run quality checks", "audit frontend", "review frontend
  quality", or "check frontend code". Accepts a file path or directory as
  an argument.
metadata:
  author: local
  version: "1.0.0"
  argument-hint: <file-or-directory>
---

# Frontend Quality Pipeline

Sequentially run **three** quality review passes on the target code and produce
a unified report.

## Arguments

The user MUST provide a target file or directory path as an argument.
If no argument is provided, ask the user which files or directory to review.

## Pipeline Steps

For the given target path, recursively collect all relevant source files
(`.ts`, `.tsx`, `.js`, `.jsx`) and run the following three review passes
**in order**:

### Pass 1 — Vercel React Best Practices

1. Read all rule files under `rules/vercel-react-best-practices/rules/*.md`
2. Read the target source files
3. Check each file against every applicable rule
4. Collect findings as `file:line — [rule-id] description`

### Pass 2 — Vercel Composition Patterns

1. Read all rule files under `rules/vercel-composition-patterns/rules/*.md`
2. Check each target file against every applicable rule
3. Collect findings in the same format

### Pass 3 — Web Design Guidelines

1. Fetch the latest guidelines from:
   `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
2. Check each target file against the fetched guidelines
3. Collect findings using the format specified in the guidelines

## Execution Strategy

- Use **three parallel Agent calls** (one per pass) to maximize speed.
  Each agent should:
  - Read the relevant rule files (or fetch the guidelines URL)
  - Recursively read the target files
  - Evaluate every rule against every file
  - Return findings in `file:line — [rule-id] description` format
- After all three agents complete, **merge** their results into a single
  unified report grouped by file, then by severity/priority.

## Output Format

```
# Frontend Quality Report — <target path>

## <file path>

- **[rule-id]** line N: description (severity)
- ...

## Summary

| Pass                       | Findings |
|----------------------------|----------|
| React Best Practices       | N        |
| Composition Patterns       | N        |
| Web Design Guidelines      | N        |
| **Total**                  | **N**    |
```

- Sort findings within each file by line number.
- Omit files with zero findings.
- If no findings at all, output: "All checks passed — no issues found."
