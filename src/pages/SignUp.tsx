import { useState } from "react";
import { signUp } from "@/lib/auth";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      await signUp({ email, password, username });
      setSuccess(true);
      setInfo("Account created. Please confirm your email, then come back and log in.");
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  async function handleResendConfirmation() {
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Enter your email above first, then resend the confirmation email.");
      return;
    }

    setResendLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) setError(error.message);
    else setInfo("Confirmation email sent. Check your inbox (and spam).");
    setResendLoading(false);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[hsl(var(--background))]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.18),transparent_35%),radial-gradient(circle_at_80%_30%,hsl(var(--accent)/0.25),transparent_40%),radial-gradient(circle_at_50%_90%,hsl(var(--primary)/0.12),transparent_45%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-lg items-center justify-center px-4 py-10">
        <Card className="w-full shadow-[var(--shadow-medium)]">
          <CardHeader className="space-y-2">
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Start a new MoodBoard in seconds.</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="yourname"
                  value={username}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  disabled={loading || success}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || success}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading || success}
                />
              </div>

              {info ? (
                <Alert>
                  <AlertTitle>Next step</AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>{info}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleResendConfirmation}
                        disabled={resendLoading}
                      >
                        {resendLoading ? "Sending..." : "Resend confirmation email"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => navigate("/login")}>
                        Go to login
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : null}

              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>Sign up failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" className="w-full" disabled={loading || success}>
                {loading ? "Creating account..." : success ? "Account created" : "Sign up"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div>
              Already have an account?{" "}
              <Link to="/login" className="text-primary underline-offset-4 hover:underline">
                Log in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
