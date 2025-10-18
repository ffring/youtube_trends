import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Ideas from "./pages/Ideas";
import TrendingVideos from "./pages/TrendingVideos";
import TrendingKeywords from "./pages/TrendingKeywords";
import MyTopics from "./pages/MyTopics";
import Competitors from "./pages/Competitors";
import ChannelAudit from "./pages/ChannelAudit";
import TrendAlerts from "./pages/TrendAlerts";
import VideoGeneration from "./pages/VideoGeneration";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/ideas"} component={Ideas} />
      <Route path={"/trending-videos"} component={TrendingVideos} />
      <Route path={"/trending-keywords"} component={TrendingKeywords} />
      <Route path={"/my-topics"} component={MyTopics} />
      <Route path={"/competitors"} component={Competitors} />
      <Route path={"/channel-audit"} component={ChannelAudit} />
      <Route path={"/trend-alerts"} component={TrendAlerts} />
      <Route path={"/video-generation"} component={VideoGeneration} />
      <Route path={"/404"} component={NotFound} />
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
        defaultTheme="light"
        // switchable
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
