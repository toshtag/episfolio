#!/usr/bin/env bash
# SessionStart で表示するコンテキスト。
# モデルへの指示として「最初に /resume を実行してね」と促す。

set -euo pipefail

cat <<'EOF'
[Episfolio セッション開始]

このプロジェクトは Phase 0（運用整備中）です。

最初のメッセージで `/resume` を実行してください：
- docs/private/progress.md を読み込みます
- docs/private/rejected-ideas.md を読み込みます
- 「次のタスク（Order: 1）」を提示します
- 推奨する Model / Effort / Thinking 設定を提示します

ユーザーは表示された推奨設定に切り替えてからタスクに着手してください。

---
コア原則：
- main ブランチへの直接編集は禁止（hook で機械的にガード）
- コミットメッセージに Claude/Anthropic 痕跡を入れない（hook でガード）
- 識別子（ブランチ名・タグ名・パッケージ名）は ASCII 必須（hook でガード）
- ドキュメント・コミットメッセージは日本語可
EOF
