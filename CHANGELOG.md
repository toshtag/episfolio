# Changelog

Keep a Changelog 形式（https://keepachangelog.com/ja/1.1.0/）
バージョニングは Semantic Versioning（https://semver.org/lang/ja/）に従う。

## [Unreleased]

### Added
- **LifeTimelineEntry ドメイン層**: `LifeTimelineEntry` 型・Zod スキーマ・`LifeTimelineStoragePort`（ADR-0007）
- **自分大全エクスポーター**: `toJibunTaizenMarkdown()` — 年齢順 Markdown テーブル生成
- **revision-diff エクスポーター**: `computeUnifiedDiff()` / `formatUnifiedDiff()` — LCS ベースの行単位 unified diff
- **自分大全テンプレート**: `templates/jibun-taizen.md` — 骨格テンプレート
- **DocumentRevision 拡張**: `revisionReason`（必須）/ `targetMemo` / `previousRevisionId` フィールドを追加
- **ADR-0007**: LifeTimelineEntry を Episode と分離する判断を記録

---

## [0.1.0] - 2026-04-29

### Added
- **Episode 管理**: エピソードの作成・編集・削除 UI（Tauri + Lit）
- **エビデンス管理**: 手書きエビデンスの作成 UI（`source: 'manual'`）、AI/手書きバッジ表示（ADR-0007 / RJ-0010）
- **キャリアドキュメント**: Document / DocumentRevision ドメイン型、手動編集 UI（ADR-0007）
- **Settings 画面**: OS keychain への API key 保存・接続テスト・削除
- **SQLite ストレージ**: migration 0001〜0004（episodes / ai_runs / skill_evidence / source カラム）
- **kernel ドメイン層**: Episode / AIRun / SkillEvidence / CareerDocument / DocumentRevision 型、Zod スキーマ、StoragePorts
- **Phase 0 運用基盤**: hooks / skills / GitHub テンプレート / CI / ADR 0001〜0007

### Changed
- タブ名「Evidence」→「エビデンス」（日本語トンマナ統一）

### Known limitations
- AI による Evidence 自動抽出・Document 自動生成は v0.1 では提供しない（ADR-0007）。信頼担保 UX が完成する v0.2 以降で実装予定
- 配布バイナリ・署名・notarize 未対応（`pnpm tauri dev` での動作確認のみ）
- macOS 専用（Windows / Linux は v0.8 予定）

---

<!-- リリース時はこの下に追加 -->
