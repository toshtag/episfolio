# ADR-0006: Tauri bundle identifier を `io.github.toshtag.episfolio` とする

- **Status**: Accepted
- **Date**: 2026-04-28

## Context

Tauri はアプリのバンドル識別子（bundle identifier）を `tauri.conf.json` の `identifier` フィールドで一意に定義する必要がある。この値は macOS の署名・notarization・アプリデータストレージパスに使用され、一度リリース後に変更するとデータ移行が必要になる。

## Decision

**`io.github.toshtag.episfolio`** を bundle identifier として採用する。

GitHub ユーザー名（`toshtag`）をリバースドメイン形式に変換した値であり、独自ドメインを保持せずに一意性を保証できる。

## Consequences

- GitHub アカウントに紐づくため、独自ドメイン取得なしに一意性を確保できる
- macOS の署名・notarization および Tauri が生成するデータストレージパスに使用される
- 将来ドメインを取得した場合でも、バイナリ互換性のためにこの値を変更するコストは高い

## Alternatives Considered

- **独自ドメインベース（例: `app.episfolio.io`）**: ドメイン取得が前提となり、MVP 段階では過剰
- **`com.episfolio.app` などの未保有ドメイン**: 所有していないドメインを使用すると将来の名前衝突リスクがある
