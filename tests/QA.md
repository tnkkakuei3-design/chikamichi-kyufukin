# Verification — 2026-10-23 result recovery

- Restored the `6d45416` benefit calculator and result rendering after the LP rollback removed them.
- The compact LP sections remain; no expanded basis/case-study/procedure section was restored.
- The results action links to `service/`, not the removed procedure section.
- Added versioned script URLs to avoid mixing cached four-question and estimator assets.
- `node --test tests/benefits.test.cjs`: all 9 tests passed.
- `node --check docs/app.js` and `git diff --check`: passed.
- All local file and fragment references resolve; no LINE links or obsolete four-question claims.
- Browser: age 35–44, ordinary resignation, qualifying 12 months, 1–4 years, no special category, monthly salary 300,000 → 567,630 yen / 90 days.
- Browser: age 45–59, qualifying 12 months, 1–4 years, confirmed employment-difficulty category, monthly salary 520,000 → 3,119,760 yen / 360 days.
- Both amounts rendered in the visible result dialog after the salary form was submitted.
- Unknown salary and unconfirmed eligibility inputs are covered by the recovered calculator tests.
- Advertising images, production `turn.loan`, and DNS are unchanged.
