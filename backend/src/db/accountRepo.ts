import { query, queryOne } from '../lib/db.js'

const APP = 'fluxo'

export type LegalAcceptanceRow = {
  termsVersion: string
  privacyVersion: string
  acceptedAt: string
  healthConsentVersion: string | null
  healthConsentAt: string | null
  healthConsentRevokedAt: string | null
}

export function accountRepo(userId: string) {
  return {
    async getLegal(): Promise<LegalAcceptanceRow | null> {
      return queryOne<LegalAcceptanceRow>(
        `SELECT terms_version AS "termsVersion",
                privacy_version AS "privacyVersion",
                accepted_at AS "acceptedAt",
                health_consent_version AS "healthConsentVersion",
                health_consent_at AS "healthConsentAt",
                health_consent_revoked_at AS "healthConsentRevokedAt"
           FROM vieira_legal_acceptances
          WHERE user_id = $1 AND app = $2`,
        [userId, APP],
      )
    },

    async acceptLegal(version: string, acceptedAt: Date): Promise<LegalAcceptanceRow> {
      await query(
        `INSERT INTO vieira_legal_acceptances (
            user_id, app, terms_version, privacy_version, accepted_at
         )
         VALUES ($1, $2, $3, $3, $4)
         ON CONFLICT (user_id, app) DO UPDATE
            SET terms_version = EXCLUDED.terms_version,
                privacy_version = EXCLUDED.privacy_version,
                accepted_at = EXCLUDED.accepted_at,
                updated_at = NOW()`,
        [userId, APP, version, acceptedAt],
      )
      const row = await this.getLegal()
      if (!row) throw Object.assign(new Error('legal_acceptance_not_saved'), { status: 500 })
      return row
    },

    async exportData(): Promise<unknown> {
      const row = await queryOne<{ data: unknown }>(
        'SELECT public.vieira_export_app_data($1, $2) AS data',
        [APP, userId],
      )
      return row?.data ?? null
    },

    async deleteData(protectedEmails: string[]): Promise<{ authUserDeleted: boolean }> {
      const row = await queryOne<{ result: { auth_user_deleted?: boolean } }>(
        'SELECT public.vieira_delete_app_data($1, $2, $3) AS result',
        [APP, userId, protectedEmails],
      )
      return { authUserDeleted: Boolean(row?.result?.auth_user_deleted) }
    },
  }
}
