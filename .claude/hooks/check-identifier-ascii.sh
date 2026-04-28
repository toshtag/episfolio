#!/usr/bin/env bash
# git でブランチ名・タグ名を作成する際、識別子が ASCII（[A-Za-z0-9._/-]）のみで構成されているか検査する。
#
# 理由：ブランチ名・タグ名は Cargo / pnpm / CI / Docker / shell スクリプト等のツールチェーンに
# 入り込むため、非 ASCII を含むと予期しない問題が起きやすい。
#
# 対象コマンド例：
#   git checkout -b <name>
#   git switch -c <name>
#   git branch <name>
#   git tag <name>
#   git tag -a <name>
#   git push origin <name>  ← 既存ブランチ名は許可（ここではチェックしない）
#
# Bypass: CLAUDE_ALLOW_NON_ASCII_IDENTIFIER=1

set -euo pipefail

if [ "${CLAUDE_ALLOW_NON_ASCII_IDENTIFIER:-0}" = "1" ]; then
  exit 0
fi

if [ "${CLAUDE_TOOL_NAME:-}" != "Bash" ]; then
  exit 0
fi

CMD=$(echo "${CLAUDE_TOOL_INPUT:-}" | python3 -c "
import sys, json
try:
  d = json.load(sys.stdin)
  print(d.get('command', ''))
except Exception:
  print('')
" 2>/dev/null)

if [ -z "$CMD" ]; then
  exit 0
fi

# ブランチ名・タグ名の抽出（簡易パターン）
TARGET=""
KIND=""

if echo "$CMD" | grep -qE "^git checkout -b [^ ]+"; then
  TARGET=$(echo "$CMD" | sed -E 's|^git checkout -b ([^ ]+).*|\1|')
  KIND="branch"
elif echo "$CMD" | grep -qE "^git switch -c [^ ]+"; then
  TARGET=$(echo "$CMD" | sed -E 's|^git switch -c ([^ ]+).*|\1|')
  KIND="branch"
elif echo "$CMD" | grep -qE "^git branch [^- ][^ ]*"; then
  TARGET=$(echo "$CMD" | sed -E 's|^git branch ([^ ]+).*|\1|')
  KIND="branch"
elif echo "$CMD" | grep -qE "^git tag (-[a-z]+ )?[^- ][^ ]*"; then
  TARGET=$(echo "$CMD" | sed -E 's|^git tag (-[a-z]+ )?([^ ]+).*|\2|')
  KIND="tag"
fi

if [ -z "$TARGET" ]; then
  exit 0
fi

# ASCII 英数字 + . _ / - のみ許可
if ! printf '%s' "$TARGET" | LC_ALL=C grep -qE '^[A-Za-z0-9._/-]+$'; then
  cat <<EOF

╔══════════════════════════════════════════════════════════════╗
║  [BLOCKED] 識別子が ASCII 英数字以外を含んでいます。          ║
╚══════════════════════════════════════════════════════════════╝

種別: $KIND
入力: $TARGET

許可される文字: A-Z a-z 0-9 . _ / -

理由: ブランチ名・タグ名はツールチェーン（Cargo, pnpm, CI, Docker, shell）に
入り込むため、非 ASCII を含むと予期しない動作不良が起きやすいです。

ドキュメント・コミットメッセージは日本語可です。識別子だけは ASCII にしてください。

例:
  feat/episode-crud
  fix/sqlite-migration
  v0.1.0-alpha.1

EOF
  exit 2
fi

exit 0
