import styles from './SummaryCard.module.scss'

type Props = {
  label: string
  value: string
  tone?: 'default' | 'positive' | 'negative'
}

export function SummaryCard({ label, value, tone = 'default' }: Props) {
  return (
    <article className={`${styles.card} ${styles[tone]}`}>
      <p className={styles.label}>{label}</p>
      <p className={`money ${styles.value}`}>{value}</p>
    </article>
  )
}
