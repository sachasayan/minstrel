## 2026-02-17 - [Optimizing Character Frequency Analysis]
**Learning:** `String.prototype.match` with global regex is extremely fast in V8, but creating regex objects inside loops adds up if iterations are massive. However, for sparse data, `String.prototype.includes` as a pre-check before regex execution yields significant gains (~25% in this case) by avoiding the regex engine entirely.
**Action:** Always consider "fail-fast" string checks (`includes`, `startsWith`) before invoking heavier regex machinery, especially in loops over user content.
