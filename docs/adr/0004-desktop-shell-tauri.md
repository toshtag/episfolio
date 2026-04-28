# ADR-0004: デスクトップシェルに Tauri v2 を採用する

- **Status**: Accepted
- **Date**: 2026-04-28

## Context

ローカルファースト設計のデスクトップアプリとして、Web 技術（TypeScript + Lit）で構築した UI をネイティブアプリとしてパッケージングするシェルが必要だった。ローカルの SQLite・ファイルシステム・キーチェーンへのアクセスも Rust 側で実装する想定。

## Decision

**Tauri v2** を採用する。

Rust バックエンドが SQLite・ファイルシステム・キーチェーン・HTTP クライアントを担い、フロントエンド（TypeScript）とは Tauri command 経由で通信する。

## Consequences

- バイナリサイズが小さい（Chromium を同梱しないため）
- OS のネイティブ WebView を使用するため、macOS は WebKit ベースとなる
- ビジネスロジックの多くを Rust で実装する必要があり、Rust の習熟が前提
- セキュリティモデルが明確（capabilities による権限制御）

## Alternatives Considered

- **Electron**: Node.js ランタイムと Chromium を同梱するため、バイナリサイズが大きくなる。Rust の優位性（メモリ安全・ネイティブ統合）も活かせない
- **Node.js sidecar 追加**: SQLite・ファイルシステム・HTTP は Rust で対応できるため、Node.js sidecar を組み込むメリットがない。バイナリサイズ・起動コスト・複雑度が増すのみ
