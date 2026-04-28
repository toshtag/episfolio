---
name: ship
description: 作業ブランチの変更を main に取り込む。前提確認 → push → テスト → PR 作成 → self-merge → 後処理 → progress.md 更新を一気通貫で実行する。
---

# ship

## 目的

feature ブランチでの作業成果を、安全に main に取り込む。Phase 0 段階は Solo 開発のため簡易フローで運用し、外部 contributor を受け入れる Phase 以降に厳格化する。

## 前提

- 現在のブランチは feature ブランチ（`<type>/<scope>` 形式）
- 既に必要な commit は積まれている（ship 内では新規 commit を作らない）
- 未コミットの変更が残っていない

## 実行手順

### 1. 前提確認

```bash
git status
git branch --show-current
git log origin/main..HEAD --oneline
```

以下の場合は **拒否してユーザーに報告し中断**：

- main / master ブランチ上にいる → `git checkout -b <type>/<scope>` してから再度 ship
- 未コミットの変更がある → ship 内では commit しない。実装フェーズが終わっていないサインなので、ユーザーに整理を依頼
- ブランチに commit が 1 つもない → push する内容がない

### 2. push

```bash
git push -u origin <current-branch>
```

### 3. テスト実行

変更内容に応じて自律的に実施する。Phase 0 段階ではテストがまだないため：

- 後の Phase で追加：`pnpm test`、`cargo test`、`pnpm lint`、`pnpm build`、`pnpm tauri build`

存在しないテストは「該当なし」として扱う。

### 4. PR 作成

```bash
gh pr create \
  --title "<type>(<scope>): <subject>" \
  --body "$(cat <<'EOF'
## 概要

<日本語で 1-3 行>

## 変更内容

- <変更点 1>
- <変更点 2>

## テスト

- [ ] 該当するテスト実行（コマンドと結果を記載）
- [ ] 動作確認（手動）

## 関連 Issue / 参照

- (もしあれば)
EOF
)"
```

PR タイトルは Conventional Commits 形式で、subject は日本語可。

### 5. CI 通過確認（Phase 1 以降）

```bash
gh pr checks --watch
```

Phase 0 では CI 未整備のためスキップ可。

### 6. self-merge

Solo 開発期間中は self-merge OK。

```bash
gh pr merge --squash --delete-branch
```

squash 推奨（feature branch 内の細かい commit を 1 つに）。

### 7. ローカル後処理

```bash
git checkout main
git pull origin main
# ローカル feature branch は --delete-branch で消えているはず、念のため
git branch -d <feature-branch> 2>/dev/null || true
```

### 8. progress.md 更新

`docs/private/progress.md` を編集：
- `## Last updated` を今日の日付に
- `## 直近の完了` に今日のタスクを 1 行追加
- `## 次のタスク` から完了分を削除し、Order を繰り上げ

重要な判断があった場合のみ `docs/private/decisions-log.md` に追記（ADR 形式）。

`docs/private/` は `.gitignore` 対象のため、これらの更新はコミット不要。

### 9. 報告

ユーザーに以下を簡潔に報告：

```
✅ ship 完了
- PR: #<番号>
- merge commit: <SHA>
- progress.md 更新済み

次のタスク: Order: 1 — <次タスク名>（推奨: Sonnet 4.6, medium, thinking off）
```

## 拒否される条件まとめ

| 条件 | 対処 |
|---|---|
| main ブランチ上 | feature branch を切る |
| 未コミット変更あり | コミットを整理してから再実行 |
| commit 数 = 0 | 何かを実装してから |
| Claude/Anthropic 痕跡（hook が検出） | コミットメッセージを修正 |

## Phase 1 以降の追加チェック（将来）

- `check-pr-not-monolithic.sh`：1 PR が大きすぎないか（commit 分割を促す）
- `check-pr-needs-test-coverage.sh`：実装に対応するテストが追加されているか
- `check-commit-granularity.sh`：1 commit が大きすぎないか
- `check-incremental-commit.sh`：レイヤー横断する変更を 1 commit で済ませていないか

これらは外部 contributor を受け入れる時点で導入する。
