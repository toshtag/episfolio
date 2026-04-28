#!/usr/bin/env bash
# git commit 直後にコミットメッセージから Claude / Anthropic 由来の痕跡を検査する。
#
# 検出対象（case-sensitive、誤検知回避のため）：
# - "Claude" / "Anthropic"（先頭大文字。自己言及は通常大文字始まり）
# - "Co-Authored-By:" / "Co-authored-by:" （AI 生成 trailer 全般を排除）
# - "Generated with" （ロボット署名フレーズ）
# - "🤖" 自動生成ロボット絵文字
#
# 検出時は exit 2 でブロック（PostToolUse で stderr を返すと AI に再修正を促せる）。
#
# 注：".claude/" のような小文字パスは検出しない（ディレクトリ名として使うのは正当）。

set -euo pipefail

# Bash 以外はスキップ
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

# git commit を含むコマンドのみ対象
if ! echo "$CMD" | grep -qE "(^|[[:space:]&;|])git commit\\b"; then
  exit 0
fi

# 直近のコミットメッセージを検査
MSG=$(git log -1 --format='%B' 2>/dev/null || echo "")

if [ -z "$MSG" ]; then
  exit 0
fi

FORBIDDEN=$(echo "$MSG" | grep -E '(Claude|Anthropic|Co-Authored-By:|Co-authored-by:|Generated with|🤖)' || true)

if [ -n "$FORBIDDEN" ]; then
  cat <<'EOF'

╔══════════════════════════════════════════════════════════════╗
║  [BLOCKED] コミットメッセージに禁止文字列が含まれています。   ║
╚══════════════════════════════════════════════════════════════╝
EOF
  echo ""
  echo "検出された行："
  echo "$FORBIDDEN"
  echo ""
  echo "対処："
  echo "  1. git commit --amend を使ってメッセージを修正する（push 前なら可）"
  echo "  2. または git reset --soft HEAD~1 して再コミット"
  echo ""
  echo "Episfolio では Claude / Anthropic の自動生成痕跡を残しません。"
  echo "Co-Authored-By タグも禁止です（AI 生成全般を排除する方針）。"
  echo ""
  exit 2
fi

exit 0
