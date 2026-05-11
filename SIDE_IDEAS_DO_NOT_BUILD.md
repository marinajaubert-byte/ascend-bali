# Side Ideas — Do Not Build Yet

These ideas surfaced during the Mission Control integration work. They did not
pass the stop-hook rules (revenue relevance, MVP scope, existing coverage) and
should not be built until the core Mission Control features ship and are proven.

---

| Idea | Why deferred |
|------|-------------|
| Daemon / auto-agent spawner | Complex, needs testing framework. Marina controls when agents run. Build after inbox + approval flow is validated. |
| Field Ops (X, Ethereum, Reddit adapters) | High-risk external execution. Not needed for MVP. |
| Encrypted credential vault | No immediate need — existing auth handles access. |
| Vercel / public deployment pipeline | SaaS path is valid long-term but not needed until core features are stable. |
| Stripe billing / SaaS onboarding | Post-MVP. Architecture already allows for it — no decisions block it. |
| FigJam / design integration | Zero revenue relevance at this stage. |
| Multi-workspace / team accounts | Single-user for now. Add when first external user arrives. |
| Custom slash commands auto-generation | Useful later for Claude Code integration. After core UI is working. |
| Notion memory sync | Investigate ROI before building. May be solved by brain dump + goals. |
| Social media scheduling module | Separate from Mission Control core. Build as standalone feature later. |
| Events revenue tracking module | Valuable but distinct feature scope. Add after today/tasks/goals are live. |

---

Review date: Q4-2026 or when core Mission Control features have been live for 30 days.
