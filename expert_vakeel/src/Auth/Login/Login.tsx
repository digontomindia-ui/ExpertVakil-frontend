import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function LogIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) { alert("Email and password are required"); return; }

    try {
      setLoading(true);
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("client", JSON.stringify(data.client));
      navigate("/", { replace: true });
    } catch (err: any) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <main className="w-full max-w-[400px] px-6 text-center">
        <img src="/assets/Group1.png" alt="Expert Vakeel" className="mx-auto mb-6 h-24 w-auto select-none" draggable={false} />
        
        <h1 className="mb-3 text-[40px] leading-none font-extrabold tracking-tight text-[#6F6F6F]">Log In</h1>
        
        <p className="mb-8 text-[13px] text-black">
          New To Site? <Link to="/signup" className="font-semibold text-black underline">Sign Up Here.</Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 w-full rounded-[28px] bg-[#F6F6F6] text-center text-[18px] font-semibold text-[#111] outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-black/10 placeholder:font-medium placeholder:text-[#9CA3AF]" />
          
          <input type="password" placeholder="" value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 w-full rounded-[28px] bg-[#F6F6F6] text-center text-[18px] font-semibold text-[#111] outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-black/10 placeholder:font-medium placeholder:text-[#9CA3AF]" />
          
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-[11px] text-[#8A8A8A] hover:underline">Forgot Password?</Link>
          </div>
          
          <button type="submit" disabled={loading} className="mt-2 h-14 w-full rounded-[28px] bg-[#FFA800] text-[20px] font-extrabold text-white shadow-[0_10px_24px_rgba(255,168,0,0.35)] transition active:scale-[0.99] disabled:opacity-60">
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
      </main>
    </div>
  );
}