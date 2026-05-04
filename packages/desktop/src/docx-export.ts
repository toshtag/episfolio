import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { marked, type Token, type Tokens } from 'marked';

type DocxChild = Paragraph | Table;

function inlineTokensToRuns(tokens: Token[]): TextRun[] {
  const runs: TextRun[] = [];
  for (const tok of tokens) {
    switch (tok.type) {
      case 'strong':
        runs.push(
          ...inlineTokensToRuns((tok as Tokens.Strong).tokens).map(
            (r) => new TextRun({ ...r, bold: true }),
          ),
        );
        break;
      case 'em':
        runs.push(
          ...inlineTokensToRuns((tok as Tokens.Em).tokens).map(
            (r) => new TextRun({ ...r, italics: true }),
          ),
        );
        break;
      case 'codespan':
        runs.push(new TextRun({ text: (tok as Tokens.Codespan).text, font: 'Courier New' }));
        break;
      case 'text':
      case 'escape':
        runs.push(new TextRun({ text: (tok as Tokens.Text).text }));
        break;
      case 'link':
        runs.push(new TextRun({ text: (tok as Tokens.Link).text, style: 'Hyperlink' }));
        break;
      case 'br':
        runs.push(new TextRun({ break: 1 }));
        break;
      default:
        if ('text' in tok && typeof (tok as { text: string }).text === 'string') {
          runs.push(new TextRun({ text: (tok as { text: string }).text }));
        }
    }
  }
  return runs;
}

function headingLevel(depth: number): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
  const map: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
    5: HeadingLevel.HEADING_5,
    6: HeadingLevel.HEADING_6,
  };
  return map[depth] ?? HeadingLevel.HEADING_6;
}

function blockTokensToChildren(tokens: Token[]): DocxChild[] {
  const children: DocxChild[] = [];

  for (const tok of tokens) {
    switch (tok.type) {
      case 'heading': {
        const h = tok as Tokens.Heading;
        children.push(
          new Paragraph({
            heading: headingLevel(h.depth),
            children: inlineTokensToRuns(h.tokens),
          }),
        );
        break;
      }
      case 'paragraph': {
        const p = tok as Tokens.Paragraph;
        children.push(new Paragraph({ children: inlineTokensToRuns(p.tokens) }));
        break;
      }
      case 'hr':
        children.push(new Paragraph({ border: { bottom: { style: 'single', size: 6 } } }));
        break;
      case 'code': {
        const c = tok as Tokens.Code;
        for (const line of c.text.split('\n')) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: line, font: 'Courier New', size: 18 })],
              shading: { fill: 'F5F5F5' },
            }),
          );
        }
        break;
      }
      case 'list': {
        const list = tok as Tokens.List;
        for (const item of list.items) {
          const inlineTokens = item.tokens.filter((t) => t.type !== 'list');
          const runs = inlineTokensToRuns(inlineTokens as Token[]);
          children.push(
            new Paragraph({
              children: runs,
              numbering: list.ordered
                ? { reference: 'ordered-list', level: 0 }
                : { reference: 'unordered-list', level: 0 },
            }),
          );
          // 入れ子リストは現時点では非対応（v0.9 スコープ外）
        }
        break;
      }
      case 'table': {
        const t = tok as Tokens.Table;
        const rows: TableRow[] = [];

        // ヘッダー行
        rows.push(
          new TableRow({
            children: t.header.map(
              (cell) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: inlineTokensToRuns(cell.tokens),
                      alignment:
                        cell.align === 'center'
                          ? AlignmentType.CENTER
                          : cell.align === 'right'
                            ? AlignmentType.RIGHT
                            : AlignmentType.LEFT,
                    }),
                  ],
                  shading: { fill: 'F0F0F0' },
                }),
            ),
            tableHeader: true,
          }),
        );

        // データ行
        for (const row of t.rows) {
          rows.push(
            new TableRow({
              children: row.map(
                (cell, ci) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: inlineTokensToRuns(cell.tokens),
                        alignment:
                          t.align[ci] === 'center'
                            ? AlignmentType.CENTER
                            : t.align[ci] === 'right'
                              ? AlignmentType.RIGHT
                              : AlignmentType.LEFT,
                      }),
                    ],
                  }),
              ),
            }),
          );
        }

        children.push(
          new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        );
        break;
      }
      case 'space':
        break;
      default:
        if ('text' in tok && typeof (tok as { text: string }).text === 'string') {
          children.push(
            new Paragraph({ children: [new TextRun({ text: (tok as { text: string }).text })] }),
          );
        }
    }
  }

  return children;
}

export async function markdownToDocxBlob(markdown: string, title: string): Promise<Blob> {
  const tokens = marked.lexer(markdown);
  const children = blockTokensToChildren(tokens as Token[]);

  const doc = new Document({
    title,
    numbering: {
      config: [
        {
          reference: 'unordered-list',
          levels: [
            {
              level: 0,
              format: 'bullet',
              text: '•',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
        {
          reference: 'ordered-list',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [{ children }],
  });

  return Packer.toBlob(doc);
}
