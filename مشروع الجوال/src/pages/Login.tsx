import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Location } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };
  const [nationalId, setNationalId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const success = await login(nationalId, pin);
    if (success) {
      const destination = location.state?.from?.pathname ?? "/";
      navigate(destination, { replace: true });
    } else {
      setError("تعذّر تسجيل الدخول، يرجى التحقق من البيانات");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl shadow-black/40"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">مرحباً بك</h1>
          <p className="text-sm text-slate-400">سجّل دخولك لمتابعة القضايا والمهام</p>
        </div>

        <div className="space-y-4 text-right">
          <label className="block text-xs text-slate-400">رقم الهوية</label>
          <input
            dir="ltr"
            inputMode="numeric"
            maxLength={10}
            className="h-12 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 text-right text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={nationalId}
            onChange={(event) => setNationalId(event.target.value)}
            required
          />

          <label className="block text-xs text-slate-400">الرمز السري</label>
          <input
            type="password"
            className="h-12 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 text-right text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            required
          />
        </div>

        {error ? <p className="text-center text-xs text-rose-400">{error}</p> : null}

        <button
          type="submit"
          className="h-12 w-full rounded-full bg-brand-500 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:bg-slate-700"
          disabled={isLoading}
        >
          {isLoading ? "جاري التحميل..." : "تسجيل الدخول"}
        </button>
      </form>
    </div>
  );
};

export default Login;
