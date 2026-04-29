export type DiffHunk = {
  kind: 'context' | 'added' | 'removed';
  lines: string[];
};

export function computeUnifiedDiff(oldContent: string, newContent: string): DiffHunk[] {
  const oldLines = oldContent === '' ? [] : oldContent.split('\n');
  const newLines = newContent === '' ? [] : newContent.split('\n');

  const matrix = buildLcsMatrix(oldLines, newLines);
  return buildHunks(oldLines, newLines, matrix);
}

function get2d(matrix: number[][], r: number, c: number): number {
  return matrix[r]?.[c] ?? 0;
}

function buildLcsMatrix(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const row = dp[i];
      if (!row) continue;
      row[j] =
        a[i - 1] === b[j - 1]
          ? get2d(dp, i - 1, j - 1) + 1
          : Math.max(get2d(dp, i - 1, j), get2d(dp, i, j - 1));
    }
  }
  return dp;
}

function buildHunks(a: string[], b: string[], dp: number[][]): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  let i = a.length;
  let j = b.length;
  const ops: Array<{ kind: 'context' | 'added' | 'removed'; line: string }> = [];

  while (i > 0 || j > 0) {
    const ai = a[i - 1] ?? '';
    const bj = b[j - 1] ?? '';
    const top = get2d(dp, i - 1, j);
    const left = get2d(dp, i, j - 1);
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      ops.push({ kind: 'context', line: ai });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || left >= top)) {
      ops.push({ kind: 'added', line: bj });
      j--;
    } else {
      ops.push({ kind: 'removed', line: ai });
      i--;
    }
  }

  ops.reverse();

  for (const op of ops) {
    const last = hunks[hunks.length - 1];
    if (last && last.kind === op.kind) {
      last.lines.push(op.line);
    } else {
      hunks.push({ kind: op.kind, lines: [op.line] });
    }
  }

  return hunks;
}

export function formatUnifiedDiff(hunks: DiffHunk[]): string {
  return hunks
    .flatMap((h) => {
      const prefix = h.kind === 'added' ? '+' : h.kind === 'removed' ? '-' : ' ';
      return h.lines.map((l) => `${prefix}${l}`);
    })
    .join('\n');
}
