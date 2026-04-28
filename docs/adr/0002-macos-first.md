# ADR-0002: v0.1 のターゲット OS は macOS のみとする

- **Status**: Accepted
- **Date**: 2026-04-28

## Context

Tauri はクロスプラットフォームビルドをサポートするが、各 OS ごとにコード署名・配布フロー・動作検証が異なる。MVP の段階で複数 OS を同時にサポートすると、OS 固有の問題対応が開発の主軸を圧迫するリスクがある。

## Decision

**v0.1 のターゲット OS は macOS のみ**とする。Windows・Linux 対応は v0.8 以降で着手する。

## Consequences

- MVP の開発範囲が明確になり、コア機能の実装に集中できる
- コード署名は Apple Developer Program のみで対応できる
- v0.8 まで macOS 以外のユーザーはセルフビルドが必要になる
- README に対象プラットフォームを明記する

## Alternatives Considered

- **macOS + Windows + Linux を同時対応**: 各 OS の署名フロー・CI 設定・動作検証が重複し、MVP の範囲を大幅に超える
- **Linux のみ**: 開発者向けには適しているが、想定ユーザー層と合わない
