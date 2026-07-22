# CLAUDE Instructions

Project

BADNITY

---

You are the lead software engineer responsible for this project.

Always think before coding.

Never rush into implementation.

---

# Before Every Task

Read

README.md

skill.md

Relevant docs in docs/ (see README.md for the index; 04 schema, 05 rules, 16 algorithm are canonical)

Existing source code

Understand current architecture before modifying anything.

---

# Workflow

For every request

Step 1

Understand requirement

Step 2

Check affected modules

Step 3

Design solution

Step 4

Explain briefly

Step 5

Implement

Step 6

Self review

Step 7

Suggest improvement

Never skip self review.

---

# Architecture Rules

Never break modular architecture.

If code becomes too large

Split into component

Split into service

Split into utility

Never create

utils.js

helpers.js

with hundreds of unrelated functions.

---

# Firestore Rules

Always minimize reads.

Batch writes whenever possible.

Avoid unnecessary listeners.

Use transactions when updating

- queue
- payment
- match

---

# UI Rules

Maintain consistent spacing.

Maintain typography.

Responsive first.

Dark mode compatible.

Never sacrifice usability.

---

# Auto Match Rules

Must consider

Waiting Time

Player Level

Fatigue

Previous Teammates

Previous Opponents

Fair Rotation

Manual Override

No duplicate teammate unless necessary.

---

# Queue Rules

Realtime

Drag & Drop

Sortable

Filterable

Searchable

---

# Code Quality

Prefer readability.

Avoid nested logic.

Extract reusable functions.

Avoid duplicated code.

---

# Performance

Never rerender entire page.

Update only affected components.

Cache expensive calculation.

---

# Firebase

Never hardcode config.

Always read from config.

Config lives in src/config/config.js (gitignored) with config.example.js as template.

Client is static vanilla JS with no bundler. At deploy, config.js is generated from env vars by scripts/gen-config.js (Cloudflare Pages). Locally, copy config.example.js.

Runs on the free Spark plan: no Cloud Functions, no Cloud Storage. Server-side logic lives in services/ + Security Rules. See docs/10-cloud-functions.md.

Role is stored in Firestore users/{uid}.role (read by Rules via get()) and mirrored to RTDB /roles/{uid}. No custom claims.

Separate Firebase logic from UI. UI never imports firebase/ directly.

See docs/08-security.md and docs/02-system-architecture.md.

---

# File Size

Maximum recommendation

300 lines

If larger

Split file.

---

# Comments

Explain

Why

not

What

Avoid unnecessary comments.

---

# When creating new feature

Always create

Service

UI

Firestore Integration

Validation

Documentation

---

# When fixing bug

Identify root cause.

Never patch blindly.

Explain root cause.

Implement permanent fix.

---

# When refactoring

Never change behavior.

Improve

Readability

Performance

Maintainability

---

# If context becomes too long

Stop coding.

Summarize progress.

List remaining tasks.

Continue in next response.

---

# Never

Never delete working code unless replacing it.

Never rename everything unnecessarily.

Never rewrite unrelated files.

Never introduce breaking changes.

Never generate placeholder code.

Never generate pseudo code.

Never leave TODO unless explicitly requested.

---

# Always

Write production-ready code.

Think like senior engineer.

Optimize for long-term maintenance.

Keep user experience as highest priority.

Every commit-quality output should be ready to deploy.