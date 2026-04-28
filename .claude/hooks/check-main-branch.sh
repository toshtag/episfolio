#!/usr/bin/env bash
# main / master ブランチへの直接編集・コミット・プッシュをブロックする。
#
# 適用範囲：
# - PreToolUse: Edit / Write — ファイル編集を全てブロック
# - PreToolUse: Bash — git の書き込み系コマンド（commit / push / add / merge / rebase / reset / rm / mv）をブロック
#
# 例外：
# - main 上でも read-only な git コマンド（status / log / diff / branch / checkout 等）は許可
# - ユーザーの手動操作にはこのフックは作用しない（CLAUDE_TOOL_NAME が設定されていない場合スキップ）
#
# Bypass: 環境変数 CLAUDE_ALLOW_MAIN_EDIT=1 を設定すると一時的に許可（初期セットアップ等）

set -euo pipefail

# 一時バイパス
if [ "${CLAUDE_ALLOW_MAIN_EDIT:-0}" = "1" ]; then
  exit 0
fi

BRANCH=$(git -C "$PWD" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
  exit 0
fi

# Bash の場合は書き込み系コマンドのみブロック
if [ -n "${CLAUDE_TOOL_NAME:-}" ] && [ "$CLAUDE_TOOL_NAME" = "Bash" ]; then
  CMD=$(echo "${CLAUDE_TOOL_INPUT:-}" | python3 -c "
import sys, json
try:
  d = json.load(sys.stdin)
  print(d.get('command', ''))
except Exception:
  print('')
" 2>/dev/null)
  if ! echo "$CMD" | grep -qE "^git (commit|push|add|merge|rebase|reset|rm|mv)\\b"; then
    exit 0
  fi
fi

TARGET=$(echo "${CLAUDE_TOOL_INPUT:-}" | python3 -c "
import sys, json
try:
  d = json.load(sys.stdin)
  print(d.get('file_path', '') or d.get('command', ''))
except Exception:
  print('')
" 2>/dev/null)

cat <<'EOF'

╔══════════════════════════════════════════════════════════════╗
║  [BLOCKED] main ブランチへの直接編集は禁止です。              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo ""
echo "Target: $TARGET"
echo ""
echo "次のステップ："
echo "  git checkout -b <type>/<scope>"
echo ""
echo "  type: feat / fix / chore / docs / refactor / test / perf / style"
echo "  例:   git checkout -b feat/episode-crud"
echo ""
echo "（初期セットアップで一時的に許可したい場合は CLAUDE_ALLOW_MAIN_EDIT=1）"
echo ""
exit 2
