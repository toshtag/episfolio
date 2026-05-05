-- 0042: episodes テーブルを廃止する
--
-- 書籍非由来の Episode entity を削除する最終ステップ。
-- 既に migration 0038/0039 で他 entity からの Episode 参照は除去済み。
-- v0.13 で AI 機能を復活する際に「経験素材」が必要なら、
-- LifeTimelineEntry / 強み発掘ワーク 5 種を canonical な情報源として再構築する。

DROP TABLE IF EXISTS episodes;
