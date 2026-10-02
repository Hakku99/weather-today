# AAPDS v1.2.2 Final

## Autonomous Project Development Protocol

### For OpenAI Codex and Anthropic Claude Code

**Version:** 1.2.2 Final\
**Purpose:** Requirement Documents → Complete, Working, Verified Software Project\
**Primary Targets:** OpenAI Codex / Anthropic Claude Code\
**Operating Philosophy:** Minimal process, durable intent, current technical grounding, controlled autonomy, evidence-based completion.

---

# 1. EXECUTION DIRECTIVE

This document is an execution protocol.

When this protocol is supplied together with project requirements:

**BEGIN THE ANALYSIS AND PLANNING PROCESS AUTOMATICALLY.**

Do not ask:

> “Would you like me to start?”

Immediately:

1. Read this protocol.
2. Read all supplied requirement and reference materials.
3. Inspect the repository if one already exists.
4. Determine whether the project is greenfield or existing.
5. Begin Phase 1: SPECIFY.

However:

**DO NOT begin application implementation until the mandatory Pre-Implementation Approval Gate has been explicitly approved by the user.**

Before approval, you may create or update planning and Agent-control documentation, but you must not substantially implement the application.

---

# 2. CORE LIFECYCLE

Use the following default lifecycle:

```text
ORIGINAL REQUIREMENTS
        ↓
1. SPECIFY
        ↓
2. ALIGN & PLAN
        ↓
◆ PRE-IMPLEMENTATION APPROVAL ◆
        ↓
3. EXECUTE & VERIFY
        ↓
4. FINAL REVIEW
        ↓
DONE
```

If deployment is explicitly required:

```text
DONE
 ↓
DEPLOY
 ↓
POST-DEPLOY VERIFY
 ↓
DELIVERED
```

Do not introduce additional process stages unless the project has a concrete need.

---

# 3. HUMAN INTERVENTION MODEL

The user should normally need to intervene only for:

1. Pre-Implementation Approval.
2. Genuine requirement ambiguity that materially affects the product.
3. A new material architectural decision not covered by prior approval.
4. High-impact or irreversible actions.
5. External blockers requiring user credentials, access, or decisions.

After implementation is approved, ordinary engineering decisions should proceed autonomously.

Do not repeatedly ask the user to say:

> continue

---

# 4. CORE PRINCIPLES

## 4.1 Requirement First

The supplied requirements represent the user's original intent.

Never silently alter requirements to make implementation easier.

---

## 4.2 Specification Before Implementation

Translate requirements into a concise executable specification before substantial coding.

---

## 4.3 Material Architecture Requires Alignment

Material architectural decisions must be presented to the user before implementation when they are not already specified.

---

## 4.4 Agent Owns Engineering Detail

After approval, ordinary implementation decisions belong to the coding Agent.

Do not ask the user about trivial engineering details.

---

## 4.5 Evidence Before Done

Code existing does not prove a requirement works.

Use appropriate executable or observable evidence.

---

## 4.6 Minimal Process

Do not create documentation, abstractions, architectural layers, Agents, tools, or workflow mechanisms without a concrete need.

---

## 4.7 Current Documentation Over Memory

Do not rely solely on model-training memory for current or version-sensitive external technology behavior.

Use Context7 or authoritative current documentation where appropriate.

---

## 4.8 Durable Intent, Lightweight Execution

Persist long-lived project intent and status in the repository.

Use native Codex or Claude Code capabilities for short-lived execution details.

---

# 5. DEFAULT PROJECT CONTROL SURFACE

For projects intended to work with both Codex and Claude Code, prefer:

```text
/
├── AAPDS.md
├── AGENTS.md
├── CLAUDE.md
│
├── docs/
│   ├── requirements/
│   ├── SPEC.md
│   └── PLAN.md
│
└── application files
```

Do not create additional project-management files by default.

---

# 6. ORIGINAL REQUIREMENTS

Whenever practical, preserve authoritative requirement files under:

```text
docs/requirements/
```

Examples:

```text
Product-Requirements.pdf
UI-Reference.pdf
Wireframes.png
API-Requirements.md
```

If attached source files cannot be copied into the repository, do not block the project.

Instead, list their filenames and role under:

```text
docs/SPEC.md → Authoritative Sources
```

Relationship:

```text
Original Requirements
        ↓
      SPEC.md
        ↓
Implementation
```

Original requirements preserve user intent.

`SPEC.md` is the engineering interpretation used during development.

---

# 7. EXISTING PROJECT RULE

When working in an existing codebase:

1. Inspect existing architecture and conventions first.
2. Preserve compatible established patterns by default.
3. Do not redesign unrelated parts of the project.
4. Do not introduce a preferred architecture merely because it appears cleaner.
5. Propose migration only if:
   - the existing architecture materially blocks the requirement,
   - serious technical debt directly prevents safe implementation,
   - or the user explicitly requests modernization.

A feature request must not silently become an architectural rewrite.

---

# 8. AGENTS.md

Create or maintain a concise `AGENTS.md`.

It should contain only repository information an Agent repeatedly needs, such as:

- authoritative project documents
- build / run / test commands
- important repository conventions
- critical architectural constraints
- testing expectations
- scope discipline
- safety restrictions
- completion discipline
- Context7 usage rule

It should not contain:

- the entire specification
- extensive architecture prose
- full API documentation
- generic software engineering tutorials
- detailed historical progress
- large task lists

Keep it concise.

For Codex, use `AGENTS.md` as the primary shared repository instruction file.

---

# 9. CLAUDE.md

For Claude Code, keep `CLAUDE.md` minimal.

Prefer:

```markdown
@AGENTS.md

Use docs/SPEC.md as the authoritative product specification.
Use docs/PLAN.md as the durable implementation plan and project status.
```

Add Claude-specific instructions only when necessary.

Do not maintain two duplicated project-rule systems.

---

# 10. PHASE 1 — SPECIFY

Read all relevant requirement materials before implementation.

Create:

```text
docs/SPEC.md
```

`SPEC.md` defines WHAT the finished project must achieve.

---

# 11. SPEC CONTENT

Include only sections that are relevant.

Typical structure:

```text
# Authoritative Sources

# Product Goal

# Scope

# Functional Requirements

# Non-Functional Requirements

# UX / UI Requirements

# Data Requirements

# Security / Privacy Requirements

# External Integrations

# Constraints

# Out of Scope

# Acceptance Criteria

# Definition of Done
```

Do not generate empty ceremonial sections.

---

# 12. REQUIREMENT GRANULARITY

Use identifiers where they improve clarity.

Example:

```text
FR-01 User Registration
FR-02 Login
FR-03 Password Reset
```

Do not assign formal IDs to every visual detail, text label, or implementation choice.

---

# 13. ACCEPTANCE CRITERIA

Important requirements must have observable acceptance criteria.

Example:

```text
FR-01 — User Registration

Requirement:
A visitor can register using email and password.

Acceptance:
- Valid email can create an account.
- Duplicate email is rejected.
- Invalid email is rejected.
- Password policy is enforced.
- Password is not stored as plaintext.

Verification:
Integration test plus critical E2E flow.
```

Before implementation, the Agent must know how important behavior can be demonstrated.

This does not require every test to be written before coding.

---

# 14. AMBIGUITY RULE

Do not ask about every ambiguity.

For decisions that are:

- low risk
- reversible
- non-business-critical
- low migration cost

choose a reasonable engineering default.

Record the decision only if it may matter later.

---

# 15. BLOCKING AMBIGUITIES

Ask the user when ambiguity materially changes:

- product behavior
- business logic
- target platform
- billing
- security
- privacy
- authentication
- data ownership
- major external integrations
- irreversible data design
- deployment assumptions
- major architecture

Ask the minimum number of questions required.

---

# 16. PHASE 2 — ALIGN & PLAN

After `SPEC.md` is sufficiently clear:

```text
Research Architecture
        ↓
Ground Technical Facts
        ↓
Draft Architecture
        ↓
Build PLAN.md
        ↓
Prepare Pre-Implementation Review
```

Create:

```text
docs/PLAN.md
```

---

# 17. DOCUMENTATION GROUNDING WITH CONTEXT7

When Context7 is available, use it as the preferred documentation retrieval layer for external:

- frameworks
- libraries
- SDKs
- APIs
- platforms

when correctness depends on current or version-specific behavior.

Context7 is a technical grounding tool.

It is not the architecture decision maker.

Relationship:

```text
Requirements
     ↓
Agent identifies candidate solutions
     ↓
Context7 verifies current technical reality
     ↓
Agent evaluates trade-offs
     ↓
Architecture recommendation
     ↓
User approval
```

---

# 18. CONTEXT7 DURING ALIGN & PLAN

Before presenting important technology recommendations, use Context7 where relevant to verify:

- current documented usage
- version-specific APIs
- recommended setup
- deprecated approaches
- important compatibility assumptions
- current framework conventions
- relevant best practices

Examples:

```text
Next.js
React
Nuxt
SvelteKit
Prisma
Drizzle
Auth libraries
Playwright
Cloud SDKs
UI frameworks
```

Do not select technologies merely because they are familiar to the model.

---

# 19. CONTEXT7 DURING IMPLEMENTATION

During EXECUTE & VERIFY, use Context7 just-in-time when implementation depends on external version-sensitive knowledge.

Examples:

```text
framework routing
authentication
ORM/database APIs
payment SDKs
cloud SDKs
caching APIs
server actions
middleware
external integrations
migration syntax
```

Do not query Context7 for ordinary project-local logic when external documentation is irrelevant.

Examples that normally do not need Context7:

```text
variable naming
local business logic
simple refactoring
CSS spacing
project-specific types
ordinary internal helpers
```

---

# 20. CONTEXT7 LIMITS

Context7 supplements authoritative sources rather than replacing them.

For highly time-sensitive facts such as:

- exact latest release
- security advisories
- newly announced breaking changes
- CVEs
- vendor incidents
- package deprecation

verify against authoritative vendor documentation, official release information, security advisories, or official package registries when necessary.

Do not create Context7-specific project documentation by default.

---

# 21. MATERIAL DECISION TEST

A technical decision requires user alignment when at least one is true:

1. Migration cost is high.
2. It materially changes product capability.
3. It materially affects deployment.
4. It materially affects data architecture.
5. It materially affects security or privacy.
6. Multiple realistic solutions have meaningful long-term trade-offs.

Examples:

```text
Next.js full-stack vs SPA + independent API
SQL vs document database
monolith vs microservices
feature-based structure vs Feature-Sliced Design
REST vs GraphQL where both are genuinely viable
serverless vs persistent backend
authentication architecture
major cloud/deployment platform
```

Ordinary implementation details do not require approval.

---

# 22. TECHNOLOGY VERSION RULE

For major frameworks, runtimes and significant dependencies:

1. Prefer stable, supported releases.
2. Avoid beta, preview, canary or RC releases unless requirements justify them.
3. Verify major version assumptions using current documentation when available.
4. Check compatibility among major dependencies.
5. Record architecturally meaningful major versions in `PLAN.md`.
6. Use package manifests and lockfiles for exact dependency versions.

Example:

```text
PLAN.md:
Node.js 24 LTS
Next.js 16
React 19
```

Do not maintain full patch-level dependency inventories in planning prose.

---

# 23. ARCHITECTURE SIMPLICITY

Do not automatically choose sophisticated patterns.

Do not introduce these merely because they appear professional:

- Feature-Sliced Design
- Clean Architecture
- Hexagonal Architecture
- Domain-Driven Design
- CQRS
- Event Sourcing
- Microservices
- Monorepos

Use them only when the project receives concrete benefits that justify the additional complexity.

Prefer the simplest maintainable architecture appropriate to the expected project scale.

---

# 24. PLAN.md

`PLAN.md` is the durable project-level implementation plan and status.

Recommended structure:

```text
# Goal

# Approved Architecture

# Technology Stack

# Repository Structure

# Milestones

# Validation

# Important Decisions

# Current Status

# Known Risks / Blockers
```

Keep it proportional to the project.

Do not create separate `TASKS.md`, `VERIFICATION_PLAN.md`, or status databases by default.

---

# 25. MILESTONES

Break work into coherent milestones.

Example:

```text
M0 Project Bootstrap
M1 Core Data Model
M2 Authentication
M3 Primary Workflow
M4 Secondary Features
M5 UI / UX Completion
M6 Final Verification
```

Milestones should be:

- meaningful
- independently verifiable
- small enough to control
- large enough to avoid micromanagement

---

# 26. MILESTONE VALIDATION

Important milestones must define appropriate verification.

Example:

```text
M2 — Authentication

Deliverables:
- registration
- login
- logout
- protected routes

Validation:
- integration tests
- critical browser/E2E flow
- typecheck
```

---

# 27. NATIVE PLAN AND GOAL CAPABILITIES

Native Codex / Claude Code planning and goal capabilities may be used when useful.

They are execution aids, not replacements for durable repository state.

Relationship:

```text
SPEC.md
   ↓
PLAN.md milestone
   ↓
Native Plan / Goal when useful
   ↓
Execution
```

`SPEC.md` defines the product.

`PLAN.md` stores durable project execution state.

Native planning assists the current Agent session.

---

# 28. MANDATORY PRE-IMPLEMENTATION APPROVAL GATE

**THIS GATE IS REQUIRED.**

Before application implementation begins, present a concise Pre-Implementation Review to the user.

Implementation must not begin until explicit approval is received.

Creating `SPEC.md`, `PLAN.md`, `AGENTS.md`, and `CLAUDE.md` does not count as application implementation.

Before approval, do not:

- generate the application framework
- install project dependencies
- create production application modules
- implement product features
- create database migrations
- substantially modify an existing application

unless explicitly requested by the user.

---

# 29. PRE-IMPLEMENTATION REVIEW CONTENT

Present the user with:

## 1. Project Understanding

A concise description of what product you believe must be built.

## 2. Major Requirements

The important functional scope.

## 3. Important Assumptions

Only assumptions that could materially affect the result.

## 4. Recommended Technology Stack

Include significant major versions when relevant.

## 5. Architecture

Explain the proposed architecture and why it fits the project.

## 6. Repository Structure

Show the proposed high-level repository organization.

## 7. Milestones

Show the major implementation milestones.

## 8. Verification Strategy

Explain how important requirements will be verified.

## 9. Documentation Grounding

State which material external technologies were checked using Context7 and/or authoritative current documentation.

## 10. Material Alternatives

Mention only meaningful alternatives with relevant trade-offs.

End with:

> **Implementation has not started. Please approve this plan or specify changes.**

---

# 30. APPROVAL BEHAVIOR

Only explicit approval unlocks implementation.

Examples of valid approval:

```text
Approved.
批准。
Proceed with this plan.
Architecture and plan approved. Start implementation.
```

If the user requests changes:

```text
Update SPEC / PLAN
        ↓
Re-evaluate affected architecture
        ↓
Present revised Pre-Implementation Review
        ↓
Wait for approval
```

Do not interpret silence as approval.

After approval, continue autonomously until another legitimate gate or blocker occurs.

---

# 31. ENGINEERING QUALITY PRINCIPLES

All implementation work should prioritize:

```text
Correctness
   ↓
Simplicity
   ↓
Maintainability
   ↓
Readability
   ↓
Security
   ↓
Testability
   ↓
Appropriate Performance
```

These qualities should be balanced rather than optimized mechanically in isolation.

---

# 32. SIMPLICITY

Prefer the simplest implementation that fully satisfies current requirements.

Avoid:

- unnecessary abstraction
- unnecessary indirection
- speculative extension points
- premature generalization
- unnecessary architectural layers
- infrastructure for hypothetical requirements

Do not design for imagined future requirements without concrete evidence.

---

# 33. MAINTAINABILITY

Code should be understandable and safely modifiable by another competent developer or Agent.

Prefer:

- clear boundaries
- predictable structure
- descriptive naming
- localized changes
- explicit important behavior
- low unnecessary coupling

Avoid cleverness that increases maintenance cost.

---

# 34. READABILITY

Write code for maintainers.

Prefer straightforward control flow and conventional ecosystem patterns.

Comments should explain:

- why a non-obvious decision exists
- important constraints
- meaningful trade-offs

Do not use comments merely to repeat obvious code.

---

# 35. APPROPRIATE ABSTRACTION

Create abstractions when they meaningfully:

- remove repeated domain knowledge
- establish useful boundaries
- reduce coupling
- improve testability
- simplify changes already implied by requirements

Do not create abstractions solely because code looks superficially similar.

A small amount of duplication may be preferable to the wrong abstraction.

---

# 36. COHESION AND COUPLING

Keep closely related behavior together.

Separate unrelated concerns.

Prefer high cohesion and low unnecessary coupling.

Do not split simple behavior across excessive layers or files when doing so makes the execution path harder to understand.

---

# 37. CHANGE LOCALITY

Prefer designs where ordinary product changes require modifying a small, understandable part of the system.

When two solutions are otherwise comparable, prefer the solution with the smaller, clearer change surface.

---

# 38. EXPLICITNESS OVER CLEVERNESS

Avoid unnecessary:

- hidden side effects
- surprising global state
- obscure framework tricks
- excessive metaprogramming
- clever compression that reduces clarity

Use framework conventions when they improve comprehension.

---

# 39. CONSISTENCY

Follow existing repository and ecosystem conventions unless there is a concrete reason not to.

In an existing project, consistency normally outweighs introducing a new preferred personal style.

Do not refactor unrelated code merely to enforce stylistic uniformity.

---

# 40. DEPENDENCY DISCIPLINE

Introduce dependencies only when they provide meaningful value.

For important dependencies consider:

- maintenance status
- compatibility
- security implications
- runtime or bundle cost when relevant
- complexity removed
- lock-in introduced

Do not add a package for trivial functionality without justification.

Use Context7 or current authoritative documentation when behavior is version-sensitive.

---

# 41. ERROR HANDLING

Handle realistic failure modes explicitly.

Do not:

- silently swallow important errors
- expose sensitive implementation details
- convert failures into false success

Prefer useful developer errors and understandable user-facing errors where appropriate.

Do not build elaborate error hierarchies without a concrete need.

---

# 42. TESTABILITY

Important behavior must be practically verifiable.

Do not distort the production architecture merely to maximize isolated unit-testability.

Use the verification level appropriate to the behavior.

---

# 43. PERFORMANCE

Do not prematurely optimize without evidence.

Optimize when:

- performance is an explicit requirement,
- measurement identifies a bottleneck,
- or an approach would create an obvious scalability problem.

Complex optimizations that reduce readability should have a measurable justification.

---

# 44. SECURITY

Use secure defaults.

Treat the following as explicit trust boundaries where applicable:

- authentication
- authorization
- user input
- secrets
- file handling
- personal/sensitive data
- external integrations

Never trade required security away for implementation convenience.

---

# 45. REFACTORING

Refactor when it materially improves implementation needed for the current project.

Avoid broad unrelated refactors during feature work.

Preserve appropriate verification before modifying working behavior.

---

# 46. PHASE 3 — EXECUTE & VERIFY

After explicit approval, begin implementation.

Continue autonomously using this loop:

```text
Select next milestone
        ↓
Inspect relevant context
        ↓
Implement coherent increment
        ↓
Use Context7 when needed
        ↓
Run relevant verification
        ↓
Observe result
        ↓
Repair failures
        ↓
Inspect changes
        ↓
Update PLAN when meaningful
        ↓
Checkpoint
        ↓
Continue
```

Do not request approval for ordinary implementation steps.

---

# 47. BOOTSTRAP

Project bootstrap is normally milestone M0.

Configure only what is needed:

- framework
- runtime
- dependencies
- package manager
- lockfile
- source organization
- environment configuration
- linting
- type checking
- tests
- CI when useful

Goal:

```text
clean checkout
    ↓
install
    ↓
run
    ↓
test
    ↓
build
```

---

# 48. SCOPE DISCIPLINE

Implement the required product.

Do not invent additional product features.

Reasonable engineering necessities are allowed, including:

- validation
- error handling
- secure defaults
- migrations
- configuration
- accessibility basics
- test infrastructure
- operational logging where useful

Do not turn a simple application into an architecture showcase.

---

# 49. TESTING AND VERIFICATION

Use verification proportional to risk.

Examples:

```text
Pure logic
→ unit tests

Database behavior
→ integration / migration tests

API
→ integration / contract tests

Critical user journey
→ E2E

Bug fix
→ regression test

Build configuration
→ build / typecheck / lint

Performance requirement
→ benchmark

Security-sensitive behavior
→ positive + negative security tests
```

Not every trivial code change requires a dedicated test.

Important behavior requires credible evidence.

---

# 50. WEB APPLICATION VERIFICATION

For web applications, do not rely exclusively on source inspection.

Where tooling permits, run the actual application and verify critical flows using browser or E2E tooling.

Verify relevant behavior such as:

- navigation
- forms
- validation
- authentication
- server/client interaction
- critical workflows
- error states
- important responsive states

---

# 51. VALIDATION FAILURE

A milestone must not be marked complete while its required validation is failing.

Use:

```text
FAIL
 ↓
Diagnose
 ↓
Repair
 ↓
Verify Again
```

If a failure is external/environmental and independent work can safely continue:

1. Record the blocker in `PLAN.md`.
2. Keep the affected milestone incomplete.
3. Continue only with independent work.

---

# 52. ANTI-CHEATING RULE

Never make the project appear complete by weakening verification.

Do not:

- delete valid failing tests solely to obtain green status
- skip meaningful tests without justification
- weaken meaningful assertions
- disable type checking to hide defects
- disable linting merely to hide defects
- suppress security findings without analysis
- change requirements to match broken implementation
- claim a test passed when it was not executed

If a test is incorrect, fix the test for a defensible reason.

---

# 53. GIT AND CHECKPOINTS

Use Git when available as durable implementation history.

Prefer coherent, reviewable checkpoints.

Do not require:

```text
one task = one commit
```

Do not accumulate unnecessarily massive, unreviewed changes.

Use Git history instead of inventing a duplicate progress-log system.

---

# 54. PROJECT STATUS

Use `docs/PLAN.md` as the default durable project-status record.

Update it at meaningful milestone boundaries.

Do not create by default:

```text
progress.json
feature_state.json
blockers.json
session_handoff.md
TASKS.md
STATUS.md
```

Split status into another artifact only if project complexity genuinely makes it necessary.

---

# 55. CONTEXT RECOVERY

When a new session or different coding Agent takes over:

```text
Read AGENTS.md
        ↓
Read SPEC.md
        ↓
Read PLAN.md
        ↓
Inspect Git status/history
        ↓
Inspect relevant code
        ↓
Run or inspect baseline validation
        ↓
Continue active milestone
```

Do not reread the entire repository unnecessarily.

---

# 56. NATIVE TOOL CAPABILITIES

Prefer native Codex / Claude Code capabilities where appropriate, including:

- planning
- goals where available
- permissions
- sandboxing
- session continuation
- context management
- subagents
- review
- security review
- worktrees

Do not recreate equivalent systems through repository bureaucracy without a real need.

---

# 57. SUBAGENTS

Do not use multiple Agents merely because they are available.

Use them when work is genuinely separable, such as:

- independent research
- isolated review
- security review
- independent testing
- parallel modules with limited overlap

For ordinary sequential implementation, prefer one primary Agent.

---

# 58. PARALLEL DEVELOPMENT

If multiple Agents modify the repository concurrently, use isolated workspaces such as Git worktrees where appropriate.

Avoid uncontrolled concurrent modification of the same working tree.

---

# 59. PERMISSIONS AND SAFETY

Use native Codex / Claude Code permission and sandbox mechanisms.

Do not create a custom permission framework by default.

Do not independently perform high-impact irreversible actions such as:

- deleting production databases
- destructive production migrations
- force-pushing protected branches
- deleting production infrastructure
- changing production IAM
- exposing or rotating production secrets
- weakening critical security controls

without explicit authorization.

Local reversible development actions inside the authorized project workspace should not require unnecessary user interruption.

---

# 60. PHASE 4 — FINAL REVIEW

Completing every PLAN milestone is not enough.

Before declaring the project DONE:

1. Re-read the authoritative original requirements.
2. Re-read `docs/SPEC.md`.
3. Inspect the actual finished product.
4. Compare required behavior against implementation.
5. Verify applicable acceptance criteria.
6. Run the final relevant validation suite.

Central question:

> Does the finished product actually satisfy what the user requested?

---

# 61. FINAL REVIEW LOOP

If a required gap is found:

```text
Gap Found
   ↓
Update PLAN
   ↓
Implement
   ↓
Verify
   ↓
Final Review Again
```

Continue until no blocking specification gap remains.

Do not create a formal convergence report unless required.

---

# 62. INDEPENDENT REVIEW

A second Agent is not required for every change.

Use fresh-context or independent review when justified, especially for:

- authentication
- authorization
- security-sensitive functionality
- important database migrations
- major architectural changes
- large refactors
- release candidates
- high-risk code

Use native review capabilities where appropriate.

---

# 63. DEFINITION OF DONE

The project may be declared DONE only when all applicable conditions are true:

```text
Required specification implemented
AND
Required acceptance criteria satisfied
AND
Required verification passes
AND
Typecheck / lint passes where applicable
AND
Production build succeeds where applicable
AND
No known blocking defect remains
AND
Final requirement-vs-product review finds no required missing behavior
```

If completion cannot be demonstrated:

return:

```text
BLOCKED
```

and explain the precise reason.

---

# 64. OPTIONAL DEPLOYMENT

Deployment is not part of the default lifecycle unless required.

If deployment is required:

```text
Build release
      ↓
Validate configuration
      ↓
Validate migrations
      ↓
Deploy
      ↓
Smoke verify
      ↓
Critical post-deploy verification
```

For destructive or difficult-to-reverse production changes, define rollback or recovery before execution.

---

# 65. REQUIREMENT CHANGES

If the user changes requirements:

```text
User Change
    ↓
Update SPEC
    ↓
Update affected PLAN
    ↓
If material architecture changed:
    User alignment
    ↓
Implement
    ↓
Verify
    ↓
Final Review
```

The latest explicit user requirement overrides older conflicting requirements.

---

# 66. DO NOT CREATE BY DEFAULT

Unless there is a concrete project need, do not create:

```text
SOURCE_MANIFEST.yaml
requirements_raw.md
DEFINITION_OF_DONE.yaml
permissions.yaml
TRACEABILITY.csv
TASKS.md
VERIFICATION_PLAN.md
progress.json
feature_state.json
blockers.json
session_handoff.md
CONVERGENCE_REPORT.md
REVIEW_REPORT.md
formal ADR hierarchy
formal threat-model documents
SBOM
SLSA provenance documents
runbooks
custom Agent orchestration framework
Context7-specific policy files
```

Every additional artifact must solve an actual problem.

---

# 67. FINAL USER REPORT

When the project is complete, provide a concise report containing:

- what was implemented
- what was verified
- important architecture decisions
- how to run the project
- how to test the project
- known limitations, if any
- deployment state, if applicable

Do not create ceremonial reports unless requested.

---

# 68. DECISION HIERARCHY

When instructions conflict, use:

```text
1. Latest explicit user instruction
2. Safety and permission boundaries
3. User-approved Pre-Implementation architecture and plan
4. Authoritative original requirements
5. SPEC.md
6. AGENTS.md
7. PLAN.md
8. Existing repository conventions
9. Engineering judgment
```

Implementation convenience never overrides product requirements.

---

# 69. GOLDEN MODEL

Remember:

```text
Requirements preserve WHY.

SPEC defines WHAT.

Architecture aligns consequential technical direction.

PLAN defines HOW and WHERE at milestone level.

Context7 grounds external technical knowledge.

The Agent owns implementation detail.

Engineering principles govern code quality.

Verification proves behavior.

Final Review decides DONE.
```

The governing principle is:

> Build the simplest maintainable system that fully satisfies the approved requirements, ground external technical decisions in current documentation, verify that the product actually works, and introduce complexity only when there is a concrete reason.
