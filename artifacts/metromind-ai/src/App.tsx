import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { MetroShell } from '@/components/metro-shell';
import { AnalysisPage, DataPage, InsightsPage, ModelsPage, OptimizationPage, OverviewPage, PassengerPage, PredictionPage, RiskPage, RoutesPage, SettingsPage, SimulatorPage } from '@/pages/metro-pages';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <MetroShell>
        <Switch>
          <Route path="/" component={OverviewPage} />
          <Route path="/data" component={DataPage} />
          <Route path="/analysis" component={AnalysisPage} />
          <Route path="/prediction" component={PredictionPage} />
          <Route path="/risk" component={RiskPage} />
          <Route path="/optimization" component={OptimizationPage} />
          <Route path="/simulator" component={SimulatorPage} />
          <Route path="/models" component={ModelsPage} />
          <Route path="/routes" component={RoutesPage} />
          <Route path="/insights" component={InsightsPage} />
          <Route path="/passenger" component={PassengerPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </MetroShell>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
