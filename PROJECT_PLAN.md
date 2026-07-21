# HRC Simulation Project — Execution & Risk Management Plan

**Deadline:** September 3, 2026 &nbsp;|&nbsp; **Planned completion:** September 1, 2026 &nbsp;|&nbsp; **Prepared:** July 17, 2026

---

## 1. Overview & Schedule Summary

**Scope:** 37 spots across two field sizes — 1,500 players (19 spots, 2,100 hands) and 300 players (18 spots, 1,991 hands) — **4,091 hand files total** in `output_hands/`. Each hand is imported into HRC, configured with its betting script, and solved with 2 Nash calculations (~45–60 min each).

**Approach:** Fully automated pipeline (xdotool) running on 10 parallel EC2 instances. Each instance works through its assigned queue of hands unattended, 24/7, and saves results automatically.

**Schedule at a glance:**

| Phase | Dates | Duration |
|---|---|---|
| Automation finalized (incl. auto-save + parallel queues) | Jul 17 – 21 | 4 days |
| Production sims on 10 instances | Jul 21 – Aug 18 | 28 days (incl. 20% buffer) |
| Verification & re-runs | Aug 18 – 28 | 10 days |
| Final delivery | **Sep 1** | 2 days before deadline |

**Why 10 instances** — processing time by instance count:

| Instances | Total Time (No Buffer) | Total Time (With 20% Buffer) |
|---|---|---|
| 1 | 229 days | 275 days |
| 5 | 46 days | 55 days |
| **10** | **23 days** | **28 days** |
| 15 | 16 days | 19 days |
| 20 | 12 days | 14 days |

10 instances completes the sims by **Aug 18** even with the full 20% buffer consumed — leaving **16 additional days of slack** before the deadline. Scaling to 15 instances is a pre-planned fallback (Section 3), not an emergency measure.

---

## 2. Execution Milestones

Progress is **directly measurable at any moment**: the automation moves each completed hand into a `processed/` folder, so a simple file count gives the exact number of finished hands per instance — no estimates, no self-reporting.

| Date | Milestone | Exit criteria (measurable) |
|---|---|---|
| Jul 17–18 | Result auto-save + parallel-queue handling built | A solved hand's results are saved to disk automatically, with multiple queues running |
| Jul 19–20 | Automation cloned to all 37 spots | 1 hand validated end-to-end for each field size; all 37 configs reviewed |
| Jul 20–21 | 10 instances provisioned & smoke-tested | Each instance completes 1 full hand (import → 2 calcs → saved result) |
| **Jul 21** | **Production start** | All 10 queues running |
| Jul 27 | Checkpoint 1 | ≥ 875 hands processed (pace line: ~146/day) |
| Aug 3 | Checkpoint 2 | ≥ 1,900 hands processed |
| Aug 10 | Checkpoint 3 | ≥ 2,925 hands processed |
| Aug 17 | Checkpoint 4 | ≥ 3,950 hands processed |
| **Aug 18** | **All sims complete** | 4,091 / 4,091 hands in `processed/`, all results saved |
| Aug 18–28 | Verification pass | Every hand's result file verified present and valid; failed hands re-run |
| **Sep 1** | **Final delivery** | Complete result set handed over |

Every checkpoint reports: hands completed vs. pace line, status (ahead / on pace / behind), and the **projected finish date** based on actual throughput — so any drift is visible weeks before it could threaten the deadline.

---

## 3. Risk Mitigation Strategy

Anticipated causes of delay and the preventive measure already in place for each:

| # | Risk | Prevention |
|---|---|---|
| 1 | UI automation breaks (dialog change, focus loss) | Every spot validated end-to-end before production. Instances run dedicated desktops with nothing else open (no focus interference). Per-hand checkpointing limits any break to at most 1 hand of lost work. |
| 2 | Calculations run longer than estimated | Wait logic has **no timeout** — the script physically cannot skip ahead of an unfinished calc. Overruns are absorbed by the 20% buffer + 16 days of slack, and detected early by the weekly pace line. |
| 3 | Instance crash / failure | Hands are marked processed **only after** completion, so a restarted instance resumes exactly where it stopped — zero re-work, zero manual recovery. An AMI snapshot allows a replacement instance in under 1 hour. |
| 4 | HRC install/license issues at scale | Verified on all 10 instances during Jul 20–21 provisioning — before production start, not during it. |
| 5 | Result files lost | Auto-save writes results **before** a hand is marked processed; results backed up off-instance daily. |
| 6 | Disk space exhaustion | Sized at provisioning; free space included in the daily status report. |
| 7 | HRC internal sim-queue limit (~20 queued sims max) | Not applicable by design: the automation feeds each HRC instance **one hand at a time** (never queues ahead), so the internal queue never holds more than the active sim. Limit to be confirmed during Jul 20–21 smoke tests. |
| 8 | Behind pace at a checkpoint | Pre-approved recovery path: scale to 15 instances (19 days with buffer). This is a planned decision with known cost and lead time — not a scramble. |

---

## 4. Contingency Plans

**If a technical blocker occurs, the team handles it independently, within a fixed time limit:**

1. **Detection** — a stalled queue is flagged automatically: any instance with no newly processed hand for **3+ hours** is checked immediately.
2. **Isolation** — the affected instance is taken aside; the other 9 continue uninterrupted. Because of per-hand checkpointing, the maximum possible loss from any single blocker is **one in-flight hand (~0.02% of the project)**.
3. **Resolution time-box** — the team has **24 hours** to diagnose and resolve the blocker independently (restart, re-provision from AMI, fix and redeploy the automation). The stalled queue's remaining hands are redistributed to healthy instances in the meantime if needed.
4. **Escalation (rare, pre-defined)** — the manager is involved **only if** a blocker exceeds its 24-hour window **and** the projected finish date moves past **Aug 25**. Escalation always arrives with a recommended solution attached (e.g., "approve scale-up to 15 instances") — a decision to approve, never a problem to solve.

The buffer math backs this up: the schedule tolerates ~5 days of cumulative unplanned downtime across the fleet before the Aug 18 target is even at risk, and a further 16 days before the deadline is.

---

## 5. Communication Protocol

The manager will **never be surprised** and will **never need to troubleshoot** — only review.

| Report | When | Content |
|---|---|---|
| **Daily status** | End of each day (async message) | One line, auto-generated from `processed/` file counts: `X / 4,091 hands (Y%) — pace: on/ahead/behind — projected finish: <date>` |
| **Weekly checkpoint** | Jul 27, Aug 3, Aug 10, Aug 17 | Short summary: progress vs. pace line, issues encountered **and already resolved**, buffer remaining, projected finish date |
| **Exception alert** | Only if projected finish crosses Aug 25 | Cause, impact, and a ready-to-approve recommendation (e.g., scale to 15 instances) |

Rules of the protocol:

- Status numbers come from the filesystem (`processed/` counts), not manual estimates — they cannot be optimistic by accident.
- Anything that went wrong appears in reports **after** it has been handled, with what was done about it.
- The only decision that will ever be brought to the manager is a pre-framed one (approve/deny scale-up), and only if the early-warning threshold (Aug 25 projection) is crossed — 9 days before the actual deadline.

---

*Summary: 10 instances finish 16 days early even after a 20% buffer; progress is counted from disk daily; every identified risk has a preventive measure in place; any blocker is contained to one instance and resolved by the team within 24 hours; the manager reviews one line a day and four weekly summaries — nothing else.*
