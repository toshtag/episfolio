import { describe, expect, it } from 'vitest';
import {
  ApplicationRouteSchema,
  EmploymentTypeSchema,
  JobTargetSchema,
  JobTargetStatusSchema,
  JobTargetUpdateSchema,
  SkillItemSchema,
  WageTypeSchema,
} from '../../src/schemas/job-target.js';

const baseTarget = {
  id: '01HJOB',
  companyName: '株式会社サンプル',
  jobTitle: 'バックエンドエンジニア',
  jobDescription: 'Go/Rust でマイクロサービス開発',
  status: 'researching' as const,
  requiredSkills: [{ id: '01HSKL1', text: 'Go 言語 3 年以上' }],
  preferredSkills: [{ id: '01HSKL2', text: 'Kubernetes 経験' }],
  concerns: 'フルリモート可否',
  appealPoints: 'OSS 貢献実績',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
};

describe('JobTargetStatusSchema', () => {
  it.each([
    'researching',
    'applying',
    'interviewing',
    'offered',
    'rejected',
    'withdrawn',
  ])('%s を受理', (status) => {
    expect(JobTargetStatusSchema.safeParse(status).success).toBe(true);
  });

  it('未知の値を拒否', () => {
    expect(JobTargetStatusSchema.safeParse('archived').success).toBe(false);
    expect(JobTargetStatusSchema.safeParse('').success).toBe(false);
  });
});

describe('SkillItemSchema', () => {
  it('id/text ともに存在する場合を受理', () => {
    expect(SkillItemSchema.safeParse({ id: '01HSKL1', text: 'Go' }).success).toBe(true);
  });

  it('id 空文字を拒否', () => {
    expect(SkillItemSchema.safeParse({ id: '', text: 'Go' }).success).toBe(false);
  });

  it('text 空文字を拒否', () => {
    expect(SkillItemSchema.safeParse({ id: '01HSKL1', text: '' }).success).toBe(false);
  });
});

describe('EmploymentTypeSchema', () => {
  it.each(['regular', 'contract', 'dispatch', 'other'])('%s を受理', (v) => {
    expect(EmploymentTypeSchema.safeParse(v).success).toBe(true);
  });

  it('未知の値を拒否', () => {
    expect(EmploymentTypeSchema.safeParse('parttime').success).toBe(false);
    expect(EmploymentTypeSchema.safeParse('').success).toBe(false);
  });
});

describe('WageTypeSchema', () => {
  it.each(['monthly', 'annual', 'commission', 'other'])('%s を受理', (v) => {
    expect(WageTypeSchema.safeParse(v).success).toBe(true);
  });

  it('未知の値を拒否', () => {
    expect(WageTypeSchema.safeParse('hourly').success).toBe(false);
    expect(WageTypeSchema.safeParse('').success).toBe(false);
  });
});

describe('ApplicationRouteSchema', () => {
  it.each(['direct', 'site', 'agent'])('%s を受理', (v) => {
    expect(ApplicationRouteSchema.safeParse(v).success).toBe(true);
  });

  it('未知の値を拒否', () => {
    expect(ApplicationRouteSchema.safeParse('referral').success).toBe(false);
    expect(ApplicationRouteSchema.safeParse('').success).toBe(false);
  });
});

describe('JobTargetSchema', () => {
  it('正常系（新フィールドなし — 後方互換）', () => {
    expect(JobTargetSchema.safeParse(baseTarget).success).toBe(true);
  });

  it('新フィールドが全て省略されると null にデフォルト', () => {
    const result = JobTargetSchema.safeParse(baseTarget);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.annualHolidays).toBeNull();
    expect(result.data.workingHoursPerDay).toBeNull();
    expect(result.data.commuteTimeMinutes).toBeNull();
    expect(result.data.employmentType).toBeNull();
    expect(result.data.flexTimeAvailable).toBeNull();
    expect(result.data.remoteWorkAvailable).toBeNull();
    expect(result.data.averagePaidLeaveTaken).toBeNull();
    expect(result.data.vacancyReason).toBeNull();
    expect(result.data.currentTeamSize).toBeNull();
    expect(result.data.wageType).toBeNull();
    expect(result.data.basicSalary).toBeNull();
    expect(result.data.fixedOvertimeHours).toBeNull();
    expect(result.data.bonusBaseMonths).toBeNull();
    expect(result.data.hasFutureRaisePromise).toBeNull();
    expect(result.data.futureRaisePromiseInContract).toBeNull();
    expect(result.data.applicationRoute).toBeNull();
  });

  it('新フィールドを全て null で明示しても受理', () => {
    const input = {
      ...baseTarget,
      annualHolidays: null,
      workingHoursPerDay: null,
      commuteTimeMinutes: null,
      employmentType: null,
      flexTimeAvailable: null,
      remoteWorkAvailable: null,
      averagePaidLeaveTaken: null,
      vacancyReason: null,
      currentTeamSize: null,
      wageType: null,
      basicSalary: null,
      fixedOvertimeHours: null,
      bonusBaseMonths: null,
      hasFutureRaisePromise: null,
      futureRaisePromiseInContract: null,
      applicationRoute: null,
    };
    expect(JobTargetSchema.safeParse(input).success).toBe(true);
  });

  it('companyName 空文字を拒否', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, companyName: '' }).success).toBe(false);
  });

  it('jobTitle 空文字を拒否', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, jobTitle: '' }).success).toBe(false);
  });

  it('jobDescription 空文字は許可', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, jobDescription: '' }).success).toBe(true);
  });

  it('concerns / appealPoints 空文字は許可', () => {
    expect(
      JobTargetSchema.safeParse({ ...baseTarget, concerns: '', appealPoints: '' }).success,
    ).toBe(true);
  });

  it('未知の status を拒否', () => {
    expect(
      JobTargetSchema.safeParse({ ...baseTarget, status: 'archived' as 'researching' }).success,
    ).toBe(false);
  });

  it('requiredSkills は空配列も許可', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, requiredSkills: [] }).success).toBe(true);
  });

  it('preferredSkills は空配列も許可', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, preferredSkills: [] }).success).toBe(true);
  });

  it('requiredSkills の各要素が SkillItem 形式でない場合を拒否', () => {
    expect(
      JobTargetSchema.safeParse({
        ...baseTarget,
        requiredSkills: [{ id: '', text: 'Go' }],
      }).success,
    ).toBe(false);
  });

  // --- 数値フィールドの境界テスト ---

  it('annualHolidays: 正整数を受理', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, annualHolidays: 120 }).success).toBe(true);
  });

  it('annualHolidays: 0 を受理', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, annualHolidays: 0 }).success).toBe(true);
  });

  it('annualHolidays: 負数を拒否', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, annualHolidays: -1 }).success).toBe(false);
  });

  it('annualHolidays: 小数を拒否', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, annualHolidays: 1.5 }).success).toBe(false);
  });

  it('workingHoursPerDay: 正数を受理', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, workingHoursPerDay: 8 }).success).toBe(true);
  });

  it('workingHoursPerDay: 0 を拒否（positive()）', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, workingHoursPerDay: 0 }).success).toBe(false);
  });

  it('workingHoursPerDay: 負数を拒否', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, workingHoursPerDay: -1 }).success).toBe(
      false,
    );
  });

  it('commuteTimeMinutes: 0 を受理', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, commuteTimeMinutes: 0 }).success).toBe(true);
  });

  it('commuteTimeMinutes: 負数を拒否', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, commuteTimeMinutes: -10 }).success).toBe(
      false,
    );
  });

  it('commuteTimeMinutes: 小数を拒否', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, commuteTimeMinutes: 30.5 }).success).toBe(
      false,
    );
  });

  it('currentTeamSize: 正整数を受理', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, currentTeamSize: 10 }).success).toBe(true);
  });

  it('currentTeamSize: 0 を拒否（positive()）', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, currentTeamSize: 0 }).success).toBe(false);
  });

  it('basicSalary: 0 を受理', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, basicSalary: 0 }).success).toBe(true);
  });

  it('basicSalary: 負数を拒否', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, basicSalary: -100 }).success).toBe(false);
  });

  it('basicSalary: 小数を拒否', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, basicSalary: 250000.5 }).success).toBe(false);
  });

  it('fixedOvertimeHours: 0 を受理', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, fixedOvertimeHours: 0 }).success).toBe(true);
  });

  it('fixedOvertimeHours: 負数を拒否', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, fixedOvertimeHours: -20 }).success).toBe(
      false,
    );
  });

  it('bonusBaseMonths: 0 を受理', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, bonusBaseMonths: 0 }).success).toBe(true);
  });

  it('bonusBaseMonths: 負数を拒否', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, bonusBaseMonths: -1 }).success).toBe(false);
  });

  it('averagePaidLeaveTaken: 0 を受理', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, averagePaidLeaveTaken: 0 }).success).toBe(
      true,
    );
  });

  it('averagePaidLeaveTaken: 負数を拒否', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, averagePaidLeaveTaken: -1 }).success).toBe(
      false,
    );
  });

  // --- enum フィールドの境界テスト ---

  it.each(['regular', 'contract', 'dispatch', 'other'])('employmentType: %s を受理', (v) => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, employmentType: v }).success).toBe(true);
  });

  it('employmentType: 未知の値を拒否', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, employmentType: 'parttime' }).success).toBe(
      false,
    );
  });

  it.each(['monthly', 'annual', 'commission', 'other'])('wageType: %s を受理', (v) => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, wageType: v }).success).toBe(true);
  });

  it('wageType: 未知の値を拒否', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, wageType: 'hourly' }).success).toBe(false);
  });

  it.each(['direct', 'site', 'agent'])('applicationRoute: %s を受理', (v) => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, applicationRoute: v }).success).toBe(true);
  });

  it('applicationRoute: 未知の値を拒否', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, applicationRoute: 'referral' }).success).toBe(
      false,
    );
  });

  // --- boolean フィールド ---

  it('flexTimeAvailable: true / false を受理', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, flexTimeAvailable: true }).success).toBe(
      true,
    );
    expect(JobTargetSchema.safeParse({ ...baseTarget, flexTimeAvailable: false }).success).toBe(
      true,
    );
  });

  it('remoteWorkAvailable: true / false を受理', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, remoteWorkAvailable: true }).success).toBe(
      true,
    );
    expect(JobTargetSchema.safeParse({ ...baseTarget, remoteWorkAvailable: false }).success).toBe(
      true,
    );
  });

  it('hasFutureRaisePromise: true / false を受理', () => {
    expect(JobTargetSchema.safeParse({ ...baseTarget, hasFutureRaisePromise: true }).success).toBe(
      true,
    );
    expect(JobTargetSchema.safeParse({ ...baseTarget, hasFutureRaisePromise: false }).success).toBe(
      true,
    );
  });

  it('futureRaisePromiseInContract: true / false を受理', () => {
    expect(
      JobTargetSchema.safeParse({ ...baseTarget, futureRaisePromiseInContract: true }).success,
    ).toBe(true);
    expect(
      JobTargetSchema.safeParse({ ...baseTarget, futureRaisePromiseInContract: false }).success,
    ).toBe(true);
  });

  it('全新フィールドに有効値を設定した正常系', () => {
    const full = {
      ...baseTarget,
      annualHolidays: 125,
      workingHoursPerDay: 7.5,
      commuteTimeMinutes: 45,
      employmentType: 'regular',
      flexTimeAvailable: true,
      remoteWorkAvailable: false,
      averagePaidLeaveTaken: 10,
      vacancyReason: '前任者退職のため',
      currentTeamSize: 8,
      applicationRoute: 'agent',
      wageType: 'monthly',
      basicSalary: 300000,
      fixedOvertimeHours: 30,
      bonusBaseMonths: 4,
      hasFutureRaisePromise: true,
      futureRaisePromiseInContract: false,
    };
    expect(JobTargetSchema.safeParse(full).success).toBe(true);
  });
});

describe('JobTargetUpdateSchema', () => {
  it('空オブジェクトを受理（全フィールド任意）', () => {
    expect(JobTargetUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('一部のフィールドのみ送れる', () => {
    expect(JobTargetUpdateSchema.safeParse({ status: 'applying' }).success).toBe(true);
    expect(
      JobTargetUpdateSchema.safeParse({
        requiredSkills: [{ id: '01HSKL1', text: 'TypeScript' }],
      }).success,
    ).toBe(true);
  });

  it('未知の status を拒否', () => {
    expect(JobTargetUpdateSchema.safeParse({ status: 'unknown' as 'researching' }).success).toBe(
      false,
    );
  });

  it('新フィールドを patch で送れる', () => {
    expect(JobTargetUpdateSchema.safeParse({ annualHolidays: 120 }).success).toBe(true);
    expect(JobTargetUpdateSchema.safeParse({ applicationRoute: 'direct' }).success).toBe(true);
    expect(JobTargetUpdateSchema.safeParse({ wageType: 'annual' }).success).toBe(true);
    expect(JobTargetUpdateSchema.safeParse({ hasFutureRaisePromise: true }).success).toBe(true);
  });

  it('新フィールドを null で patch できる', () => {
    expect(JobTargetUpdateSchema.safeParse({ annualHolidays: null }).success).toBe(true);
    expect(JobTargetUpdateSchema.safeParse({ applicationRoute: null }).success).toBe(true);
    expect(JobTargetUpdateSchema.safeParse({ employmentType: null }).success).toBe(true);
  });

  it('新 enum フィールドに未知の値を渡すと拒否', () => {
    expect(JobTargetUpdateSchema.safeParse({ applicationRoute: 'fax' as 'direct' }).success).toBe(
      false,
    );
    expect(
      JobTargetUpdateSchema.safeParse({ employmentType: 'freelance' as 'regular' }).success,
    ).toBe(false);
  });
});
