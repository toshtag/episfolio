-- 0039: strength_arrows / life_timeline_entries から related_episode_ids カラムを廃止する
--
-- Episode entity 削除（後続 migration）への準備。
-- 書籍非由来の Episode への参照を強み発掘ワーク・自分大全の双方から取り除く。
-- テーブル再作成パターン（migration 0007 / 0038 と同様）でカラムを drop する。

-- strength_arrows
ALTER TABLE strength_arrows RENAME TO strength_arrows_old;

CREATE TABLE strength_arrows (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('interest', 'evaluation', 'request')),
  description TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  occurred_at TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO strength_arrows (
  id, type, description, source, occurred_at, note, created_at, updated_at
)
SELECT
  id, type, description, source, occurred_at, note, created_at, updated_at
FROM strength_arrows_old;

DROP TABLE strength_arrows_old;

-- life_timeline_entries
ALTER TABLE life_timeline_entries RENAME TO life_timeline_entries_old;

CREATE TABLE life_timeline_entries (
  id TEXT PRIMARY KEY,
  age_range_start INTEGER NOT NULL DEFAULT 0,
  age_range_end INTEGER NOT NULL DEFAULT 0,
  year_start INTEGER,
  year_end INTEGER,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('education', 'work', 'family', 'health', 'hobby', 'other')),
  summary TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (age_range_start <= age_range_end)
);

INSERT INTO life_timeline_entries (
  id, age_range_start, age_range_end, year_start, year_end, category,
  summary, detail, tags, created_at, updated_at
)
SELECT
  id, age_range_start, age_range_end, year_start, year_end, category,
  summary, detail, tags, created_at, updated_at
FROM life_timeline_entries_old;

DROP TABLE life_timeline_entries_old;
