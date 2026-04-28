# Contributing to Episfolio

Episfolio は現在 Phase 0（運用整備中）です。実装段階に入るまで外部 contribution は受け付けていません。本ドキュメントは将来のために運用ルールを先に定めるものです。

## 言語ポリシー

- **ドキュメント・コミットメッセージ・PR タイトル/本文・コードコメント**：日本語で問題ありません
- **識別子（ツールチェーンに食い込むもの）は ASCII 必須**：

| 種別                          | ルール                  | 例                                                                  |
| ----------------------------- | ----------------------- | ------------------------------------------------------------------- |
| ブランチ名                    | `[A-Za-z0-9._/-]`       | `feat/episode-crud`, `chore/setup-tauri`                            |
| タグ名                        | `[A-Za-z0-9._-]`        | `v0.1.0`, `v0.1.0-alpha.1`                                          |
| `package.json` の `name`      | 英数字 + `-` + scope    | `@episfolio/kernel`, `episfolio-desktop`                            |
| Cargo crate name              | 英数字 + `-` または `_` | `episfolio-app`                                                     |
| DB マイグレーション名         | 英数字 + `_`            | `0001_init.sql`, `0002_add_skill_evidence.sql`                      |
| ファイル名（コード）          | 英数字 + `-` または `_` | `episode-list.ts`, `extract_evidence.rs`                            |
| Tauri command 名              | snake_case              | `create_episode`, `extract_evidence`                                |
| TypeScript 型・Zod スキーマ名 | PascalCase              | `EpisodeSchema`                                                     |
| Conventional Commits の type  | 英語固定                | `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `style` |

理由：ツールチェーン（Cargo、pnpm、CI、Docker、shell スクリプト等）は識別子に非 ASCII が含まれると問題を起こすことがあります。安全側に倒します。

## ブランチ運用

- **`main` ブランチへの直接コミット・直接プッシュは禁止**
- 作業は必ず feature branch で行う：`<type>/<scope>` 形式
  - 例：`feat/episode-crud`, `fix/sqlite-migration`, `docs/update-readme`
- `.claude/hooks/check-main-branch.sh` で機械的にガード

## コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/) に従います。

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

- `type`：英語（`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `style`）
- `scope`：英語（例：`episode`, `evidence`, `document`, `kernel`, `tauri`）
- `subject`：日本語可、簡潔に（命令形が望ましい）

例：

```
feat(episode): エピソード作成 UI を追加

エピソードのタイトル・背景・問題・行動・結果フィールドを
持つフォームを実装。まだバリデーションは未実装。
```

## Pull Request

Phase 0 段階では Solo 開発のため簡易運用：

- self-review でも構わない
- main へ self-merge OK
- ただし PR は必ず作る（履歴と意図を残すため）

Phase 1 以降、外部 contributor を受け入れる際にレビュー要件を再定義します。

## 開発環境

実装段階に入った後で更新します（pnpm のバージョン、Rust toolchain、Tauri 依存等）。

## 質問・問題報告

- バグ報告：GitHub Issues
- セキュリティ問題：[SECURITY.md](./SECURITY.md)（Phase 1 で公開予定）— public issue ではなく private 窓口へ
