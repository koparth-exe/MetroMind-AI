import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useHealthCheck } from '@workspace/api-client-react';
import {
  Activity,
  BarChart3,
  BrainCircuit,
  BusFront,
  ChevronRight,
  CircleHelp,
  Database,
  Gauge,
  GitBranch,
  Map,
  Menu,
  Moon,
  Network,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Target,
  TrainFront,
  X,
} from 'lucide-react';
import { normalizeTransportMode, type TransportMode } from '@/lib/transport-mode';

export type { TransportMode } from '@/lib/transport-mode';

export type TransportModeContextValue = {
  transportMode: TransportMode;
  setTransportMode: (mode: TransportMode) => void;
};

export const TransportModeContext = createContext<TransportModeContextValue | null>(null);

const TRANSPORT_MODE_STORAGE_KEY = 'metromind-transport-mode';

function TransportModeProvider({ children }: { children: ReactNode }) {
  const [transportMode, setTransportModeState] = useState<TransportMode>(() => {
    if (typeof window === 'undefined') return 'RAILWAY';
    const saved = window.localStorage.getItem(TRANSPORT_MODE_STORAGE_KEY);
    return normalizeTransportMode(saved) ?? 'RAILWAY';
  });

  const setTransportMode = useCallback((mode: TransportMode) => {
    setTransportModeState(mode);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(TRANSPORT_MODE_STORAGE_KEY, transportMode);
  }, [transportMode]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      const mode = normalizeTransportMode(event.newValue);
      if (event.key === TRANSPORT_MODE_STORAGE_KEY && mode) {
        setTransportModeState(mode);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const value = useMemo(() => ({ transportMode, setTransportMode }), [transportMode, setTransportMode]);
  return <TransportModeContext.Provider value={value}>{children}</TransportModeContext.Provider>;
}

export function useTransportMode(): TransportModeContextValue {
  const context = useContext(TransportModeContext);
  if (!context) {
    throw new Error('useTransportMode must be used within MetroShell');
  }
  return context;
}

function TransportModeControl() {
  const { transportMode, setTransportMode } = useTransportMode();
  const options: Array<{ mode: TransportMode; label: string; shortLabel: string; Icon: typeof TrainFront }> = [
    { mode: 'RAILWAY', label: 'Suburban Railway Network', shortLabel: 'Railway', Icon: TrainFront },
    { mode: 'BUS', label: 'BEST Bus Network', shortLabel: 'Bus', Icon: BusFront },
  ];

  return (
    <div
      className="transport-mode-control"
      role="radiogroup"
      aria-label="Transport network selection"
      data-testid="control-transport-mode"
    >
      <span className="sr-only">Choose active transport network</span>
      {options.map(({ mode, label, shortLabel, Icon }) => {
        const active = transportMode === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            onClick={() => setTransportMode(mode)}
            className="transport-mode-option"
            data-active={active}
            aria-checked={active}
            aria-pressed={active}
            aria-label={label}
            data-testid={`button-transport-${mode}`}
            title={label}
          >
            <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
            <span className="transport-mode-option-label">{shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

interface NavSection {
  category: string;
  items: Array<{ href: string; label: string; icon: typeof Gauge }>;
}

const navSections: NavSection[] = [
  {
    category: 'MONITOR',
    items: [
      { href: '/', label: 'Overview', icon: Gauge },
      { href: '/passenger', label: 'Passenger view', icon: BusFront },
    ],
  },
  {
    category: 'ANALYSE',
    items: [
      { href: '/data', label: 'Data intake', icon: Database },
      { href: '/analysis', label: 'Analysis', icon: BarChart3 },
      { href: '/prediction', label: 'Prediction', icon: BrainCircuit },
      { href: '/risk', label: 'Risk', icon: Activity },
    ],
  },
  {
    category: 'DECIDE',
    items: [
      { href: '/optimization', label: 'Optimization', icon: Target },
      { href: '/simulator', label: 'Simulator', icon: SlidersHorizontal },
    ],
  },
  {
    category: 'INTELLIGENCE',
    items: [
      { href: '/models', label: 'Models', icon: GitBranch },
      { href: '/routes', label: 'Routes', icon: Map },
      { href: '/insights', label: 'Insights', icon: Sparkles },
    ],
  },
  {
    category: 'SYSTEM',
    items: [
      { href: '/help', label: 'Help & assumptions', icon: CircleHelp },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function MetroShell({ children }: { children: ReactNode }) {
  return (
    <TransportModeProvider>
      <MetroShellFrame>{children}</MetroShellFrame>
    </TransportModeProvider>
  );
}

function MetroShellFrame({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { transportMode } = useTransportMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = window.localStorage.getItem('metromind-theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const health = useHealthCheck();

  const allNavItems = useMemo(() => navSections.flatMap((s) => s.items), []);
  const current = allNavItems.find((item) => item.href === location) ?? allNavItems[0];
  const currentCategory =
    navSections.find((s) => s.items.some((i) => i.href === location))?.category ?? 'MONITOR';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    window.localStorage.setItem('metromind-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const Sidebar = (
    <aside className="flex h-full w-[256px] shrink-0 flex-col bg-sidebar text-sidebar-foreground select-none">
      {/* Brand header */}
      <div className="border-b border-sidebar-border/70 px-5 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group focus-visible:outline-2 focus-visible:outline-sidebar-ring rounded-lg" data-testid="link-brand">
          <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105">
            <Network size={20} strokeWidth={2.4} />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-accent" />
          </div>
          <div>
            <div className="font-display text-[17px] font-bold tracking-tight text-sidebar-foreground">MetroMind</div>
            <div className="font-mono-ui text-[9px] uppercase tracking-[.22em] text-sidebar-foreground/50">
              decision cockpit
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors lg:hidden focus-visible:outline-2 focus-visible:outline-sidebar-ring"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation groups */}
      <div className="flex-1 overflow-y-auto sidebar-scroll px-3 py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.category}>
            <div className="mb-1.5 px-3 font-mono-ui text-[9px] font-bold uppercase tracking-[.24em] text-sidebar-foreground/45">
              {section.category}
            </div>
            <nav className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = location === href;
                const testId =
                  href === '/help'
                    ? 'link-nav-help'
                    : href === '/settings'
                    ? 'link-nav-settings'
                    : `link-nav-${label.toLowerCase().replace(/\s+/g, '-')}`;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    data-testid={testId}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[12.5px] font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring ${
                      active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs'
                        : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-sidebar-primary" />
                    )}
                    <Icon
                      size={16}
                      strokeWidth={active ? 2.4 : 2}
                      className={
                        active
                          ? 'text-sidebar-primary'
                          : 'text-sidebar-foreground/40 group-hover:text-sidebar-primary transition-colors'
                      }
                    />
                    <span>{label}</span>
                    {active && <ChevronRight size={13} className="ml-auto text-sidebar-primary shrink-0 opacity-80" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer controls & API status */}
      <div className="mt-auto px-3 pb-4 pt-2">
        <div className="mb-3 border-t border-sidebar-border/70 pt-3">
          <button
            type="button"
            onClick={() => setDarkMode((value) => !value)}
            data-testid="button-toggle-theme"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[12px] font-medium text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
          >
            {darkMode ? <Sun size={16} className="text-sidebar-primary" /> : <Moon size={16} className="text-sidebar-foreground/45" />}
            <span>{darkMode ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>

        {/* API Health badge */}
        <div className="rounded-xl border border-sidebar-border/80 bg-sidebar-accent/35 p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/50">
              System Status
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                health.isError ? 'bg-accent' : 'bg-sidebar-primary animate-pulse-line'
              }`}
            />
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] font-semibold text-sidebar-foreground">
            {health.isLoading ? 'Checking services…' : health.isError ? 'Demo mode available' : 'All systems operational'}
          </div>
          <div className="mt-1 font-mono-ui text-[9px] text-sidebar-foreground/45">pipeline / v0.1.0</div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Desktop Sidebar */}
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block shadow-sm">{Sidebar}</div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out lg:hidden shadow-2xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {Sidebar}
      </div>

      {/* Main Layout Area */}
      <div className="lg:pl-[256px]">
        {/* Cockpit Top Bar */}
        <header className="sticky top-0 z-20 flex min-h-[72px] items-center justify-between gap-3 border-b border-border/70 bg-background/90 px-4 backdrop-blur-md sm:px-6 lg:px-9">
          <div className="flex min-w-0 items-center gap-3.5">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              data-testid="button-open-menu"
              className="shrink-0 rounded-lg p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu size={19} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 truncate font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">
                <span>MetroMind</span>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-muted-foreground/80 font-medium">{currentCategory}</span>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-primary font-semibold">{current.label}</span>
              </div>
              <h1 className="mt-0.5 truncate font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {current.label}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
            {/* Mode switcher */}
            <TransportModeControl />

            {/* Live dataset indicator */}
            <div
              className="hidden md:flex items-center gap-2.5 rounded-full border border-border/75 bg-card/85 px-3.5 py-1.5 shadow-2xs transition-colors hover:border-border"
              data-testid="indicator-live-dataset"
              title={`Active analytical dataset for ${transportMode === 'BUS' ? 'BEST Bus Network' : 'Suburban Railway Network'}`}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-40 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <div className="flex items-center gap-1.5 font-mono-ui text-[10px]">
                <span className="font-semibold uppercase tracking-[0.14em] text-muted-foreground/90">LIVE DATASET</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="font-bold text-foreground tracking-wider">
                  {transportMode === 'BUS' ? 'BEST_TRANSIT_2026' : 'MMR_TRANSIT_2026'}
                </span>
              </div>
            </div>

            {/* Profile avatar */}
            <div
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/10 font-display text-xs font-bold text-primary shadow-xs ring-1 ring-primary/20 select-none cursor-default transition-transform hover:scale-105"
              data-testid="avatar-current-user"
              title="Parth Korgaonkar (Project Owner / Developer)"
              aria-label="Parth Korgaonkar, Project Owner / Developer"
            >
              PK
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="mx-auto max-w-[1540px] min-w-0 overflow-x-clip px-4 py-6 sm:px-5 sm:py-7 lg:px-9 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 md:mb-8 md:flex-row md:items-end animate-page-enter">
      <div>
        <div className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.22em] text-primary">
            {eyebrow}
          </span>
        </div>
        <h2 className="mt-2 font-display text-[1.65rem] font-bold tracking-[-.04em] text-foreground sm:text-3xl md:text-[36px] leading-tight">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Panel({
  children,
  className = '',
  title,
  meta,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <section className={`signal-card min-w-0 overflow-hidden rounded-2xl ${className}`}>
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3.5 sm:px-5 sm:py-4">
          <h3 className="min-w-0 font-display text-sm font-bold tracking-tight text-foreground">{title}</h3>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {meta && (
              <span className="max-w-full truncate rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 font-mono-ui text-[9px] font-medium uppercase tracking-[.15em] text-muted-foreground">
                {meta}
              </span>
            )}
            {action}
          </div>
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`rounded-lg bg-muted animate-pulse ${className}`} />;
}

export function QueryState({
  loading,
  error,
  empty = false,
  retry,
}: {
  loading: boolean;
  error: boolean;
  empty?: boolean;
  retry?: () => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-6 text-center">
        <div className="font-display font-bold text-foreground">Service unavailable</div>
        <p className="mt-1 text-xs text-muted-foreground">The cockpit is showing its last known assumptions.</p>
        {retry && (
          <button
            type="button"
            onClick={retry}
            data-testid="button-retry"
            className="mt-3.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:brightness-105 transition-all"
          >
            Retry connection
          </button>
        )}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 p-10 text-center text-sm text-muted-foreground">
        No observations in this view yet.
      </div>
    );
  }
  return null;
}

export function Stat({
  label,
  value,
  detail,
  tone = 'default',
  unit,
  badge,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'alert' | 'good' | 'warning' | 'critical';
  unit?: string;
  badge?: string;
}) {
  const toneBorder =
    tone === 'critical'
      ? 'border-t-2 border-t-risk-critical'
      : tone === 'alert'
      ? 'border-t-2 border-t-risk-high'
      : tone === 'good'
      ? 'border-t-2 border-t-risk-low'
      : tone === 'warning'
      ? 'border-t-2 border-t-risk-medium'
      : 'border-t-2 border-t-transparent';

  const toneText =
    tone === 'critical'
      ? 'text-risk-critical'
      : tone === 'alert'
      ? 'text-risk-high'
      : tone === 'good'
      ? 'text-risk-low'
      : tone === 'warning'
      ? 'text-risk-medium'
      : 'text-foreground';

  return (
    <div
      className={`signal-card rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${toneBorder}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono-ui text-[9.5px] uppercase tracking-[.18em] text-muted-foreground font-semibold">{label}</div>
        {badge && (
          <span className="rounded px-1.5 py-0.5 font-mono-ui text-[8.5px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <div className={`font-display text-[1.65rem] font-bold tracking-[-.04em] tabular-nums sm:text-3xl ${toneText}`}>{value}</div>
        {unit && <span className="font-mono-ui text-xs text-muted-foreground font-medium">{unit}</span>}
      </div>
      <div className="mt-1 text-[11px] leading-tight text-muted-foreground/90">{detail}</div>
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled = false,
  testId,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'outline' | 'quiet' | 'accent' | 'destructive';
  type?: 'button' | 'submit';
  disabled?: boolean;
  testId: string;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all duration-150 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring cursor-pointer ${
        variant === 'primary'
          ? 'bg-primary text-primary-foreground shadow-xs hover:brightness-105 active:brightness-95'
          : variant === 'outline'
          ? 'border border-border/80 bg-card/85 text-foreground hover:bg-muted/80 shadow-2xs hover:border-border'
          : variant === 'accent'
          ? 'bg-accent text-accent-foreground shadow-xs hover:brightness-105'
          : variant === 'destructive'
          ? 'bg-destructive text-destructive-foreground shadow-xs hover:brightness-105'
          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function RiskBadge({ risk }: { risk: string }) {
  const r = risk.toLowerCase();
  const isCritical = r === 'critical';
  const isHigh = r === 'high';
  const isMedium = r === 'medium';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono-ui text-[9px] font-semibold uppercase tracking-wider ${
        isCritical
          ? 'bg-risk-critical/15 text-risk-critical border border-risk-critical/30'
          : isHigh
          ? 'bg-risk-high/15 text-risk-high border border-risk-high/30'
          : isMedium
          ? 'bg-risk-medium/15 text-risk-medium border border-risk-medium/30'
          : 'bg-risk-low/15 text-risk-low border border-risk-low/30'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isCritical
            ? 'bg-risk-critical'
            : isHigh
            ? 'bg-risk-high'
            : isMedium
            ? 'bg-risk-medium'
            : 'bg-risk-low'
        }`}
      />
      {risk}
    </span>
  );
}

export function InsetPanel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`inset-panel p-4 ${className}`}>{children}</div>;
}
