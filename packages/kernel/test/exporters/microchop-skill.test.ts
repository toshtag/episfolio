import { describe, expect, it } from 'vitest';
import type { MicrochopSkill } from '../../src/domain/microchop-skill.js';
import { toMicrochopSkillMarkdown } from '../../src/exporters/microchop-skill.js';

const buildRecord = (overrides: Partial<MicrochopSkill> = {}): MicrochopSkill => ({
  id: '01MCS0001',
  jobTitle: '営業担当',
  industry: '製造業',
  tasks: [
    { id: '01MCT0001', label: '企業の調査', transferable: true },
    { id: '01MCT0002', label: '業界固有の契約処理', transferable: false },
  ],
  transferableSkills: 'ヒアリング力、資料作成力',
  note: null,
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides,
});

describe('toMicrochopSkillMarkdown', () => {
  it('H1 タイトルを含む', () => {
    expect(toMicrochopSkillMarkdown([])).toContain('# 仕事のみじん切り（職種名の檻から出る）');
  });

  it('空配列のとき「（記録なし）」を出力する', () => {
    expect(toMicrochopSkillMarkdown([])).toContain('（記録なし）');
  });

  it('空配列のとき「（記録なし）」は 1 件のみ', () => {
    const count = (toMicrochopSkillMarkdown([]).match(/（記録なし）/g) ?? []).length;
    expect(count).toBe(1);
  });

  it('jobTitle と industry が H3 見出しに出力される', () => {
    const md = toMicrochopSkillMarkdown([buildRecord()]);
    expect(md).toContain('### 1. 営業担当（製造業）');
  });

  it('transferable:true のタスクが「他業界でも通用するタスク」セクションに出力される', () => {
    const md = toMicrochopSkillMarkdown([buildRecord()]);
    expect(md).toContain('**他業界でも通用するタスク**');
    expect(md).toContain('- 企業の調査');
  });

  it('transferable:false のタスクが「職種・業界固有のタスク」セクションに出力される', () => {
    const md = toMicrochopSkillMarkdown([buildRecord()]);
    expect(md).toContain('**職種・業界固有のタスク**');
    expect(md).toContain('- 業界固有の契約処理');
  });

  it('transferable なタスクのみのとき固有セクションを出力しない', () => {
    const md = toMicrochopSkillMarkdown([
      buildRecord({
        tasks: [{ id: '01MCT0001', label: 'タスクA', transferable: true }],
      }),
    ]);
    expect(md).not.toContain('**職種・業界固有のタスク**');
  });

  it('固有タスクのみのとき汎用セクションを出力しない', () => {
    const md = toMicrochopSkillMarkdown([
      buildRecord({
        tasks: [{ id: '01MCT0001', label: 'タスクB', transferable: false }],
      }),
    ]);
    expect(md).not.toContain('**他業界でも通用するタスク**');
  });

  it('tasks が空のとき「みじん切りタスク」セクションを出力しない', () => {
    const md = toMicrochopSkillMarkdown([buildRecord({ tasks: [] })]);
    expect(md).not.toContain('#### みじん切りタスク');
  });

  it('transferableSkills が出力される', () => {
    const md = toMicrochopSkillMarkdown([
      buildRecord({ transferableSkills: 'ヒアリング力、資料作成力' }),
    ]);
    expect(md).toContain('ヒアリング力、資料作成力');
  });

  it('transferableSkills が空文字のとき「（未記入）」に置換される', () => {
    const md = toMicrochopSkillMarkdown([buildRecord({ transferableSkills: '' })]);
    expect(md).toContain('（未記入）');
  });

  it('note が null のとき出力しない', () => {
    const md = toMicrochopSkillMarkdown([buildRecord({ note: null })]);
    expect(md).not.toContain('#### メモ');
  });

  it('note があるとき出力する', () => {
    const md = toMicrochopSkillMarkdown([buildRecord({ note: '面接で活用する' })]);
    expect(md).toContain('#### メモ');
    expect(md).toContain('面接で活用する');
  });

  it('jobTitle が空文字のとき「（未記入）」に置換される', () => {
    const md = toMicrochopSkillMarkdown([buildRecord({ jobTitle: '' })]);
    expect(md).toContain('（未記入）');
  });

  it('複数レコードが番号付きで出力される', () => {
    const records = [
      buildRecord({ id: '01MCS0001', jobTitle: '営業担当' }),
      buildRecord({ id: '01MCS0002', jobTitle: 'エンジニア' }),
    ];
    const md = toMicrochopSkillMarkdown(records);
    const idx1 = md.indexOf('### 1. 営業担当');
    const idx2 = md.indexOf('### 2. エンジニア');
    expect(idx1).toBeGreaterThanOrEqual(0);
    expect(idx2).toBeGreaterThan(idx1);
  });

  it('出力に "null" 文字列を含まない', () => {
    const md = toMicrochopSkillMarkdown([buildRecord({ note: null })]);
    expect(md).not.toContain('null');
  });
});
