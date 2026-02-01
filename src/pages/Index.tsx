import { useAuth } from "@/context/AuthContext";
import SignIn from "./SignIn";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // AuthGate handles redirect for logged-in users
  // If we reach here and user is logged in, AuthGate will redirect
  // If not logged in, show sign in page
  return <SignIn />;
};

export default Index;
