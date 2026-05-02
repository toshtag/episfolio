# Changelog

Keep a Changelog 形式（https://keepachangelog.com/ja/1.1.0/）
バージョニングは Semantic Versioning（https://semver.org/lang/ja/）に従う。

## [Unreleased]

---

## [0.6.0] - 2026-05-02

応募書類拡充パックを追加した機能リリース。退職理由 + 志望動機ペア / 上司リファレンス / 顧客リファレンス / 仕事資料のまとめ / 部下まとめシート の 5 機能が end-to-end で動作する。これにより応募書類向けの「プラスアルファ書類」群（職務経歴ダイジェスト・自分大全・上司リファレンス・顧客リファレンス・仕事資料のまとめ・部下まとめシート）が UI レベルで完結した。AI 機能は引き続き不在（次フェーズで復活予定）。

### Added
- **ResignationMotive / ApplicationMotive ドメイン**（kernel）: 退職理由（本音）と志望動機（建前）をペアで構造化する 2 ドメイン型・Zod schema・StoragePort。`composeApplicationMotiveText` ヘルパで定型 4 段落の建前テキストを純関数生成
- **BossReference ドメイン**（kernel）: 上司リファレンスの型・Zod schema・StoragePort・Markdown exporter。8 軸スコアリング（`axisValues`）+ 11 個の固定質問（q1〜q11）+ `strengthEpisode` を構造化保存
- **CustomerReference ドメイン**（kernel）: 顧客リファレンスの型・Zod schema・StoragePort・Markdown exporter。`customerType`（b2b/b2c）で属性質問セットを切替、クレーム経験 3 項目 + 強み・間接転換 2 項目を保存。Markdown は customerType に応じて BtoB/BtoC 属性の片側のみ出力
- **WorkAssetSummary ドメイン**（kernel）: 仕事資料のまとめの型・Zod schema・StoragePort・Markdown exporter。AssetType 列挙（提案書 / ソースコード / スライド / 議事録 / 週次報告 / 比較表 / 文書 / その他 の 8 種）+ `summary` / `strengthEpisode` / `talkingPoints` / `maskingNote` を保存
- **SubordinateSummary ドメイン**（kernel）: 部下まとめシートの型・Zod schema・StoragePort・Markdown exporter。1 シート = 複数部下の構造（`subordinates: SubordinateRow[]`）、各部下行に強み / 実績 / 役割性格 / 課題 / 指導 / 変化 / 将来仕事 を保存。Markdown exporter に `maskNames` オプションを搭載（個人名を「部下 N」に置換）
- **退職理由 + 志望動機 UI**（desktop）: migration `0016_add_resignation_application_motives.sql`、Rust CRUD 11 コマンド、`application-motive-view.ts`（本音警告バッジ + 建前フォーマットプレビュー）
- **上司リファレンス UI**（desktop）: migration `0017_add_boss_references.sql`、Rust CRUD 5 コマンド、`boss-reference-view.ts`（8 軸スライダー + 11 質問フォーム + 強みエピソード）
- **顧客リファレンス UI**（desktop）: migration `0018_add_customer_references.sql`、Rust CRUD 5 コマンド、`customer-reference-view.ts`（BtoB/BtoC ラジオ切替 + 属性フォーム + クレーム経験 + 強みエピソード + 転換アイデア + Markdown プレビュー）
- **仕事資料のまとめ UI**（desktop）: migration `0019_add_work_asset_summaries.sql`、Rust CRUD 5 コマンド、`work-asset-summary-view.ts`（資料種別 select + 各テキスト欄 + Markdown プレビュー + 2 ステップ削除）
- **部下まとめシート UI**（desktop）: migration `0020_add_subordinate_summaries.sql`、Rust CRUD 5 コマンド、`subordinate-summary-view.ts`（部下行の add / edit / delete / 並び替え + Markdown プレビュー + 名前伏字 ON/OFF トグル + 2 ステップ削除）
- **kernel テスト**: 388 → 648 件（v0.6 で +260 件: ResignationMotive / ApplicationMotive / BossReference / CustomerReference / WorkAssetSummary / SubordinateSummary の schema・port・exporter）
- **Rust 統合テスト**: 36 → 51 件（migration 0016〜0020 smoke / CHECK 制約 / nullable / JSON payload 保存）

### Changed
- 全パッケージの version を 0.6.0 に揃える（v0.5 は AI 復活フェーズとして欠番）

### Notes
- v0.6 は完全ローカル動作のまま（外部送信 surface は v0.2.1 で物理削除済、ADR-0009）
- 各 UI の UX 細部改善は v0.6.x で対応予定
- v0.5 のバージョン番号は AI 機能復活フェーズに予約済（信頼担保 UX 設計が完成してから着手、ADR-0007）

---

## [0.4.0] - 2026-05-02

面接準備資料 + エージェント連携書類テンプレ集を追加した機能リリース。面接の赤本（QA 集）・面接後報告シート・エージェント実績表・面談メール・求人希望条件シートが end-to-end で動作する。AI 機能は引き続き不在（v0.5 で復活予定）。

### Added
- **InterviewQA ドメイン**（kernel）: 面接 Q&A を求人単位で構造化する型・Zod schema・StoragePort。`question` / `answer` / `category` / `source` / `confidence` フィールド、求人単位での並び替え（`displayOrder`）対応
- **InterviewReport ドメイン**（kernel）: 面接後報告シートの型・Zod schema・StoragePort。`overallEvaluation` / `selfEvaluation` / `nextActions` 等の構造化フィールド
- **AgentTrackRecord ドメイン**（kernel）: エージェント実績表の型・Zod schema・StoragePort。エージェント名・担当者・連絡先・評価・メモを構造化保存
- **AgentMeetingEmail ドメイン**（kernel）: エージェントとの面談メールの型・Zod schema・StoragePort。`emailType` / `subject` / `body` / `sentAt` フィールド、AgentTrackRecord への FK
- **JobWishSheet ドメイン**（kernel）: 求人希望条件シートの型・Zod schema・StoragePort・Markdown exporter（`toJobWishSheetMarkdown`）。A/B/C グループ別企業リスト（`JobWishCompany[]`）を構造化保存
- **InterviewQA CRUD + 面接の赤本 UI**（desktop）: migration `0011_interview_qas.sql`（`job_targets` FK CASCADE + `display_order` index）、5 Tauri command、`interview-qa-view.ts`（求人ドロップダウン + QA カード + 並び替え）
- **InterviewReport CRUD + 面接後報告 UI**（desktop）: migration `0012_interview_reports.sql`、5 Tauri command、`interview-report-view.ts`（求人別フォーム + 一覧）
- **AgentTrackRecord CRUD + エージェントタブ UI**（desktop）: migration `0013_agent_track_records.sql`、5 Tauri command、`agent-track-record-view.ts`
- **AgentMeetingEmail CRUD + 面談メール UI**（desktop）: migration `0014_agent_meeting_emails.sql`（`agent_track_records` FK CASCADE + index）、6 Tauri command（エージェント別 list 含む）、`agent-meeting-email-view.ts`（エージェント別フィルタリング）
- **JobWishSheet CRUD + 希望シート UI**（desktop）: migration `0015_add_job_wish_sheets.sql`（`agent_track_records` FK `ON DELETE SET NULL` + index）、5 Tauri command、`job-wish-sheet-view.ts`（A/B/C グループ別企業リスト編集 + Markdown プレビュー + クリップボードコピー）
- **kernel テスト**: 303 → 388 件（InterviewQA / InterviewReport / AgentTrackRecord / AgentMeetingEmail / JobWishSheet の schema・port・exporter）
- **Rust 統合テスト**: 28 → 36 件（migration 0011〜0015 smoke / FK CASCADE / ON DELETE SET NULL）

### Changed
- 全パッケージの version を 0.4.0 に揃える

### Notes
- v0.4 は完全ローカル動作のまま（外部送信 surface は v0.2.1 で物理削除済、ADR-0009）
- 各 UI の UX 細部改善は v0.4.x で対応予定

---

## [0.3.0] - 2026-05-01

JobTarget（求人連携）+ 職務経歴ダイジェスト（必須要件 × Episode マッピング）を追加した機能リリース。求人ごとの必須要件を Episode と紐付けてダイジェスト Markdown を出力するワークフローが end-to-end で動作する。AI 機能は引き続き不在（v0.5 で復活予定）。

### Added
- **JobTarget ドメイン**（kernel）: 求人ターゲットを構造化する型・Zod schema・StoragePort を新設。`requiredSkills` / `preferredSkills` を文字列配列ではなく構造化配列（`{ name, weight }`）で保存
- **CareerDocument の用途タイプ化**（kernel）: `documentType` / `jobTargetId` フィールドを後方互換で追加。求人別に Document を紐付けられるように
- **JobRequirementMapping ドメイン**（kernel）: 必須要件 × Episode の紐付けを表現するドメイン型・Zod schema・StoragePort・契約テスト 13 件
- **職務経歴ダイジェスト exporter**（kernel）: 必須要件 × Episode マッピングを純関数で Markdown 化する `toCareerDigestMarkdown`（11 件のテストで挙動を固定）。`templates/career-digest.md` を追加
- **DocumentRevision に jobTargetId を追加**（kernel）: 改訂単位で求人を切り替えられるよう、CareerDocument 側 `jobTargetId` と独立した両軸で運用。`targetMemo` は併存維持し、schema は nullable + default null で既存 row を後方互換受理
- **JobTarget CRUD + 求人タブ UI**（desktop）: migration `0008_job_targets.sql`（`status` CHECK 制約付き）、create/list/get/update/delete の 5 Tauri command、`ipc/job-targets.ts` + `job-target-view.ts` で動的 SkillItem 配列 UI
- **JobRequirementMapping IPC + マッピング UI**（desktop）: migration `0009_job_requirement_mappings.sql`（`job_targets` への FK CASCADE + index）、save (upsert) / listByJobTarget / get / update / delete の 5 Tauri command、`digest-view.ts` で求人 dropdown + 要件カード（userNote + Episode multi-select）+ リアルタイム Markdown プレビュー + クリップボードコピー
- **DocumentRevision に job_target_id 列を追加**（desktop）: migration `0010_document_revisions_job_target.sql`、Tauri command と IPC 型を拡張、Document 新規/改訂フォームに JobTarget 選択 dropdown、改訂履歴に「対象求人: 会社名 — 職種」表示、削除済み求人参照は「削除済み (xxxxxx)」表示
- **kernel schema test**: 173 → 213 件
- **Rust 統合テスト**: 20 → 28 件（migration 0009/0010 の smoke / FK CASCADE / orphan / job_target_id NULL/ULID 受理）

### Changed
- `CareerDocument` は `documentType` を持ち、`jobTargetId` は CareerDocument と DocumentRevision の両軸で保持（用途別 Document と求人別 Revision を独立に運用）
- `generate-document` usecase 2 箇所を `jobTargetId` 受け渡し対応に更新
- 全パッケージの version を 0.3.0 に揃える

### Notes
- v0.3 は完全ローカル動作のまま（外部送信 surface は v0.2.1 で物理削除済、ADR-0009）
- ダイジェスト UI の情報密度は v0.3.x で UX 整理予定（実機検証フィードバック）

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
