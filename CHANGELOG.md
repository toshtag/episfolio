# Changelog

Keep a Changelog 形式（https://keepachangelog.com/ja/1.1.0/）
バージョニングは Semantic Versioning（https://semver.org/lang/ja/）に従う。

## [Unreleased]

---

## [0.2.2] - 2026-05-01

Codex レビュー P1 全件解消の data integrity / test coverage patch。挙動変更なし、新機能なし、データ整合性とテストカバレッジ強化のみ。

### Added
- **DB CHECK 制約**（migration `0007_enum_check_constraints.sql`）: `skill_evidence.{confidence,status,source,created_by}` / `career_documents.status` / `document_revisions.created_by` / `life_timeline_entries.category` の各 enum カラムに CHECK を追加。`life_timeline_entries` には `CHECK (age_range_start <= age_range_end)` も追加。SQLite が ALTER で CHECK 追加できないためテーブル再作成パターンで実装
- **kernel schema refine**: `LifeTimelineEntrySchema` に `ageRangeStart <= ageRangeEnd` の refine を追加
- **kernel schema test 網羅** (+37 件、90 → 127): `SkillEvidence` / `CareerDocument` / `DocumentRevision` / `AIRun` / `LifeTimelineEntry` の各 schema を test で守る
- **Rust 統合テスト** (+16 件、4 → 20): in-memory SQLite ハーネス `open_in_memory_with_migrations()`、migration 適用 / CHECK 違反 / FK orphan / `previous_revision_id` 接続を網羅

### Changed
- `LifeTimelineEntryUpdateSchema` を partial 専用に再構築（両端の関係性 refine は持たず、merge 後の検証は Rust 側で行う方針。片方だけ更新する正当なケースを許可するため）
- 全パッケージの version を 0.2.2 に揃える

### Fixed
- 不正な enum 値が DB に入る経路を CHECK 制約で物理的に閉じた（直 SQL や Rust command バグでも入らない）

---

## [0.2.1] - 2026-05-01

v0.2.0 の security / integrity hotfix。Codex レビュー（内部）の P0 5 件への対応。

### Removed
- **AI 送信 / API key Tauri command を物理削除**: `save_api_key` / `load_api_key` / `delete_api_key` / `test_openai_connection` / `extract_evidence` / `generate_document` の 6 command が `invoke_handler` に登録されたままだった。UI hide では Tauri の権限境界として無意味（WebView から `invoke()` で直接呼べる）状態を、コード自体を削除することで物理的に閉じる（ADR-0009）
- **OpenAI adapter / settings.rs を削除**
- **frontend の AI 系 IPC wrapper を削除**: `ipc/settings.ts` 全削除、`ipc/{evidence,documents}.ts` から `extractEvidence` / `generateDocument` 削除
- **`Cargo.toml` から `keyring` / `reqwest` / `tokio` を削除**: v0.5 で AI 復活時に再追加
- README v0.2 機能一覧から「Markdown / JSON エクスポート」「年齢順 Markdown エクスポート」を削除（実装が伴っていなかった、v0.7 へ統合）

### Added
- **`create_document_revision_manual` Tauri command**: 既存 document に対して新 revision を挿入し、`previous_revision_id` に直前 revision の ID をセットし、`career_documents.updated_at` を更新する
- **DocumentRevision UI**: 改訂理由（必須）・宛先メモ（任意）入力欄、改訂履歴一覧セクション
- **`.github/workflows/ci.yml`**: Node (typecheck / lint / test / build) と Rust (cargo test / clippy) の CI gate
- **CSP strict policy**: `tauri.conf.json` の `csp: null` を `default-src 'self'; ...; connect-src 'self' ipc: http://ipc.localhost; ...` に変更
- **ADR-0009**: AI 送信 / API key command を feature gate ではなくコード削除する判断と、v0.5 復活時の方針

### Changed
- **DocumentRevision の保存ロジック**: これまで保存ごとに新 document を作っていたが、既存 document への revision 追加に修正（document_id を保ったまま `document_revisions` テーブルに新行追加）
- `DocumentRevisionRow` IPC 型に `revisionReason` / `targetMemo` / `previousRevisionId` を追加（kernel 型と整合）
- `create_document_manual` の args に `revisionReason?` / `targetMemo?` を追加（初版用、未指定時は "初版" デフォルト）
- 全パッケージの version を 0.2.1 に揃える（root package.json / kernel / desktop / Cargo.toml / tauri.conf.json / KERNEL_VERSION）

### Fixed
- **`pnpm build` が失敗していた**: Vite 8 の `transformWithEsbuild` deprecated 化により、`esbuild` を direct devDep に追加（packages/desktop/package.json）

### Security
- WebView 内で任意 JS が動いた場合に keychain の API key が抜ける経路（`load_api_key` が secret を frontend に返す）を、command 削除と CSP 強化で二重に閉じた
- 外部 HTTPS への直接 fetch を CSP の `connect-src` 制限で遮断

---

## [0.2.0] - 2026-04-29

### Added
- **LifeTimelineEntry ドメイン層**: `LifeTimelineEntry` 型・Zod スキーマ・`LifeTimelineStoragePort`（ADR-0007）
- **自分大全エクスポーター**: `toJibunTaizenMarkdown()` — 年齢順 Markdown テーブル生成
- **revision-diff エクスポーター**: `computeUnifiedDiff()` / `formatUnifiedDiff()` — LCS ベースの行単位 unified diff
- **自分大全テンプレート**: `templates/jibun-taizen.md` — 骨格テンプレート
- **DocumentRevision 拡張**: `revisionReason`（必須）/ `targetMemo` / `previousRevisionId` フィールドを追加
- **ADR-0007**: LifeTimelineEntry を Episode と分離する判断を記録
- **年表タブ（desktop）**: `life_timeline_entries` SQLite テーブル（migration 0005）、Tauri CRUD コマンド 5 本、IPC wrapper、Lit UI（フォーム + カード一覧 + インライン 2 ステップ削除確認）
- **DocumentRevision DB 拡張（migration 0006）**: `revision_reason` / `target_memo` / `previous_revision_id` カラムを既存テーブルに追加

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
