## 2026-02-17 - [Optimizing Character Frequency Analysis]
**Learning:** `String.prototype.match` with global regex is extremely fast in V8, but creating regex objects inside loops adds up if iterations are massive. However, for sparse data, `String.prototype.includes` as a pre-check before regex execution yields significant gains (~25% in this case) by avoiding the regex engine entirely.
**Action:** Always consider "fail-fast" string checks (`includes`, `startsWith`) before invoking heavier regex machinery, especially in loops over user content.

## 2026-02-18 - [Optimizing Word Count]
**Learning:** Counting words via `split(/\s+/).filter(...)` creates a massive array of strings equal to the word count, causing high memory usage and GC pressure. A simple `regex.exec` loop avoids this allocation entirely and is ~40% faster.
**Action:** Prefer `regex.exec` loops over `split` or `match` when only counting occurrences in large strings.
