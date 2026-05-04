import type {
  ApplicationMotive,
  IronApplicationMotive,
  StandardApplicationMotive,
} from '../domain/application-motive.js';

type StandardComponents = Pick<
  StandardApplicationMotive,
  'companyFuture' | 'contributionAction' | 'leveragedExperience'
>;

function composeStandard({
  companyFuture,
  contributionAction,
  leveragedExperience,
}: StandardComponents): string {
  if (!companyFuture && !contributionAction && !leveragedExperience) return '';
  return (
    `私は${companyFuture}を達成するために、貴社を志望しています。` +
    `具体的には、${contributionAction}に貢献すべく、私の経験の${leveragedExperience}を生かしてまいります。`
  );
}

type IronComponents = Pick<
  IronApplicationMotive,
  | 'positiveInfluence'
  | 'beforeAfterFact'
  | 'selfIdentification'
  | 'providerSwitchMoment'
  | 'valueAnalysisType'
  | 'valueAnalysisDetail'
  | 'postJoinActionPlan'
>;

const selfIdentificationLabel: Record<
  NonNullable<IronApplicationMotive['selfIdentification']>,
  string
> = {
  fan: 'ファン',
  provider: '提供者',
  transitioning: '移行中',
};

const valueAnalysisLabel: Record<
  NonNullable<IronApplicationMotive['valueAnalysisType']>,
  string
> = {
  productOut: 'プロダクトアウト型',
  marketIn: 'マーケットイン型',
};

function composeIron({
  positiveInfluence,
  beforeAfterFact,
  selfIdentification,
  providerSwitchMoment,
  valueAnalysisType,
  valueAnalysisDetail,
  postJoinActionPlan,
}: IronComponents): string {
  const parts: string[] = [];
  if (positiveInfluence) parts.push(`【肯定的影響】${positiveInfluence}`);
  if (beforeAfterFact) parts.push(`【Before→After の事実】${beforeAfterFact}`);
  if (selfIdentification) parts.push(`【自己認識】${selfIdentificationLabel[selfIdentification]}`);
  if (providerSwitchMoment) parts.push(`【提供者への転換点】${providerSwitchMoment}`);
  if (valueAnalysisType)
    parts.push(`【価値分析】${valueAnalysisLabel[valueAnalysisType]}：${valueAnalysisDetail}`);
  if (postJoinActionPlan) parts.push(`【入社後の行動計画】${postJoinActionPlan}`);
  return parts.join('\n');
}

export function composeApplicationMotiveText(motive: ApplicationMotive): string;
export function composeApplicationMotiveText(motive: StandardComponents): string;
export function composeApplicationMotiveText(
  motive: ApplicationMotive | StandardComponents,
): string {
  if ('style' in motive) {
    if (motive.style === 'standard') return composeStandard(motive);
    return composeIron(motive);
  }
  return composeStandard(motive);
}
