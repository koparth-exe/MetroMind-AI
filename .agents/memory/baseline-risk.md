---
name: Baseline risk interpretation
description: Modeling convention for separating observed service risk from optimization recommendations.
---

Route risk should be calculated against the current baseline fleet allocation, while optimization should report the capacity required to mitigate that risk.

**Why:** Measuring risk after applying the recommended allocation makes the dashboard appear risk-free and removes the evidence that justifies the recommendation.

**How to apply:** Use baseline capacity for dashboard/watchlist/risk evidence; use optimized capacity only in allocation results and before-versus-after comparisons. For the Mumbai demo, one 3,000-passenger train set per line is the baseline; additional sets are the mitigation recommendation.