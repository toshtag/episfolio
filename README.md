# Episfolio

> Episode + Portfolio — 業務エピソードを蓄積し、根拠あるキャリアドキュメント（職務経歴書・自己PR等）に変換するローカルファースト・デスクトップアプリ。

## ステータス

🚧 **Phase 0（運用整備中）** — 実装はまだ開始していません。

このリポジトリは現在、開発に入る前の運用基盤を整備している段階です。バイナリ配布・機能利用はまだできません。

## 何をするツールか

転職活動において、自分の経験・実績・強み・セールスポイントを整理し、職務経歴書や自己PRなどのドキュメント生成に活用します。

主な機能（実装予定）：

- 業務エピソードを構造化フォーマットで蓄積
- AI による強み候補の抽出（人間が採用・修正・却下）
- 職務経歴書・自己PR・志望動機・面接想定問答などのドキュメント生成
- 求人・企業ごとの書類カスタマイズ
- 生成物のバージョン管理（DocumentRevision）
- Markdown / JSON エクスポート

## 設計方針

- **ローカルファースト**：データはあなたの端末に留まる（AI 推論時の明示的な送信を除く）
- **AI は候補生成役、人間が判断**：AI 出力は常に candidate として扱い、採用/修正/却下する
- **データのポータビリティ**：Markdown / JSON でいつでもエクスポート・インポート
- **長期保守性 > 短期開発速度**：派手な技術より長寿命な選択肢
- **完全 OSS（MIT License）**

## 技術スタック（予定）

| レイヤー | 技術 |
|---|---|
| Desktop shell | Tauri v2 |
| UI | Lit (Web Components) + TypeScript |
| Native boundary | Rust（SQLite / OS keychain / FS / HTTP のみ） |
| Database | SQLite（FTS5 + JSON1） |
| Schema | Zod |
| AI | OpenAI API（将来：Ollama 等の OpenAI 互換 API） |
| Build | Vite + Cargo |
| Lint | Biome |
| Test | Vitest + cargo test |

詳細は今後 [docs/architecture.md](./docs/architecture.md)（Phase 1 で公開）に記載予定。

## 対応プラットフォーム

| OS | v0.1 | v1.0 |
|---|---|---|
| macOS | ✅（署名 + notarize） | ✅ |
| Windows | ❌ | ✅ |
| Linux | ❌ | ✅ |

v0.1 は macOS のみリリース予定。Windows / Linux は v0.8 以降。

## License

[MIT](./LICENSE)

## Contributing

実装段階に入るまで外部 contribution は受け付けていません。詳細は [CONTRIBUTING.md](./CONTRIBUTING.md)。
