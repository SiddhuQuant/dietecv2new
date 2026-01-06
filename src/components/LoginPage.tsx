import { useState } from "react";
import { Heart, User, Lock, Mail, Sparkles, Shield, Activity, Stethoscope, Loader2, AlertCircle, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ThemeToggle } from "./ThemeToggle";
import { motion } from "motion/react";
import { Alert, AlertDescription } from "./ui/alert";
import { authService } from "../services/authService";

interface LoginPageProps {
  onLogin: (userData: { name: string; email: string; role?: string }) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function LoginPage({ onLogin, isDarkMode, onToggleTheme }: LoginPageProps) {
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { user, error: loginError } = await authService.login(
        loginForm.email,
        loginForm.password
      );

      if (loginError || !user) {
        throw new Error(loginError || "Login failed");
      }

      setSuccess(`Welcome back, ${user.name}!`);
      
      // Call onLogin to trigger navigation
      setTimeout(() => {
        onLogin({ 
          name: user.name, 
          email: user.email,
          role: user.role 
        });
      }, 500);
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (signupForm.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { user, error: signupError } = await authService.signup(
        signupForm.email,
        signupForm.password,
        signupForm.name
      );

      if (signupError || !user) {
        throw new Error(signupError || "Signup failed");
      }

      setSuccess("Account created successfully! Logging you in...");
      // The auth state listener in App.tsx will handle the rest
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to sign up. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Heart className="h-8 w-8 text-teal-600" fill="currentColor" />
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <Card className="border border-border p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                    className="h-9 text-sm"
                  />
                </div>

                {error && (
                  <Alert className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-sm text-red-600">{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-sm text-green-600">{success}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white h-9"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                </Button>
              </form>
            </Card>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup">
            <Card className="border border-border p-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signupForm.name}
                    onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                    required
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    required
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    required
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm" className="text-sm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                    required
                    className="h-9 text-sm"
                  />
                </div>

                {/* Note: Only patients can sign up, doctors and admins are added by admin */}
                <input type="hidden" name="role" value="patient" />

                {error && (
                  <Alert className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-sm text-red-600">{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white h-9"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                </Button>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-muted-foreground">DIETEC Health Platform</p>
          <ThemeToggle isDarkMode={isDarkMode} onToggle={onToggleTheme} />
        </div>
      </div>
    </div>
  );
}
