# ADR-0005: モノレポ構成に pnpm workspaces を採用する

- **Status**: Accepted
- **Date**: 2026-04-28

## Context

`@episfolio/kernel`（ビジネスロジック・純粋 TypeScript）と `@episfolio/desktop`（Tauri フロントエンド・Lit UI）を同一リポジトリで管理する。両パッケージはローカル参照しつつ、kernel は将来的に独立して公開・利用できる形を保ちたい。

## Decision

**pnpm workspaces** でモノレポを構成する。パッケージ構成は以下の通り：

| パッケージ | ディレクトリ | 役割 |
|---|---|---|
| `@episfolio/kernel` | `packages/kernel/` | ビジネスロジック・ドメインモデル（I/O なし） |
| `@episfolio/desktop` | `packages/desktop/` | Tauri フロントエンド・Lit UI |

## Consequences

- kernel が Lit・Tauri を一切知らない構造を強制できる
- パッケージ間の依存はワークスペースプロトコル（`workspace:*`）で解決され、ローカル開発が容易
- pnpm の厳格なホイスティングにより、暗黙的な依存解決を防ぎやすい

## Alternatives Considered

- **npm workspaces**: 利用可能だが、pnpm のストレージ効率・厳格なホイスティングの優位性を捨てる理由がない
- **Yarn workspaces (Berry)**: プラグインアーキテクチャの複雑さが MVP 段階では不要
- **完全分離 repo**: ローカル開発で依存リンクの管理が煩雑になる
