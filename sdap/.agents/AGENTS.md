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
