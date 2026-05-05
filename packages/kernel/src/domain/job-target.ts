import type { ISO8601, ULID } from './types.js';

export type JobTargetStatus =
  | 'researching'
  | 'applying'
  | 'interviewing'
  | 'offered'
  | 'rejected'
  | 'withdrawn';

export type SkillItem = {
  id: ULID;
  text: string;
};

export type EmploymentType = 'regular' | 'contract' | 'dispatch' | 'other';
export type WageType = 'monthly' | 'annual' | 'commission' | 'other';
export type ApplicationRoute = 'direct' | 'site' | 'agent';

export type JobTarget = {
  id: ULID;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  status: JobTargetStatus;
  requiredSkills: SkillItem[];
  preferredSkills: SkillItem[];
  concerns: string;
  appealPoints: string;
  // 求人票分析フィールド
  annualHolidays: number | null;
  workingHoursPerDay: number | null;
  commuteTimeMinutes: number | null;
  employmentType: EmploymentType | null;
  flexTimeAvailable: boolean | null;
  remoteWorkAvailable: boolean | null;
  averagePaidLeaveTaken: number | null;
  vacancyReason: string | null;
  currentTeamSize: number | null;
  wageType: WageType | null;
  basicSalary: number | null;
  fixedOvertimeHours: number | null;
  bonusBaseMonths: number | null;
  hasFutureRaisePromise: boolean | null;
  futureRaisePromiseInContract: boolean | null;
  // 応募経路フィールド
  applicationRoute: ApplicationRoute | null;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
