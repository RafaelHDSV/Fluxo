import { query } from '../../lib/db.js'
import { normalizeDescription } from '../../lib/money.js'
import { T } from '../../lib/tables.js'

type DescRule = {
  pattern: string
  replacement: string
  match_type: string
}

export async function applyDescriptionRules(userId: string, description: string): Promise<string> {
  const rules = await query<DescRule>(
    `select pattern, replacement, match_type from ${T.descriptionRules}
     where user_id = $1 order by priority asc, created_at asc`,
    [userId],
  )
  const normalized = normalizeDescription(description)
  for (const rule of rules) {
    if (rule.match_type !== 'contains') continue
    if (normalized.includes(normalizeDescription(rule.pattern))) {
      return rule.replacement
    }
  }
  return description
}
