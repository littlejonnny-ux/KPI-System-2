@AGENTS.md

## После compaction

После каждого compaction (autocompact или ручного /compact) — ОБЯЗАТЕЛЬНО перечитай:
1. `.claude/workflow/CYCLE.md` — полный цикл задачи, post-merge шаги, Living Docs Dashboard
2. `.claude/workflow/TRIGGER_MAP.md` — все триггеры активации skills/agents/commands
3. `.claude/workflow/LEARNED_OVERRIDES.md` — маркеры, переопределяющие триггеры
4. `.claude/workflow/LEARNED_PATTERNS.md` — технические паттерны, дополняющие реализацию
5. `.claude/skills/e2e-testing/SKILL.md` — трёхуровневая схема E2E, счётчик, шаблоны
6. `.claude/workflow/RETROSPECTIVE.md` — 5 шагов ретроспективы

Эти документы содержат критические развилки процесса и накопленные маркеры обучения,
которые теряются при сжатии контекста. Без перечитывания LEARNED_OVERRIDES — риск
избыточной активации агентов вопреки накопленным правилам. Без перечитывания других —
высокий риск пропуска post-merge шагов (update-docs, ретроспектива, E2E).
