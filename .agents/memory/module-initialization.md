---
name: Bundled module initialization
description: A startup constraint for top-level data generation in the API bundle.
---

Top-level demo-data construction must happen after any referenced `const` helpers have been initialized.

**Why:** The API bundle executes module initialization in order; calling a helper during a top-level export initializer can hit the temporal dead zone and prevent the server from starting.

**How to apply:** Keep generator functions declared early, but place their invocation after the helper constants they use, or use function declarations for helpers that are needed during module initialization.