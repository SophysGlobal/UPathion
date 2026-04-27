import { useAuth } from "@/context/AuthContext";
import SignIn from "./SignIn";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // AuthGate handles redirect for logged-in users
  // If we reach here and user is logged in, AuthGate will redirect
  // If not logged in, show sign in page
  return <SignIn />;
};

export default Index;
