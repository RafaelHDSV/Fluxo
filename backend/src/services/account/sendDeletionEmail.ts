import { MAIL_FROM, RESEND_API_KEY } from '../../globals/Config.js'

const APP_NAME = 'Fluxo'
const SUPPORT_EMAIL = 'rafaelvieira1720@gmail.com'

function formatNow(): { date: string; time: string } {
  const now = new Date()
  const tz = 'America/Sao_Paulo'
  return {
    date: now.toLocaleDateString('pt-BR', { timeZone: tz }),
    time: now.toLocaleTimeString('pt-BR', { timeZone: tz, hour: '2-digit', minute: '2-digit' }),
  }
}

/**
 * Confirmação de exclusão. O texto é o mesmo quando a conta do Auth some e quando ela continua
 * em outro app do projects-v1: nunca revelar o uso de outros produtos.
 */
export async function sendDeletionEmail(to: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn('[account] RESEND_API_KEY ausente: e-mail de confirmação de exclusão não enviado')
    return
  }

  const { date, time } = formatNow()
  const text =
    `Seus dados do ${APP_NAME} foram excluídos em ${date} às ${time}.\n\n` +
    `Se você não pediu esta exclusão ou tem alguma dúvida, escreva para ${SUPPORT_EMAIL}.\n\n` +
    'Vieira'
  const html =
    `<p>Seus dados do ${APP_NAME} foram excluídos em ${date} às ${time}.</p>` +
    `<p>Se você não pediu esta exclusão ou tem alguma dúvida, escreva para ` +
    `<a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>` +
    '<p>Vieira</p>'

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [to],
        reply_to: SUPPORT_EMAIL,
        subject: `Seus dados do ${APP_NAME} foram excluídos`,
        text,
        html,
      }),
    })
    if (!res.ok) {
      console.error('[account] Resend respondeu', res.status)
    }
  } catch (error) {
    console.error('[account] falha ao enviar e-mail de exclusão', error)
  }
}
