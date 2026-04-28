---
name: resume
description: Episfolio プロジェクトの作業を新しいチャットセッションで再開する。docs/private/progress.md を起点に、現状把握・次タスク提示・推奨 Model/Effort/Thinking 設定を行う。
---

# resume

## 目的

新しいチャットセッションでも、過去の判断・棄却済みアイデア・現在の Phase を踏まえ、**何のタスクをどの設定（Model / Effort / Thinking）で着手すべきか**を即座に提示する。

ユーザーが毎回方針を説明する必要をなくす「プロジェクト記憶の外部化装置」。

## 実行手順

### 1. 必須読み込み（毎回）

以下を Read で必ず読む：

1. `docs/private/progress.md` — 現状サマリー、次のタスク、ブロッカー
2. `docs/private/rejected-ideas.md` — 棄却済みアイデアの理由（再提案応答用）

**ヒント**：これら 2 ファイルは軽量なので毎回読んで構わない。

### 2. 条件付き読み込み

ユーザーの問いに応じて遅延読み込み：

| 問い | 追加で読むファイル |
|---|---|
| 「Phase 全体を見たい」「ロードマップは？」 | `docs/private/roadmap.md` |
| 「あの判断の根拠は？」「過去どう決めた？」 | `docs/private/decisions-log.md` |
| 「設計の詳細は？」 | `docs/private/architecture.md` |
| 「過去の PR の経緯は？」 | `docs/private/progress-history.md`（存在すれば） |

最初から全部読まないこと。

### 3. 実態の確認

```bash
git status
git log --oneline -5
git branch --show-current
```

ブランチ・直近コミット・未コミット変更を把握する。

### 4. ズレ検知（progress.md vs Git）

`progress.md` の `Last updated` フィールドと最新コミットの日付を比較：

```bash
grep -A1 '^## Last updated' docs/private/progress.md | tail -1
git log -1 --format='%ci'
```

以下の場合は警告を出す：
- progress.md の日付が最新コミットより 2 日以上古い → 「progress.md 未更新の可能性」
- 最新コミットが progress.md に記載されていない変更を含む → 「このセッションで更新が必要かも」
- 未コミットの変更がある → 「前セッションで作業途中だった可能性」

### 5. 次タスクの 4 要素 + 着手者 + 推奨設定の機械検証

`progress.md` の「Order: 1」のタスクが以下を全て満たすか機械検証する：

- [ ] **Why**（1〜2 行）
- [ ] **Scope**（含む / 含まない）
- [ ] **Done when**（機械的判定可能な完了条件）
- [ ] **Order** に番号
- [ ] **着手者**（Opus / Sonnet / Haiku / ユーザー）
- [ ] **推奨設定**（Model / Effort / Thinking の 3 点セット）

いずれか欠けていれば、着手せずユーザーに以下を返す：

> 「Order: 1 のタスク『XXX』は YYY 要素が欠けているため、現在の設定では実行できません。Opus に切り替えてタスクを分解してから再開してください。」

### 6. 次タスクの提示

検証が通ったら、以下のフォーマットで提示する：

```
## 現在の Phase
Phase X — <名称>

## 直前の完了
- <タスク名> (<日付>)
- ...

## 次のタスク（Order: 1）
タイトル: <タスク名>
- Why: <1-2 行>
- Scope:
  - 含む: ...
  - 含まない: ...
- Done when:
  - <機械的判定可能な条件>
- 着手者: <Opus / Sonnet / Haiku / ユーザー>
- 推奨設定:
  - Model: <例：Opus 4.7 / Sonnet 4.6 / Haiku 4.5>
  - Effort: <low / medium / high>
  - Thinking: <on / off>
  - 理由: <なぜその組み合わせか>

（推奨設定に切り替えてから着手してください）
```

### 7. ユーザーへの確認（最小限）

以下の場合のみ確認する：

- 4 要素／推奨設定が欠けている → タスク分解を要求
- progress.md と git log にズレ → 「最新コミットが反映されていない可能性」を指摘
- 着手者が「ユーザー」のタスク → 「ユーザー側で進めてください」

**禁止**：「どのタスクから始めますか？」と聞くこと。Order: 1 が決まっているのでそのまま提示する。

ユーザーが新タスクを依頼してきた場合のみ、既存計画への割り込み可否を確認する。

## Model / Effort / Thinking のガイドライン

### Model 選択の原則

| Model | 適性 | 例 |
|---|---|---|
| **Opus 4.7** | 不可逆な選択・初回設計・難しい debug | Tauri scaffold、データモデル設計、深いリファクタリング |
| **Sonnet 4.6** | パターン適用・ある程度判断ある実装 | CRUD 実装、コンポーネント追加、テスト追加、バグ修正 |
| **Haiku 4.5** | パターン明確・繰り返し作業 | フォーマット修正、ドキュメント更新、軽微な変更 |

### Effort 選択

| Effort | 適性 |
|---|---|
| low | 確実・小さい変更 |
| medium | 通常の実装タスク |
| high | 設計判断を含む、複数ファイル横断 |

### Thinking on/off

| Thinking | 適性 |
|---|---|
| on | アーキテクチャ判断、不可逆な選択、複雑な debug |
| off | パターン適用、ルーチン実装 |

### 組み合わせの目安

- **新機能の初回設計**：Opus + high + thinking on
- **既存パターンに倣った CRUD**：Sonnet + medium + thinking off
- **タイポ修正・ドキュメント整備**：Haiku + low + thinking off
- **難しいバグ調査**：Opus + medium + thinking on

## コア原則（progress.md の「絶対に守ること」と同期）

- Local-first（センシティブデータの安全性が最優先）
- AI は候補生成、人間が採用/修正/却下
- main 直編集禁止
- コミット/PR/コードに Claude/Anthropic 痕跡を残さない
- 識別子は ASCII（ブランチ名・タグ名・パッケージ名・migration 名）
- ドキュメント・コミットメッセージは日本語可

## 判断に迷ったら

`docs/private/rejected-ideas.md` を見る。再提案された場合、棄却理由を示して再議論を避ける。

新しい状況で棄却判断を変えるべきと判断した場合は、`rejected-ideas.md` の該当エントリに「再評価」として追記する。

## タスク完了時の儀式

タスク完了直後（`/ship` 後など）、以下を行う：

1. `docs/private/progress.md` の以下を更新：
   - `## Last updated` を今日の日付に
   - `## 直近の完了` に今日の成果を 1 行追加
   - `## 次のタスク` から完了分を削除（Order を繰り上げる）
2. 重要な意思決定があった場合のみ `docs/private/decisions-log.md` に追記
3. `docs/private/` は `.gitignore` 対象なのでコミット不要
4. ユーザーに進捗更新を報告（「progress.md を更新しました」）

## 中断条件

以下の場合は中断してユーザーに相談：

- `docs/private/progress.md` が存在しない（初回セットアップ前？）
- git log と progress.md が大きく乖離している
- 現在の Phase が完了している（次の Phase の計画が必要）
