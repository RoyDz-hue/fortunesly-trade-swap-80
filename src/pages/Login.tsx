
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check authentication status when component mounts and when it changes
  useEffect(() => {
    console.log("Login component - Auth status:", { isAuthenticated, isAdmin });
    
    if (isAuthenticated) {
      console.log("User authenticated, redirecting", isAdmin ? "to admin" : "to dashboard");
      const redirectPath = isAdmin ? "/admin" : "/dashboard";
      console.log("Redirecting to:", redirectPath);
      
      // Force immediate navigation with replace
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    
    setError("");
    setIsLoading(true);

    try {
      console.log("Attempting login with:", email);
      await login(email, password);
      
      toast({
        title: "Login successful!",
        description: "Welcome back!",
      });
      
      // The useEffect hook will handle the redirect after successful login
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof Error) {
        setError(error.message || "Failed to login. Please check your credentials.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-24">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <span className="text-3xl font-bold text-fortunesly-primary">Fortunesly</span>
            <span className="text-3xl font-bold text-fortunesly-secondary">.shop</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-100">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <Link to="/register" className="font-medium text-fortunesly-primary hover:text-fortunesly-accent">
              create a new account
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gray-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-800">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-900/30 p-4 rounded-md flex items-start space-x-2 border border-red-800">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                  <span className="text-sm text-red-300">{error}</span>
                </div>
              )}

              <div>
                <Label htmlFor="email" className="text-gray-300">Email address</Label>
                <div className="mt-1">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-gray-100 focus:ring-fortunesly-primary focus:border-fortunesly-primary"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <div className="mt-1">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-gray-100 focus:ring-fortunesly-primary focus:border-fortunesly-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-fortunesly-primary focus:ring-fortunesly-primary bg-gray-800 border-gray-700 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-fortunesly-primary hover:text-fortunesly-accent">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full bg-fortunesly-primary hover:bg-fortunesly-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-400">Login to start</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
