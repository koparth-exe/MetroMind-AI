import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useHealthCheck } from '@workspace/api-client-react';
import { Activity, BarChart3, BrainCircuit, BusFront, ChevronRight, CircleHelp, Database, Gauge, GitBranch, Map, Menu, Moon, Network, Settings, SlidersHorizontal, Sparkles, Sun, Target } from 'lucide-react';

const nav = [
  { href: '/', label: 'Overview', icon: Gauge },
  { href: '/passenger', label: 'Passenger view', icon: BusFront },
  { href: '/data', label: 'Data intake', icon: Database },
  { href: '/analysis', label: 'Analysis', icon: BarChart3 },
  { href: '/prediction', label: 'Prediction', icon: BrainCircuit },
  { href: '/risk', label: 'Risk', icon: Activity },
  { href: '/optimization', label: 'Optimization', icon: Target },
  { href: '/simulator', label: 'Simulator', icon: SlidersHorizontal },
  { href: '/models', label: 'Models', icon: GitBranch },
  { href: '/routes', label: 'Routes', icon: Map },
  { href: '/insights', label: 'Insights', icon: Sparkles },
];

export function MetroShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = window.localStorage.getItem('metromind-theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const health = useHealthCheck();
  const current = nav.find((item) => item.href === location) ?? nav[0];
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    window.localStorage.setItem('metromind-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);
  const Sidebar = (
    <aside className="flex h-full w-[248px] shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-5 py-5">
        <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
          <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Network size={21} strokeWidth={2.5} />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-accent" />
          </div>
          <div>
            <div className="font-display text-[17px] font-bold tracking-tight">MetroMind</div>
            <div className="font-mono-ui text-[9px] uppercase tracking-[.19em] text-sidebar-foreground/55">decision cockpit</div>
          </div>
        </Link>
      </div>
      <div className="px-3 pt-6">
        <div className="mb-3 px-3 font-mono-ui text-[9px] uppercase tracking-[.19em] text-sidebar-foreground/40">Workspace</div>
        <nav className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-nav-${label.toLowerCase().replace(' ', '-')}`} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-semibold transition-all ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' : 'text-sidebar-foreground/62 hover:bg-sidebar-accent/65 hover:text-sidebar-foreground'}`}>
                <Icon size={16} className={active ? 'text-sidebar-primary' : 'text-sidebar-foreground/40 group-hover:text-sidebar-primary'} />
                <span>{label}</span>
                {active && <ChevronRight size={13} className="ml-auto text-sidebar-primary" />}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto px-3 pb-5">
        <div className="mb-3 border-t border-sidebar-border pt-4">
          <button type="button" onClick={() => setDarkMode((value) => !value)} data-testid="button-toggle-theme" aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] font-semibold text-sidebar-foreground/62 hover:bg-sidebar-accent/65 hover:text-sidebar-foreground">
            {darkMode ? <Sun size={16} className="text-sidebar-primary" /> : <Moon size={16} className="text-sidebar-foreground/45" />}
            {darkMode ? 'Light mode' : 'Dark mode'}
          </button>
          <Link href="/settings" data-testid="link-nav-settings" className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-semibold transition-colors ${location === '/settings' ? 'bg-sidebar-accent' : 'text-sidebar-foreground/62 hover:bg-sidebar-accent/65 hover:text-sidebar-foreground'}`}>
            <Settings size={16} className="text-sidebar-foreground/45" /> Settings
          </Link>
          <button type="button" onClick={() => window.alert('MetroMind guidance is available in the system handbook.')} data-testid="button-help" className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] font-semibold text-sidebar-foreground/62 hover:bg-sidebar-accent/65 hover:text-sidebar-foreground">
            <CircleHelp size={16} className="text-sidebar-foreground/45" /> Help & assumptions
          </button>
        </div>
        <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/55 p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[9px] uppercase tracking-[.17em] text-sidebar-foreground/45">API status</span>
            <span className={`h-2 w-2 rounded-full ${health.isError ? 'bg-accent' : 'bg-sidebar-primary animate-pulse-line'}`} />
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold">
            {health.isLoading ? 'Checking services…' : health.isError ? 'Demo mode available' : 'All systems operational'}
          </div>
          <div className="mt-1 font-mono-ui text-[9px] text-sidebar-foreground/40">pipeline / v0.1.0</div>
        </div>
      </div>
    </aside>
  );
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{Sidebar}</div>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-foreground/30 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-50 transition-transform lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>{Sidebar}</div>
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/80 bg-background/90 px-5 backdrop-blur-md lg:px-9">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setMobileOpen(true)} data-testid="button-open-menu" className="rounded-lg p-2 hover:bg-muted lg:hidden"><Menu size={19} /></button>
            <div>
              <div className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground">MetroMind / {current.label}</div>
              <h1 className="mt-1 font-display text-xl font-bold tracking-tight text-foreground">{current.label}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
               <span className="font-mono-ui text-[10px] text-muted-foreground">LIVE_DATASET : MMR_TRANSIT_2026</span>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card font-display text-sm font-bold text-primary" data-testid="avatar-current-user">AM</div>
          </div>
        </header>
        <main className="mx-auto max-w-[1540px] px-5 py-7 lg:px-9 lg:py-9">{children}</main>
      </div>
    </div>
  );
}

export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end animate-rise">
    <div><div className="font-mono-ui text-[10px] uppercase tracking-[.22em] text-primary">{eyebrow}</div><h2 className="mt-2 font-display text-3xl font-bold tracking-[-.04em] text-foreground md:text-[38px]">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div>
    {action}
  </div>;
}

export function Panel({ children, className = '', title, meta }: { children: ReactNode; className?: string; title?: string; meta?: string }) {
  return <section className={`signal-card rounded-2xl ${className}`}><>{title && <div className="flex items-center justify-between border-b border-border/80 px-5 py-4"><h3 className="font-display text-sm font-bold">{title}</h3>{meta && <span className="font-mono-ui text-[9px] uppercase tracking-[.15em] text-muted-foreground">{meta}</span>}</div>}<div className={title ? 'p-5' : 'p-5'}>{children}</div></></section>;
}

export function Skeleton({ className = '' }: { className?: string }) { return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />; }
export function QueryState({ loading, error, empty = false, retry }: { loading: boolean; error: boolean; empty?: boolean; retry?: () => void }) {
  if (loading) return <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-36 w-full" /></div>;
  if (error) return <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 text-center"><div className="font-display font-bold">Service unavailable</div><p className="mt-1 text-xs text-muted-foreground">The cockpit is showing its last known assumptions.</p>{retry && <button type="button" onClick={retry} data-testid="button-retry" className="mt-3 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">Retry connection</button>}</div>;
  if (empty) return <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No observations in this view yet.</div>;
  return null;
}

export function Stat({ label, value, detail, tone = 'default' }: { label: string; value: string; detail: string; tone?: 'default' | 'alert' | 'good' }) {
  return <div className="signal-card rounded-2xl p-5 transition-transform hover:-translate-y-0.5"><div className="font-mono-ui text-[9px] uppercase tracking-[.17em] text-muted-foreground">{label}</div><div className={`mt-3 font-display text-3xl font-bold tracking-[-.05em] ${tone === 'alert' ? 'text-accent' : tone === 'good' ? 'text-primary' : 'text-foreground'}`}>{value}</div><div className="mt-1 text-[11px] text-muted-foreground">{detail}</div></div>;
}

export function Button({ children, onClick, variant = 'primary', type = 'button', disabled = false, testId }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'outline' | 'quiet'; type?: 'button' | 'submit'; disabled?: boolean; testId: string }) {
  return <button type={type} onClick={onClick} disabled={disabled} data-testid={testId} className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 ${variant === 'primary' ? 'bg-primary text-primary-foreground hover:brightness-95' : variant === 'outline' ? 'border border-border bg-card text-foreground hover:bg-muted' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{children}</button>;
}