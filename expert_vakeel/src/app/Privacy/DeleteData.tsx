import React from "react";
import { ArrowLeft, ShieldAlert, Trash2, Mail, ExternalLink, ShieldCheck, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DeleteData: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 selection:bg-blue-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-24">
        {/* Header */}
        <button
          onClick={() => navigate("/")}
          className="group mb-12 flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300"
        >
          <div className="p-2 rounded-full bg-slate-800/50 group-hover:bg-slate-700 transition-colors">
            <ArrowLeft size={18} />
          </div>
          <span className="text-sm font-medium">Back to Home</span>
        </button>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column: Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert size={14} />
                Data Privacy
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
                Delete My <span className="text-blue-500">Data</span>
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed">
                We value your privacy and provide you with full control over your personal information. 
                Request deletion of your account or specific data associated with your identity.
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-blue-500" />
                  What happens next?
                </h3>
                <ul className="space-y-3">
                  {[
                    "Account profile and settings will be permanently removed.",
                    "Personal identification data will be scrubbed from our systems.",
                    "Subscription and transaction history will be anonymized.",
                    "This action is irreversible after 30 days of request."
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-4 items-start">
                <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                <p className="text-xs text-amber-200/70 leading-relaxed">
                  <strong>Note:</strong> Some data may be retained for legal, audit, or regulatory purposes 
                  as required by Indian law.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Actions */}
          <div className="sticky top-24">
            <div className="p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 shadow-2xl backdrop-blur-2xl">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30 shadow-[0_0_40px_rgba(37,99,235,0.2)]">
                  <Trash2 size={40} className="text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
                <p className="text-slate-400 text-sm">Please select a method to verify your identity before proceeding.</p>
              </div>

              <div className="space-y-4">
                <button className="w-full h-16 bg-white text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-100 transition-all active:scale-[0.98] shadow-lg shadow-white/5">
                  <Mail size={20} />
                  Continue with Email
                </button>
                
                <button className="w-full h-16 bg-slate-800 text-white border border-slate-700 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-700 transition-all active:scale-[0.98]">
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  Continue with Google
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-700/50">
                <p className="text-center text-xs text-slate-500">
                  By continuing, you agree to our 
                  <a href="/privacypolicy" className="text-blue-500 hover:underline mx-1">Privacy Policy</a> 
                  and 
                  <a href="/terms" className="text-blue-500 hover:underline mx-1">Terms of Service</a>.
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <a 
                href="mailto:support@expertvakeel.com" 
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Need help? Contact Support
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteData;
