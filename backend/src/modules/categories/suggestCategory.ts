import { query } from '../../lib/db.js'
import { normalizeDescription } from '../../lib/money.js'

type Rule = {
  category_id: string
  match_type: string
  pattern: string
}

export async function suggestCategoryId(userId: string, description: string) {
  const rules = await query<Rule>(
    `select category_id, match_type, pattern from category_rules
     where user_id = $1 order by priority asc, created_at asc`,
    [userId],
  )
  const normalized = normalizeDescription(description)
  for (const rule of rules) {
    const pattern = normalizeDescription(rule.pattern)
    if (rule.match_type === 'contains' && normalized.includes(pattern)) {
      return rule.category_id
    }
    if (rule.match_type === 'source' && normalized.includes(pattern)) {
      return rule.category_id
    }
    if (rule.match_type === 'recurring' && normalized.includes(pattern)) {
      return rule.category_id
    }
  }
  const fallback = await query<{ id: string }>(
    `select id from categories where user_id = $1 and name = 'Outros' limit 1`,
    [userId],
  )
  return fallback[0]?.id ?? null
}
