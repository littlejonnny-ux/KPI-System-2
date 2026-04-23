-- Baseline migration marker
-- Date: 2026-01-01
--
-- This file marks the point at which local migration tracking begins.
-- The remote database already contains 9 applied migrations (Stage 1-9,
-- timestamps 20260414194136 through 20260414194459) created before local
-- migration tracking was established. These are tracked in Supabase remote
-- only and are covered by the baseline schema state represented here.
--
-- To inspect the full schema at this baseline point:
--   npx supabase db dump -s public (requires Docker Desktop)
-- Or view remote migration history:
--   npx supabase migration list

SELECT 1; -- no-op to ensure non-empty file
