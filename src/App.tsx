import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import AuthGate from "@/components/AuthGate";
import Index from "./pages/Index";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import NameSetup from "./pages/onboarding/NameSetup";
import NameConfirm from "./pages/onboarding/NameConfirm";
import SchoolSetup from "./pages/onboarding/SchoolSetup";
import AspirationalSchool from "./pages/onboarding/AspirationalSchool";
import SchoolConfirm from "./pages/onboarding/SchoolConfirm";
import Subscription from "./pages/Subscription";
import Dashboard from "./pages/Dashboard";
import Feed from "./pages/Feed";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Settings from "./pages/Settings";
import PlanManagement from "./pages/PlanManagement";
import SchoolInfo from "./pages/SchoolInfo";
import Welcome from "./pages/Welcome";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <OnboardingProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthGate>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/onboarding/name" element={<NameSetup />} />
                  <Route path="/onboarding/name-confirm" element={<NameConfirm />} />
                  <Route path="/onboarding/school" element={<SchoolSetup />} />
                  <Route path="/onboarding/aspirational-school" element={<AspirationalSchool />} />
                  <Route path="/onboarding/school-confirm" element={<SchoolConfirm />} />
                  <Route path="/subscription" element={<Subscription />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/edit-profile" element={<EditProfile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/plan-management" element={<PlanManagement />} />
                  <Route path="/settings/plan" element={<PlanManagement />} />
                  <Route path="/school-info" element={<SchoolInfo />} />
                  <Route path="/welcome" element={<Welcome />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthGate>
            </BrowserRouter>
          </OnboardingProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
