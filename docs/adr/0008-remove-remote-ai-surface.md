# ADR-0008: 現行ビルドから remote AI 送信 surface を削除する

- **Status**: Accepted
- **Date**: 2026-05-01

## Context

Episfolio は転職活動に関する機微な個人データを扱うローカルファースト・デスクトップアプリである。
初期実装では AI 関連の Tauri command と API key 管理の導線が存在していたが、UI から非表示にするだけでは WebView から command を直接呼び出せるため、権限境界として不十分だった。

また、外部 LLM 送信は「ユーザーが何を送るかを理解し、明示的に承認できる UX」が完成してから提供すべきであり、単純な同意チェックボックスではローカルファーストの信頼を担保できない。

## Decision

現行ビルドでは、remote AI 送信に関わる Tauri command、API key 取得 command、frontend IPC wrapper、Rust 側 HTTP/keychain adapter を提供しない。

AI 関連の純粋な kernel 型・port・usecase・prompt は、将来の再設計に備えて残す。ただし desktop shell から外部 LLM へ送信する runtime surface は持たない。

## Consequences

- 現行 desktop build は外部 LLM へデータを送信しない
- API key を frontend へ返す command surface が存在しない
- AI 復活時は、送信前プレビュー、送信対象の最小化、ローカル LLM 選択肢、remote provider の明示承認を先に設計する必要がある
- kernel に AI 抽象は残るため、将来の AI 機能は kernel usecase を canonical として再接続できる

## Alternatives Considered

- **UI hide のみ**: Tauri command は直接 invoke 可能なため不十分
- **feature gate で default off**: cfg 分岐が広がり、default build に何が含まれるかの検証が複雑になる
- **API key command だけを残す**: secret を frontend に返す経路を残すため不採用
