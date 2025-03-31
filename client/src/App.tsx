import { Route, Switch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import GroupTasks from "@/pages/group-tasks";
import Leaderboard from "@/pages/leaderboard";
import Friends from "@/pages/friends";
import Rewards from "@/pages/rewards";
import Profile from "@/pages/profile";
import Auth from "@/pages/auth";
import { Sidebar } from "@/components/ui/sidebar";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, [key: string]: any }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-900">
        <Loader2 className="w-10 h-10 text-[#1DB954] animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    window.location.href = "/auth";
    return null;
  }

  return <Component {...rest} user={user} />;
}

function AppRoutes() {
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  const isLoggedIn = !!user;

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-900">
      {isLoggedIn && <Sidebar />}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {isLoggedIn && <Header />}
        
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-900 to-zinc-950">
          <Switch>
            <Route path="/auth" component={Auth} />
            <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
            <Route path="/tasks" component={() => <ProtectedRoute component={Tasks} />} />
            <Route path="/group-tasks" component={() => <ProtectedRoute component={GroupTasks} />} />
            <Route path="/leaderboard" component={() => <ProtectedRoute component={Leaderboard} />} />
            <Route path="/friends" component={() => <ProtectedRoute component={Friends} />} />
            <Route path="/rewards" component={() => <ProtectedRoute component={Rewards} />} />
            <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
            <Route component={NotFound} />
          </Switch>
        </main>
        
        {isLoggedIn && <MobileNav />}
      </div>
    </div>
  );
}

function App() {
  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  );
}

export default App;
