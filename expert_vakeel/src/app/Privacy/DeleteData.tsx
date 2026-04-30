import React, { useState } from "react";
import { ArrowLeft, ShieldAlert, Trash2, Mail, ExternalLink, ShieldCheck, AlertTriangle, ChevronDown, Send, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DeleteData: React.FC = () => {
  const navigate = useNavigate();
  const [requestType, setRequestType] = useState("Delete account");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd send this data (requestType, email, reason) to an API
    setIsSubmitted(true);
  };

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
              <div className="space-y-1">
                <p className="text-xs font-bold text-blue-500/80 uppercase tracking-[0.25em] mb-2">Legal Network</p>
                <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
                  Delete My <span className="text-blue-500">Data</span>
                </h1>
              </div>
              <p className="text-lg text-slate-400 leading-relaxed">
                We value your privacy and provide you with full control over your personal information. 
                Request deletion of your account or specific data associated with your identity on Legal Network.
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
              {!isSubmitted ? (
                <>
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30 shadow-[0_0_40px_rgba(37,99,235,0.2)]">
                      <Trash2 size={40} className="text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Delete Request</h2>
                    <p className="text-slate-400 text-sm">Please provide details for your deletion request.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300 ml-1">Request Type</label>
                      <div className="relative">
                        <select
                          value={requestType}
                          onChange={(e) => setRequestType(e.target.value)}
                          className="w-full h-14 bg-slate-900/50 border border-slate-700 rounded-2xl px-5 text-white appearance-none focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                        >
                          <option value="Delete account">Delete account</option>
                          <option value="Delete account data only">Delete account data only</option>
                        </select>
                        <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300 ml-1">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your registered email"
                        className="w-full h-14 bg-slate-900/50 border border-slate-700 rounded-2xl px-5 text-white focus:outline-none focus:border-blue-500 transition-all"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300 ml-1">Why you want to delete data?</label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Tell us your reason (optional)..."
                        className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all resize-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
                    >
                      <Send size={20} />
                      Submit Delete Request
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                    <ShieldCheck size={40} className="text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">Request Submitted</h2>
                  <p className="text-slate-400 mb-8">Our team will contact you shortly regarding your request.</p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-blue-500 font-semibold hover:text-blue-400 transition-colors"
                  >
                    Submit another request
                  </button>
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-slate-700/50 space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <p className="text-xs text-slate-500 font-medium">DOWNLOAD OUR MOBILE APP</p>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.legalnetwork.leagel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-700/30 border border-slate-600 hover:bg-slate-700/50 transition-all group"
                  >
                    <Smartphone size={20} className="text-blue-400" />
                    <div className="text-left">
                      <p className="text-[10px] text-slate-400 leading-none">GET IT ON</p>
                      <p className="text-sm font-bold text-white leading-tight">Google Play</p>
                    </div>
                  </a>
                </div>

                <p className="text-center text-[10px] text-slate-600">
                  By continuing, you agree to our
                  <a href="/privacypolicy" className="text-blue-500 hover:underline mx-1">Privacy Policy</a>
                  and
                  <a href="/terms" className="text-blue-500 hover:underline mx-1">Terms of Service</a>.
                </p>
              </div>
            </div>

            <div className="mt-8 text-center space-y-4">
              <a 
                href="mailto:info@expertvakeel.in" 
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Need help? Contact Support
                <ExternalLink size={14} />
              </a>
              <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium">
                © {new Date().getFullYear()} Legal Network • All Rights Reserved
              </p>
            </div>
          </div>
        </div>

        {/* App Screenshots Gallery */}
        <div className="mt-24 space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-white">Experience Legal Network on Mobile</h3>
            <p className="text-slate-400">Discover a faster, more secure way to manage your legal needs.</p>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar">
            {[1, 2, 3, 4].map((num) => (
              <div 
                key={num} 
                className="flex-none w-64 aspect-[9/19.5] rounded-3xl overflow-hidden border border-white/10 shadow-2xl snap-center bg-slate-800"
              >
                <img 
                  src={`/app/${num}.png`} 
                  alt={`App Screenshot ${num}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteData;
