import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

import Dashboard from "./pages/Dashboard";
import Logs from "./pages/Logs";
import Analytics from "./pages/Analytics";
import Analysis from "./pages/Analysis";
import Comparison from "./pages/Comparison";
import Bibliography from "./pages/Bibliography";
import RealTimeAnalysis from "./pages/RealTimeAnalysis";
import PersonalizedDashboard from "./pages/PersonalizedDashboard";
import { ScheduledReports } from "./pages/ScheduledReports";
import AnalyticsReports from "./pages/AnalyticsReports";
import MedicalHubDashboard from "./pages/MedicalHub/Dashboard";
import HealthParameters from "./pages/MedicalHub/HealthParameters";
import MedicalAnalysis from "./pages/MedicalHub/Analysis";
import MedicalComparison from "./pages/MedicalHub/Comparison";
import MedicalLogs from "./pages/MedicalHub/Logs";
import PersonalizedDashboard from "./pages/MedicalHub/PersonalizedDashboard";
import RealtimeLogs from "./pages/MedicalHub/RealtimeLogs";
import AdvancedAnalytics from "./pages/MedicalHub/AdvancedAnalytics";
import Automation from "./pages/MedicalHub/Automation";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/logs" component={Logs} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/analysis" component={Analysis} />
      <Route path="/comparison" component={Comparison} />
      <Route path="/bibliography" component={Bibliography} />
      <Route path="/real-time-analysis" component={RealTimeAnalysis} />
      <Route path="/personalized" component={PersonalizedDashboard} />
      <Route path="/scheduled-reports" component={ScheduledReports} />
      <Route path="/analytics-reports" component={AnalyticsReports} />
      <Route path="/medical-hub" component={MedicalHubDashboard} />
      <Route path="/medical-hub/parameters" component={HealthParameters} />
      <Route path="/medical-hub/analysis" component={MedicalAnalysis} />
      <Route path="/medical-hub/comparison" component={MedicalComparison} />
      <Route path="/medical-hub/logs" component={MedicalLogs} />
      <Route path="/medical-hub/personalized" component={PersonalizedDashboard} />
      <Route path="/medical-hub/realtime" component={RealtimeLogs} />
      <Route path="/medical-hub/analytics" component={AdvancedAnalytics} />
      <Route path="/medical-hub/automation" component={Automation} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
