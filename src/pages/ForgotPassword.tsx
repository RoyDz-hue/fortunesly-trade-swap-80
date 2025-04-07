import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Check } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/context/AuthContext";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      // Assuming there's a resetPassword function in your auth context
      await resetPassword(email);
      
      setSuccess(true);
      toast({
        title: "Reset link sent!",
        description: "Check your email for password reset instructions.",
      });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to send reset link. Please try again.");
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
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gray-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-800">
            {success ? (
              <div className="text-center space-y-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-900/30 border border-green-800">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-100">Check your email</h3>
                <p className="text-sm text-gray-400">
                  We've sent a password reset link to {email}
                </p>
                <div className="mt-6">
                  <Link to="/login">
                    <Button variant="outline" className="w-full bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800">
                      Back to login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
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
                  <Button
                    type="submit"
                    className="w-full bg-fortunesly-primary hover:bg-fortunesly-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send reset link"}
                  </Button>
                </div>

                <div className="flex items-center justify-center">
                  <Link to="/login" className="font-medium text-sm text-fortunesly-primary hover:text-fortunesly-accent">
                    Back to login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
