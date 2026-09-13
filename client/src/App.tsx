import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppShell from "./components/AppShell";
import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import BookDetail from "./pages/BookDetail";
import Rooms from "./pages/Rooms";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

function Protected({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

function Router() {
  return <Switch>
    <Route path="/" component={Landing} />
    <Route path="/auth" component={AuthPage} />
    <Route path="/dashboard">{() => <Protected><Dashboard /></Protected>}</Route>
    <Route path="/catalog">{() => <Protected><Catalog /></Protected>}</Route>
    <Route path="/books/:id">{(params) => <Protected><BookDetail id={Number(params.id)} /></Protected>}</Route>
    <Route path="/rooms">{() => <Protected><Rooms /></Protected>}</Route>
    <Route path="/profile">{() => <Protected><Profile /></Protected>}</Route>
    <Route path="/admin">{() => <Protected><Admin /></Protected>}</Route>
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
