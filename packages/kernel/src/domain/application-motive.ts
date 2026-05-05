import type { ISO8601, ULID } from './types.js';

type CommonFields = {
  id: ULID;
  jobTargetId: ULID;
  formattedText: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};

export type InfoSourceType =
  | 'recruit_info'
  | 'mid_term_plan'
  | 'president_message'
  | 'member_profile'
  | 'other';

export type SelfIdentification = 'fan' | 'provider' | 'transitioning';

export type ValueAnalysisType = 'productOut' | 'marketIn';

export type StandardApplicationMotive = CommonFields & {
  style: 'standard';
  companyFuture: string;
  contributionAction: string;
  leveragedExperience: string;
  infoSourceType: InfoSourceType | null;
  infoSourceUrl: string;
  targetDepartment: string;
  departmentChallenge: string;
};

export type IronApplicationMotive = CommonFields & {
  style: 'iron';
  positiveInfluence: string;
  beforeAfterFact: string;
  selfIdentification: SelfIdentification | null;
  providerSwitchMoment: string;
  valueAnalysisType: ValueAnalysisType | null;
  valueAnalysisDetail: string;
  postJoinActionPlan: string;
};

export type ApplicationMotive = StandardApplicationMotive | IronApplicationMotive;
