import React, { useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import HeroClouds from "@/components/HeroClouds";
import CloudInterceptLogo from "@/components/CloudInterceptLogo";
import { Mail, Lock, Loader2, ShieldCheck, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const params = new URLSearchParams(location.search);
  const redirectTo = params.get("redirect") || "/dashboard";

  if (token) return <Navigate to={redirectTo} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const tok = res.data.access_token || res.data.token;
      localStorage.setItem("token", tok);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      login(tok, res.data.user);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally { setLoading(false); }
  };

  const handleGoogleSuccess = async (cred) => {
    setError(""); setLoading(true);
    try {
      const res = await api.post("/auth/google", { id_token: cred.credential });
      const tok = res.data.access_token || res.data.token;
      localStorage.setItem("token", tok);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      login(tok, res.data.user);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Google authentication failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen flex bg-ci-bg text-white overflow-hidden">
      <HeroClouds overlay={false} />

      <div className="relative z-10 hidden lg:flex flex-col justify-between w-1/2 p-12">
        <a href="/"><CloudInterceptLogo height={42} /></a>
        <div className="max-w-md">
          <h2 className="font-bold text-white leading-tight text-4xl tracking-tight">
            Cloud visibility, <span className="text-gradient-cyan">secured.</span>
          </h2>
          <p className="mt-5 text-base text-ci-muted leading-relaxed">
            Monitor, analyze, and protect your cloud environment with unified security intelligence and real-time threat detection.
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-ci-muted">
            <ShieldCheck className="w-5 h-5 text-ci-accent" /> Data Intelligence &amp; Security
          </div>
        </div>
        <p className="text-xs text-ci-muted/60">2026 CloudIntercept</p>
      </div>

      <div className="relative z-10 flex w-full lg:w-1/2 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl glass-strong p-8 glow-cyan">
          <div className="lg:hidden mb-6 flex justify-center"><CloudInterceptLogo height={40} /></div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-1.5 text-sm text-ci-muted">Log in to your CloudIntercept account</p>

          <div className="mt-6 flex justify-center">
            {loading ? (
              <div className="flex items-center gap-2 text-ci-muted text-sm py-3">
                <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google sign-in failed. Please try again.")}
                theme="filled_black"
                size="large"
                text="continue_with"
                shape="rectangular"
                width="360"
              />
            )}
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-ci-panel/80 px-3 text-ci-muted backdrop-blur">or</span></div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm border border-red-500/20">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="login-email" className="text-sm text-ci-muted block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ci-muted" />
                <input id="login-email" type="email" autoComplete="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full pl-10 h-11 rounded-lg bg-white/5 border border-white/15 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-ci-accent/60 transition-colors" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="login-password" className="text-sm text-ci-muted block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ci-muted" />
                <input id="login-password" type="password" autoComplete="current-password" placeholder="..."
                  value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full pl-10 h-11 rounded-lg bg-white/5 border border-white/15 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-ci-accent/60 transition-colors" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-11 rounded-lg font-semibold bg-ci-accent text-ci-bg hover:bg-ci-glow transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Logging in...</>
                : <span className="inline-flex items-center gap-2">Sign In <ArrowRight className="w-4 h-4" /></span>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
