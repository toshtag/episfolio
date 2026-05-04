-- 0018: customer_references テーブルを追加
--
-- 「顧客リファレンス」。BtoB/BtoC 別の顧客属性・クレーム経験
-- 強みエピソード・間接的転換アイデアを管理する。JobTarget 非依存の汎用資料。

CREATE TABLE IF NOT EXISTS customer_references (
  id TEXT PRIMARY KEY,
  customer_type TEXT NOT NULL DEFAULT 'b2b' CHECK(customer_type IN ('b2b', 'b2c')),
  customer_label TEXT,
  company_name TEXT NOT NULL DEFAULT '',
  period TEXT NOT NULL DEFAULT '',
  -- BtoB 属性
  industry TEXT,
  company_scale TEXT,
  counterpart_role TEXT,
  typical_requests TEXT,
  -- BtoC 属性
  age_range TEXT,
  family_status TEXT,
  residence TEXT,
  income_range TEXT,
  -- 共通
  hardest_experience TEXT,
  claim_content TEXT,
  response_time TEXT,
  strength_episode TEXT,
  indirect_role_idea TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
