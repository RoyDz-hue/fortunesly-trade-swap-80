
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateReferralCode = (code: string) => {
    if (!code) return true; // Optional field
    const codePattern = /^TRAD\d{2}$/;
    return codePattern.test(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (referralCode && !validateReferralCode(referralCode)) {
      setError("Invalid referral code format. It should look like TRAD##");
      return;
    }

    setIsLoading(true);

    try {
      await register(username, email, password, referralCode);

      toast({
        title: "Account created!",
        description: "You have successfully registered and logged in.",
      });

      // Redirect based on email
      if (email === "cyntoremix@gmail.com") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to register. Please try again.");
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
            Create a new account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <Link to="/login" className="font-medium text-fortunesly-primary hover:text-fortunesly-accent">
              sign in to your existing account
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
                <Label htmlFor="username" className="text-gray-300">Username</Label>
                <div className="mt-1">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-gray-100 focus:ring-fortunesly-primary focus:border-fortunesly-primary"
                  />
                </div>
              </div>

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
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-gray-100 focus:ring-fortunesly-primary focus:border-fortunesly-primary"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirm-password" className="text-gray-300">Confirm Password</Label>
                <div className="mt-1">
                  <Input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-gray-100 focus:ring-fortunesly-primary focus:border-fortunesly-primary"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="referral-code" className="text-gray-300">
                  Referral Code <span className="text-gray-500 text-xs">(Optional)</span>
                </Label>
                <div className="mt-1">
                  <Input
                    id="referral-code"
                    name="referral-code"
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="e.g. TRAD01"
                    className="bg-gray-800 border-gray-700 text-gray-100 focus:ring-fortunesly-primary focus:border-fortunesly-primary"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter a referral code if you were invited by another user
                </p>
              </div>

              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-fortunesly-primary focus:ring-fortunesly-primary bg-gray-800 border-gray-700 rounded"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-300">
                  I agree to the{' '}
                  <a href="#" className="font-medium text-fortunesly-primary hover:text-fortunesly-accent">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="#" className="font-medium text-fortunesly-primary hover:text-fortunesly-accent">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full bg-fortunesly-primary hover:bg-fortunesly-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
