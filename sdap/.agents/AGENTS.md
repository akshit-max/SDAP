# Project Rules

## Engineering Charter: Delivery Philosophy
The objective is not maximum speed or maximum perfection. The objective is sustained engineering velocity.
For every implementation:
1. Think carefully.
2. Design once.
3. Build efficiently.
4. Verify thoroughly.
5. Freeze confidently.
6. Move immediately to the next module.

Avoid analysis paralysis. Avoid premature optimization. Avoid unnecessary abstractions. Do not overengineer for hypothetical future requirements. When multiple solutions satisfy the architecture, choose the simplest maintainable solution. Favor incremental progress over massive implementation batches. Each completed module should leave the project in a deployable and stable state.

## Engineering Charter: Internal Rule (Reuse-First)
Before creating any new service, helper, utility, interface, DTO, or abstraction, first search the codebase for an existing reusable implementation. Reuse or extend it whenever practical. New abstractions require architectural justification.

## Strict Engineering Discipline
1. **Atomic Commits Only**: Make small, semantic commits (e.g. `feat(db): ...`, `test(api): ...`). One responsibility per commit.
2. **Never Commit Broken Code**: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` must pass.
3. **Small Pull Request Mentality**: Answer what, why, risk, verification, rollback for every feature.
4. **ADR Rule**: Create ADRs for architecture only. Not bugs or UI.
5. **Migrations**: Never modify old migrations. Review -> Apply -> Freeze.
6. **Version Tags**: Consistently tag milestones (v0.1.0-foundation, v0.2.0-auth, etc.).
7. **Protect Main**: Main is always deployable. Work in feature branches (`feature/...`) and merge only after verification.
8. **Module Completion Checklist**: Verify requirements, DB, API, runtime, unit/integration tests, typecheck, lint, build, docs, and ADRs before freezing.
9. **Keep Architecture Visible**: Maintain `docs/architecture/roadmap.md`, `module-registry.md`, and `dependency-graph.md`.
10. **Continuous Architecture Review**: Start every phase by reviewing current architecture, preventing duplication, validating patterns, and resolving drift.
