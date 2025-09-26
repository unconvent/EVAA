# Playbooks: How To Use

This folder contains action‑oriented playbooks to help you ship faster and convert better. Use them as living documents tied to your build/release workflow.

## Why “Playbooks” (CRO‑friendly)
- Clear value: these are practical, step‑by‑step guides, not generic docs.
- Conversion‑oriented: each playbook maps to outcomes (sign‑in success, checkout, plan updates, UX consistency).
- Easy to navigate: short files with unambiguous titles.

## Files & When To Use Them
- `outline.md` — Start here for a 5‑minute overview of objectives, scope, architecture, data model, environments, and milestones.
- `design.md` — Use when building or reviewing UI. Provides tokens, components, and visual standards to keep the product consistent and fast to develop.
- `interaction.md` — Use when defining flows (sign‑in, checkout, portal) and handling states/errors/a11y. Ensures the UX is resilient and predictable.
- `todo.md` — Your execution checklist. Convert tasks into small, verifiable items and tick them off during sprints.

## Suggested Weekly Workflow
1) Plan (30 min)
   - Read `outline.md` for context.
   - Turn upcoming goals into items in `todo.md`.
2) Design (60 min)
   - Align on components/tokens in `design.md`.
3) Implement (Daily)
   - Follow flows in `interaction.md` while coding.
   - Keep `todo.md` updated as a source of truth.
4) Verify (Daily)
   - Run the smoke test in GUIDE.md (sign‑in → checkout → dashboard updates).
   - If issues arise, update playbooks to reflect fixes.

## Contributing & Maintenance
- Keep each file concise and outcome‑driven; avoid long essays.
- Prefer checklists and short sections over paragraphs.
- Update playbooks whenever flows or standards change (treat them as code).

## Linking From the App
- Add links to these playbooks from your `/docs` page or README so new contributors can onboard quickly.

