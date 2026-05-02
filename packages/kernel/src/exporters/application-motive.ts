type MotiveComponents = {
  companyFuture: string;
  contributionAction: string;
  leveragedExperience: string;
};

/**
 * 書籍 A 3-02 指定フォーマット:
 * 「私は●●を達成するために、貴社を志望しています。
 *  具体的には、●●に貢献すべく、私の経験の●●を生かしてまいります。」
 */
export function composeApplicationMotiveText({
  companyFuture,
  contributionAction,
  leveragedExperience,
}: MotiveComponents): string {
  if (!companyFuture && !contributionAction && !leveragedExperience) return '';
  return (
    `私は${companyFuture}を達成するために、貴社を志望しています。` +
    `具体的には、${contributionAction}に貢献すべく、私の経験の${leveragedExperience}を生かしてまいります。`
  );
}
