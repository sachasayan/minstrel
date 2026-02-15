## 2025-02-15 - React Performance Anti-Patterns
**Learning:** `useEffect` setting local state based on props (e.g., `activeProject`) causes an extra render cycle. Using `useMemo` to derive values directly avoids this and keeps the component pure.
**Action:** Always check if state can be derived before using `useEffect` + `useState`.

## 2025-02-15 - MDXEditor Optimization
**Learning:** `MDXEditor` requires stable references for its `plugins` prop. Passing a new array on every render causes full re-initialization of the editor instance.
**Action:** Always memoize the `plugins` array for `MDXEditor`.
