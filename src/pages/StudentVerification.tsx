import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { GradientButton } from "@/components/ui/GradientButton";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import { toast } from "sonner";
import { BadgeCheck, Mail, ShieldCheck, ArrowLeft, Loader2, RotateCcw } from "lucide-react";

const StudentVerification = () => {
  const navigate = useNavigate();
  const { status, verifiedAt, verifiedEmail, refetch } = useVerificationStatus();
  const [step, setStep] = useState<"idle" | "email" | "code">("idle");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (status === "pending" && step === "idle") setStep("code");
  }, [status, step]);

  const sendCode = async () => {
    if (!email.trim()) return;
    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-student-verification", {
      body: { email: email.trim() },
    });
    setSending(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || "Failed to send code");
      return;
    }
    toast.success(`Code sent to ${email.trim()}`);
    setStep("code");
    refetch();
  };

  const confirmCode = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setConfirming(true);
    const { data, error } = await supabase.functions.invoke("confirm-student-verification", {
      body: { code: code.trim() },
    });
    setConfirming(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || "Verification failed");
      return;
    }
    toast.success("You're verified!");
    setStep("idle");
    setCode("");
    refetch();
  };

  const isVerified = status === "verified";

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <AppHeader title="Student Verification" />

      <main className="relative z-10 px-5 py-6 max-w-xl mx-auto space-y-5">
        <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {isVerified ? (
          <div className="gradient-border animate-fade-in">
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-full gradient-bg mx-auto flex items-center justify-center">
                <BadgeCheck className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">You're a verified student</h2>
              <p className="text-sm text-muted-foreground">
                Verified {verifiedAt ? new Date(verifiedAt).toLocaleDateString() : ""}{" "}
                {verifiedEmail && <>via <span className="text-foreground">{verifiedEmail}</span></>}
              </p>
              <p className="text-xs text-muted-foreground">
                A verified badge now appears next to your name across UPathion.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="gradient-border animate-fade-in">
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Verify your student status</h2>
                    <p className="text-sm text-muted-foreground">
                      Confirm you're a current student to earn a verified badge and unlock more trust across UPathion.
                    </p>
                  </div>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 pl-1">
                  <li>• Uses your school-issued email (e.g. name@yourschool.edu)</li>
                  <li>• We send you a 6-digit code — no documents required</li>
                  <li>• Only your verification status is shown publicly</li>
                </ul>
              </div>
            </div>

            {step !== "code" && (
              <div className="gradient-border animate-fade-in">
                <div className="bg-card/90 backdrop-blur-sm rounded-lg p-5 space-y-3">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" /> School email
                  </label>
                  <div className="gradient-border">
                    <Input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@yourschool.edu"
                      className="bg-card border-0 focus-visible:ring-0"
                    />
                  </div>
                  <GradientButton variant="filled" className="w-full" onClick={sendCode} disabled={sending || !email.trim()}>
                    {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Send verification code
                  </GradientButton>
                  {status === "failed" && (
                    <p className="text-xs text-destructive text-center">
                      Previous attempt failed. You can request a new code and try again.
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === "code" && (
              <div className="gradient-border animate-fade-in">
                <div className="bg-card/90 backdrop-blur-sm rounded-lg p-5 space-y-3">
                  <p className="text-sm text-foreground">
                    Enter the 6-digit code we sent to your school email.
                  </p>
                  <div className="gradient-border">
                    <Input
                      inputMode="numeric"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      className="bg-card border-0 focus-visible:ring-0 text-center text-2xl tracking-[0.5em] font-mono"
                    />
                  </div>
                  <GradientButton
                    variant="filled"
                    className="w-full"
                    onClick={confirmCode}
                    disabled={confirming || code.length !== 6}
                  >
                    {confirming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Verify
                  </GradientButton>
                  <button
                    onClick={() => setStep("email")}
                    className="w-full text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Use a different email / resend code
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default StudentVerification;