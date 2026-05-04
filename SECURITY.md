# セキュリティポリシー

## サポートバージョン

現在セキュリティ修正の対象となるバージョン：

| バージョン | サポート状況 |
| --- | --- |
| 最新リリース | サポート中 |

## Desktop 権限

Tauri の default capability は main window に以下を許可しています。

- `core:default`
- `dialog:allow-save`
- `fs:allow-write-file`

`dialog:allow-save` と `fs:allow-write-file` は、キャリアドキュメントの PDF / DOCX 書き出しのために必要です。現在の呼び出し箇所は `packages/desktop/src/document-view.ts` の書き出し処理に限定しています。

運用ルール：

- ファイル書き込みは、ユーザーが保存ダイアログで選択したパスに対する PDF / DOCX 書き出し用途に限定します。
- export 以外の機能から `writeFile` を呼ぶ変更は、capability と SECURITY.md の見直しを同じ PR に含めます。
- import / attachment / 任意ファイル操作を追加する場合は、既存 capability に便乗せず、必要な権限と許可範囲を再設計します。

残余リスク：

WebView 内で任意 JavaScript が実行された場合、保存ダイアログを経由した任意ファイル書き込みに悪用される可能性があります。CSP と DOMPurify により XSS surface を抑えていますが、権限追加時は「ローカル機密データを扱う desktop app」として最小権限を優先します。

## 脆弱性の報告

セキュリティ上の問題を発見した場合、**GitHub Issues には投稿しないでください**。

以下の方法でご連絡ください：

- GitHub の [Private vulnerability reporting](https://github.com/toshtag/episfolio/security/advisories/new)

報告内容には以下を含めてください：

- 問題の概要
- 再現手順
- 影響範囲（推定）
- 可能であれば PoC

報告受領後、7 日以内に初回返答を行います。
