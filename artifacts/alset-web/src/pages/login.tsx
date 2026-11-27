import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useAlsetLogin } from "@workspace/api-client-react";
import { cn } from "@/components/ui-elements";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight, Hexagon, Shield, Wrench, Truck, CalendarDays, User } from "lucide-react";
import { useLocation } from "wouter";

const DEMO_ACCOUNTS = [
  { role: "Owner",   email: "owner@alset.com",   icon: User,        color: "text-gold border-gold/30 hover:bg-gold/8" },
  { role: "Shop",    email: "shop@alset.com",    icon: Wrench,      color: "text-blue-400 border-blue-400/30 hover:bg-blue-400/8" },
  { role: "Insurer", email: "insurer@alset.com", icon: Shield,      color: "text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/8" },
  { role: "Towing",  email: "towing@alset.com",  icon: Truck,       color: "text-amber-400 border-amber-400/30 hover:bg-amber-400/8" },
  { role: "Rental",  email: "rental@alset.com",  icon: CalendarDays,color: "text-purple-400 border-purple-400/30 hover:bg-purple-400/8" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const loginMutation = useAlsetLogin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email, password } },
      { onSuccess: (res) => { login(res.user, res.token); setLocation("/dashboard"); } }
    );
  };

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
  };

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden relative">
      {/* Ambient layers */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[60%] h-[60%] bg-gold/[0.04] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-blue-500/[0.04] blur-[100px] rounded-full" />
        <img
          src={`${import.meta.env.BASE_URL}images/login-bg.png`}
          alt=""
          className="w-full h-full object-cover opacity-[0.15] mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/30" />
      </div>

      {/* Left panel — form */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-8 sm:px-14 lg:px-20 xl:px-28 max-w-xl">
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, ease: "easeOut" }}>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, hsl(42 88% 52%) 0%, hsl(38 55% 38%) 100%)" }}>
              <Hexagon className="w-5 h-5 text-background fill-current opacity-70" />
            </div>
            <span className="font-display font-bold text-2xl text-gradient-gold">Alset</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Tesla collision repair & insurance management platform
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                  className="field-input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="field-input pl-10"
                />
              </div>
            </div>

            {loginMutation.isError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                Invalid email or password.
              </div>
            )}

            <button
              type="submit" disabled={loginMutation.isPending}
              className="w-full mt-2 h-11 btn-gold rounded-xl font-semibold flex items-center justify-center gap-2 group"
            >
              {loginMutation.isPending ? (
                <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Authenticating…</>
              ) : (
                <><span>Sign In</span><ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-10">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 text-center">
              Demo accounts
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {DEMO_ACCOUNTS.map(acc => {
                const Icon = acc.icon;
                return (
                  <button key={acc.role} onClick={() => fillDemo(acc)}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-transparent border text-xs font-semibold transition-all duration-200", acc.color)}>
                    <Icon className="w-3 h-3" />{acc.role}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">Select a role to fill its email, then enter the demo password for this environment.</p>
          </div>
        </motion.div>
      </div>

      {/* Right panel — branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative z-10">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center px-16">
          <div className="text-6xl font-display font-bold text-gradient-gold mb-4">Alset</div>
          <p className="text-muted-foreground text-base max-w-xs mx-auto leading-relaxed">
            Tesla-certified collision repair, CIECA/BMS insurance integration, and multi-party coordination.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 text-left max-w-xs mx-auto">
            {[
              { label: "AI Diagnostics",       desc: "Tractable & Tchek AI" },
              { label: "ADAS Calibration",     desc: "Post-repair recalibration" },
              { label: "CIECA/BMS EDI",        desc: "Direct insurer billing" },
              { label: "Fleet Dispatch",       desc: "EV towing coordination" },
            ].map(f => (
              <div key={f.label} className="card-4d p-3">
                <p className="text-xs font-bold text-gold">{f.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
