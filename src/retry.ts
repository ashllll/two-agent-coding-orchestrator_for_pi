// Placeholder for Phase 2.
// Planned: retry cooldown, .orch/error-history.log, backoff, max retries per window.

export interface RetryPolicy {
  maxAttempts: number;
  windowSeconds: number;
  maxPerWindow: number;
}
