-- 0010: document_revisions.job_target_id を追加
--
-- ADR-0010 に基づき、Revision レベルでの求人別追跡を構造化する。
-- - NULL 許容（kernel `DocumentRevisionSchema` の default null と整合）
-- - FK は張らない: JobTarget 削除時の連鎖をどう扱うかは別判断（緩い参照）
-- - 既存 row はすべて NULL で初期化される

ALTER TABLE document_revisions ADD COLUMN job_target_id TEXT;
