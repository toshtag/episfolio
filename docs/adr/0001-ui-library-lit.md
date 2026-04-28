# ADR-0001: UI ライブラリに Lit (Web Components) を採用する

- **Status**: Accepted
- **Date**: 2026-04-28

## Context

デスクトップアプリの UI 層に採用するライブラリを選定する必要があった。Episode・Evidence・Document・Revision・AIRun といった複数エンティティのフォーム、一覧、差分表示、候補インライン編集、ストリーミング表示を実装する予定であり、UI の複雑性はある程度高い。

要件として「特定フレームワークへの強い依存を避け、Web 標準に近い実装にする」が明示されていた。

## Decision

**Lit (Web Components)** を採用する。

## Consequences

- W3C 標準の Web Components ベースのため、フレームワーク lock-in が最小
- ランタイムが軽量（〜7KB）
- ビジネスロジックを持つ `@episfolio/kernel` パッケージは Lit を一切知らず、UI 層は将来差し替え可能
- エコシステムは React より小さく、複雑な状態管理は別途 signals 系を検討する場合がある

## Alternatives Considered

- **Vanilla TypeScript**: Episode CRUD 程度なら十分だが、差分表示・候補インライン編集・ストリーミング表示が加わると状態管理の再発明が必要になる
- **Solid.js**: 高速で JSX を利用できるが、Web 標準ではなく独自の reactive scope を持つ
- **React**: 採用実績が最大だが、要件の「特定フレームワークへの強い依存を避ける」と相反する
- **Svelte**: コンパイラ独自の構文を持ち、エコシステムが限定的
