ALTER TABLE document_revisions ADD COLUMN revision_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE document_revisions ADD COLUMN target_memo TEXT NOT NULL DEFAULT '';
ALTER TABLE document_revisions ADD COLUMN previous_revision_id TEXT;
