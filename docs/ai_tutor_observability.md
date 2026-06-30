# AI Tutor Admin Observability Queries

The AI Tutor system operates as a governed educational infrastructure layer. To monitor system health, cost, cache efficiency, and provider reliability, administrators can run the following SQL queries directly in the Supabase SQL Editor.

### 1. Total Requests and Cache Efficiency (Last 24 Hours)
Understand the basic volume and how much money the cache is saving.
```sql
SELECT
    COUNT(*) as total_requests,
    SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits,
    SUM(CASE WHEN NOT cache_hit THEN 1 ELSE 0 END) as cold_generations,
    ROUND((SUM(CASE WHEN cache_hit THEN 1.0 ELSE 0.0 END) / COUNT(*)) * 100, 2) as cache_hit_percentage
FROM public.ai_request_logs
WHERE created_at >= NOW() - INTERVAL '24 hours';
```

### 2. Provider Usage & Fallback Depth Analysis
Monitor if the primary model is failing and forcing fallbacks to secondary models.
```sql
SELECT
    provider_used,
    fallback_depth,
    COUNT(*) as generations,
    ROUND(AVG(latency_ms), 0) as avg_latency_ms
FROM public.ai_request_logs
WHERE cache_hit = false AND error_type IS NULL
GROUP BY provider_used, fallback_depth
ORDER BY fallback_depth ASC, generations DESC;
```

### 3. Error and Abuse Tracking (Quota Rejections)
Track spikes in quotas or provider failures.
```sql
SELECT
    error_type,
    COUNT(*) as occurrences,
    COUNT(DISTINCT user_id) as affected_users
FROM public.ai_request_logs
WHERE error_type IS NOT NULL
GROUP BY error_type
ORDER BY occurrences DESC;
```

### 4. Most Requested / Expensive Questions (Top 10)
Find out which questions are heavily queried. This helps identify popular topics or potential scraping abuse.
```sql
SELECT
    question_id,
    COUNT(*) as total_requests,
    SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits,
    SUM(CASE WHEN NOT cache_hit THEN 1 ELSE 0 END) as cold_generations
FROM public.ai_request_logs
WHERE question_id IS NOT NULL
GROUP BY question_id
ORDER BY total_requests DESC
LIMIT 10;
```

### 5. Explanation Lifecycle Status (Content Governance)
Monitor the state of the permanent educational asset library.
```sql
SELECT
    status,
    COUNT(*) as total_explanations
FROM public.ai_explanations_cache
GROUP BY status;
```

*Note: Telemetry data in `ai_request_logs` is kept for 30 days. Plan to implement a pg_cron cleanup script to maintain performance.*
