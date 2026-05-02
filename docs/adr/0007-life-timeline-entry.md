# ADR-0007: LifeTimelineEntry を Episode と分離する

- **ステータス**: 採用済み
- **決定日**: 2026-04-29

## 背景

v0.2 では「素材レイヤー」として「人生年表（自分大全）」を追加する。
既存の `Episode` は「具体的なエピソード（STAR形式）」を表すエンティティであり、人生年表の「ある期間に何があったか」とは粒度・目的が異なる。

## 決定

`LifeTimelineEntry` を `Episode` とは独立した新エンティティとして定義する。

### 理由

1. **粒度が異なる**: Episode は STAR 形式の詳細エピソード（数百字〜）、LifeTimelineEntry は年齢・年単位の概要（数十字）
2. **目的が異なる**: Episode は「面接での具体エピソード素材」、LifeTimelineEntry は「自己理解・棚卸しの地図」
3. **参照方向が一方向**: LifeTimelineEntry は `relatedEpisodeIds` で Episode を参照するが、Episode は LifeTimelineEntry を知らない（依存の方向を明確化）
4. **将来の拡張性**: LifeTimelineEntry は将来的に「強みマップ」「転機グラフ」等の可視化の基盤になりうる。Episode に混ぜると双方が肥大化する

### 代替案

**Episode に年齢フィールドを追加する** — 棄却。Episode の STAR 形式と年表の概要フォームは UI 設計から異なり、一つのエンティティに収めると双方が中途半端になる。

## 結果

- `packages/kernel/src/domain/life-timeline-entry.ts` に `LifeTimelineEntry` 型を定義
- `packages/kernel/src/schemas/life-timeline-entry.ts` に Zod スキーマを定義
- `packages/kernel/src/ports/life-timeline-storage-port.ts` に StoragePort を定義
- `packages/kernel/src/exporters/jibun-taizen.ts` に Markdown エクスポーターを実装
- SQLite アダプターは PR 1b（desktop 側）で別途追加する
