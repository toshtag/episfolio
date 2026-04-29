ALTER TABLE skill_evidence ADD COLUMN source TEXT NOT NULL DEFAULT 'ai-generated';
UPDATE skill_evidence SET source = 'ai-generated' WHERE source IS NULL OR source = '';
