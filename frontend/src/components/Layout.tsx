import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './Layout.module.scss'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/transactions', label: 'Transações' },
  { to: '/imports', label: 'Importações' },
  { to: '/accounts', label: 'Contas' },
  { to: '/budgets', label: 'Orçamentos' },
  { to: '/goals', label: 'Metas' },
  { to: '/reports', label: 'Relatórios' },
]

export function Layout() {
  const { user, signOut } = useAuth()

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img src="/logo.svg" alt="" width={36} height={36} />
          <div>
            <strong>Fluxo</strong>
            <span>Veja seu dinheiro com clareza.</span>
          </div>
        </div>
        <nav className={styles.nav}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => (isActive ? styles.active : undefined)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.footer}>
          <p>{user?.email}</p>
          <button type="button" onClick={() => signOut()}>
            Sair
          </button>
        </div>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
      <nav className={styles.mobileNav}>
        {links.slice(0, 5).map((link) => (
          <NavLink key={link.to} to={link.to} end={link.to === '/'}>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
