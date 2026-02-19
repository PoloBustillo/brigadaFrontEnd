# Mobile QA Checklist (Roles + CMS Boundaries)

## Global

- [ ] No screen shows action labels that imply CMS operations (`crear`, `asignar`, `publicar`, `aprobar`) unless action is purely informational.
- [ ] Informational screens show CMS notice banner.
- [ ] Pull-to-refresh works without crashes.
- [ ] Empty state copy is explicit and non-blocking.
- [ ] Error banner appears when API fails and allows retry.

## Brigadista

- [ ] Route `/(brigadista)/surveys/index` redirects to `/(brigadista)/my-surveys`.
- [ ] Survey fill flow runs one-question-per-screen with visible bottom actions.
- [ ] Bottom navigation does not overlap input/actions on fill screen.
- [ ] `Mis Respuestas` loads from real API (`/mobile/responses/me`).

## Encargado

- [ ] Home metrics show real values (team, assigned surveys, responses).
- [ ] Team list in home reflects real members and response recency.
- [ ] `Encuestas`, `Respuestas`, `Asignaciones` are read-only in mobile.
- [ ] Tapping cards in read-only screens does not lead to dead-end navigation.

## Admin

- [ ] `Asignaciones` loads from `/assignments` and renders read-only list.
- [ ] `Respuestas` loads from `/admin/responses/summary` and renders per-survey summary.
- [ ] `Encuestas` and `Usuarios` remain read-only.
- [ ] No debug controls are visible in production profile screens.

## UX Consistency

- [ ] Similar cards use similar hierarchy (title → status → metadata).
- [ ] Status chips use consistent labels and colors across roles.
- [ ] Informational icon in read-only rows is `eye-outline`.
- [ ] Copy consistently says operations are managed in CMS web.
