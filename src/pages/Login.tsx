import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  const needsEmailConfirmation = useMemo(() => {
    const msg = error?.toLowerCase() ?? "";
    return msg.includes("email not confirmed") || msg.includes("not confirmed");
  }, [error]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      navigate("/", { replace: true });
    }

    setLoading(false);
  }

  async function handleResendConfirmation() {
    setError("");
    setInfo("");
    if (!email) {
      setError("Enter your email above first, then resend the confirmation email.");
      return;
    }

    setResendLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      setError(error.message);
    } else {
      setInfo("Confirmation email sent. Check your inbox (and spam) and then try logging in again.");
    }
    setResendLoading(false);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[hsl(var(--background))]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.18),transparent_35%),radial-gradient(circle_at_80%_30%,hsl(var(--accent)/0.25),transparent_40%),radial-gradient(circle_at_50%_90%,hsl(var(--primary)/0.12),transparent_45%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-lg items-center justify-center px-4 py-10">
        <Card className="w-full shadow-[var(--shadow-medium)]">
          <CardHeader className="space-y-2">
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Log in to continue to your boards.</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {info ? (
                <Alert>
                  <AlertTitle>Check your inbox</AlertTitle>
                  <AlertDescription>{info}</AlertDescription>
                </Alert>
              ) : null}

              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>Couldn’t log you in</AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>{error}</p>
                    {needsEmailConfirmation ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleResendConfirmation}
                          disabled={resendLoading}
                        >
                          {resendLoading ? "Sending..." : "Resend confirmation email"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setError("");
                            setInfo("");
                          }}
                        >
                          Dismiss
                        </Button>
                      </div>
                    ) : null}
                  </AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Log in"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div>
              Don’t have an account?{" "}
              <Link to="/signup" className="text-primary underline-offset-4 hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
