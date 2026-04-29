export const PROMPT_ID = 'extract-evidence-v1';
export const PROMPT_VERSION = '1.0.0';

export const PROMPT_TEMPLATE = `あなたはキャリアコンサルタントのアシスタントです。
以下の業務エピソード {{episodeCount}} 件から、応募者の再現性のある強み（SkillEvidence）を抽出してください。

## 業務エピソード

{{episodes}}

## 指示

各エピソードを読み、以下の観点で強みの候補を 3〜5 個抽出してください：
- 繰り返し発揮されているパターンや行動
- 結果・成果に直結した行動や思考
- 特定の状況・役割に限らず再現できそうな特性

## 出力形式

JSON オブジェクトで出力してください。以下の構造を持ちます：

{
  "candidates": [
    {
      "strengthLabel": "強みのラベル（10〜20文字）",
      "description": "具体的な説明（2〜3文）",
      "evidenceEpisodeIds": ["根拠となるエピソードの ID"],
      "reproducibility": "どんな状況でも再現できるか（1〜2文）",
      "evaluatedContext": "この強みが評価された文脈（1〜2文）",
      "confidence": "確信度（low / medium / high のいずれか）"
    }
  ]
}

JSON 以外のテキストは出力しないでください。`;
