---
phase: 05
slug: focus-session-features
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-07
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm run test:all` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --reporter=verbose` (quick smoke test)
- **After every plan wave:** Run `npm run test:all` (full suite with coverage)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | TASK-01, TASK-02 | T-05-01 | Server-side edit lock enforcement | unit | `npm test -- task-submission.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | TASK-03 | T-05-02 | Task prompt timer accurate to session start time | unit | `npm test -- task-prompt.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | TASK-04 | — | Confetti trigger rate-limited to 1 per session | unit | `npm test -- confetti.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | TASK-05, TASK-06, COMM-03 | — | Task carry-over shown as suggestion only (no auto-fill) | unit | `npm test -- task-carryover.test.ts` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 1 | GAME-01 | T-05-03 | Server-side streak calculation using MongoDB aggregation | unit | `npm test -- streak-calculation.test.ts` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 2 | GAME-02, GAME-03 | — | Session history shows completed + incomplete sessions | integration | `npm test -- session-history.test.ts` | ❌ W0 | ⬜ pending |
| 05-04-01 | 04 | 2 | CAPT-01, CAPT-02, CAPT-03 | T-05-04 | Admin-only captain assignment endpoints | integration | `npm test -- captain-assignment.test.ts` | ❌ W0 | ⬜ pending |
| 05-04-02 | 04 | 2 | CAPT-04, CAPT-05 | T-05-05, T-05-06 | Captain sees aggregate count only (not individual tasks) | unit | `npm test -- captain-task-visibility.test.ts` | ❌ W0 | ⬜ pending |
| 05-04-03 | 04 | 2 | CAPT-06, CAPT-07 | T-05-07 | Max 2 captain sessions per day enforced server-side | unit | `npm test -- captain-daily-limit.test.ts` | ❌ W0 | ⬜ pending |
| 05-05-01 | 05 | 2 | ADMN-04, ADMN-07 | T-05-08 | Emergency captain assignment available to admin | integration | `npm test -- emergency-captain-assignment.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/tasks/task-submission.test.ts` — Task submission with 100 char limit validation
- [ ] `tests/unit/tasks/task-prompt.test.ts` — 5-minute completion prompt timing
- [ ] `tests/unit/tasks/confetti.test.ts` — Confetti celebration trigger
- [ ] `tests/unit/tasks/task-carryover.test.ts` — Task carry-over as suggestion
- [ ] `tests/unit/gamification/streak-calculation.test.ts` — Server-side streak calculation
- [ ] `tests/unit/gamification/session-history.test.ts` — Session history query
- [ ] `tests/unit/captains/captain-eligibility.test.ts` — Captain eligibility (4+ sessions)
- [ ] `tests/unit/captains/captain-rewards.test.ts` — Free session credit tracking
- [ ] `tests/unit/captains/captain-daily-limit.test.ts` — Max 2 captain sessions per day
- [ ] `tests/integration/captains/captain-assignment.test.ts` — Captain assignment API
- [ ] `tests/integration/captains/captain-task-visibility.test.ts` — Aggregate task visibility
- [ ] `tests/integration/captains/captain-mute-controls.test.ts` — Captain mute controls
- [ ] `tests/integration/captains/emergency-captain-assignment.test.ts` — Emergency captain assignment

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Confetti animation | TASK-04 | Visual verification | Complete a task and verify confetti displays smoothly without video stutter |
| Task overlay hover expansion | TASK-02 | Visual verification | During video session, hover over task card and verify full task text appears |
| Streak break messaging | GAME-01 | UX tone verification | Break streak intentionally and verify "Ready to start a new streak!" message appears |
| Captain panel aggregate count | CAPT-04 | Visual verification | As captain, verify only aggregate count (8/10) shows, not individual tasks |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
