# Episfolio

> Episode + Portfolio — 業務エピソードと人生レイヤーの素材を蓄積し、根拠あるキャリアドキュメント群に変換するローカルファースト・デスクトップアプリ。

## ステータス

🟢 **v0.11.0 リリース済（2026-05-04）** — `pnpm tauri dev` での開発ビルド動作確認済み。署名済の配布バイナリは未配布（v1.0 で対応予定）。

詳細は [CHANGELOG.md](./CHANGELOG.md) を参照。

## 機能一覧

- 業務エピソードの構造化保存・編集・削除（17 フィールドの STAR 構造）
- スキルエビデンスの手書き作成
- キャリアドキュメントの手動編集と改訂履歴管理
- 人生年表（自分大全）の記録・編集
- 求人連携（JobTarget）+ 職務経歴ダイジェスト
- 面接準備（Q&A 集 / 面接後報告シート）
- エージェント連携（実績表 / 面談メール / 希望条件シート）
- 応募書類拡充（退職理由 + 志望動機 / 上司リファレンス / 顧客リファレンス / 仕事資料のまとめ / 部下まとめシート）
- **志望動機二系統アプローチ**（方程式スタイル / 鋼スタイル切替、同一求人で 2 つの書き方を管理）
- **退職交渉設計**（内定比較表 7 項目 / 退職シーケンス 9 マイルストーン / 藩士意識メモ）
- **強み発掘ワークシート**（StrengthArrow / ResultByType / StrengthFromWeakness / MicrochopSkill）
- **弱いつながり管理**（カテゴリ別 + 連絡状況バッジ）
- **企業分析チェックリスト**（ブラック企業チェック / 採用印象 / 給与分析 / 隠れ優良企業 / 成長サイクル / 認定・認証 / 事業部タイプ相性）
- 完全ローカル動作（外部 LLM 送信なし、ADR-0009）

## ロードマップ

| Phase | 内容                                     |
| ----- | ---------------------------------------- |
| v0.12 | AI 復活（信頼担保 UX 設計 + 面接官対策） |
| v0.13 | 暗号化 at rest（SQLCipher）              |
| v0.14 | Windows / Linux 対応                     |
| v1.0  | 安定版（署名済バイナリ配布）             |

## 技術スタック

| レイヤー        | 技術                              |
| --------------- | --------------------------------- |
| Desktop shell   | Tauri v2                          |
| UI              | Lit (Web Components) + TypeScript |
| Native boundary | Rust（SQLite / OS keychain / FS） |
| Database        | SQLite                            |
| Schema          | Zod                               |
| Build           | Vite + Cargo                      |
| Lint / Format   | Biome                             |
| Test            | Vitest + cargo test               |

公開設計ドキュメントは [docs/adr/](./docs/adr/) を参照。

## 対応プラットフォーム

| OS      | 現在                 | v1.0 |
| ------- | -------------------- | ---- |
| macOS   | ✅（開発ビルドのみ） | ✅   |
| Windows | ❌（v0.9 予定）      | ✅   |
| Linux   | ❌（v0.9 予定）      | ✅   |

## License

[MIT](./LICENSE)

## Contributing

外部 contribution は v1.0 までは受け付けていません。詳細は [CONTRIBUTING.md](./CONTRIBUTING.md)。
