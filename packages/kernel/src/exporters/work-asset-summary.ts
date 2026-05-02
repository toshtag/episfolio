import type { AssetType, WorkAssetSummary } from '../domain/work-asset-summary.js';

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  proposal: '提案書',
  'source-code': 'ソースコード',
  slide: 'スライド',
  minutes: '議事録',
  'weekly-report': '週次報告',
  'comparison-table': '比較表',
  document: '文書',
  other: 'その他',
};

const PLACEHOLDER = '（未記入）';

function val(s: string | null): string {
  return s && s.length > 0 ? s : PLACEHOLDER;
}

export function toWorkAssetSummaryMarkdown(asset: WorkAssetSummary): string {
  const lines: string[] = [];

  lines.push(`# 仕事資料 — ${asset.title}`);
  lines.push('');
  lines.push(`**資料種別**: ${ASSET_TYPE_LABELS[asset.assetType]}`);
  if (asset.jobContext) lines.push(`**業務コンテキスト**: ${asset.jobContext}`);
  if (asset.period) lines.push(`**作成期間**: ${asset.period}`);
  if (asset.role) lines.push(`**担当役割**: ${asset.role}`);
  lines.push('');

  lines.push('## 概要');
  lines.push('');
  lines.push(val(asset.summary));
  lines.push('');

  lines.push('## 強みエピソード');
  lines.push('');
  lines.push(val(asset.strengthEpisode));
  lines.push('');

  lines.push('## 面接での話すポイント');
  lines.push('');
  lines.push(val(asset.talkingPoints));
  lines.push('');

  lines.push('## 機微情報のマスク方針');
  lines.push('');
  lines.push(val(asset.maskingNote));
  lines.push('');

  return lines.join('\n');
}
