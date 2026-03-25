import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Save, 
  Percent, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  XCircle
} from "lucide-react";
import { SettingsAPI } from "../../config/api";

const GlobalSettings = () => {
  const [pledgePercentage, setPledgePercentage] = useState(40);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await SettingsAPI.getByKey("pledgeRewardPercentage");
      if (res.success && res.data) {
        setPledgePercentage(Number(res.data.value));
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      // Silent fail - use default
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatus({ type: null, message: '' });
      const res = await SettingsAPI.update({
        key: "pledgeRewardPercentage",
        value: pledgePercentage
      });
      if (res.success) {
        setStatus({ type: 'success', message: 'Settings updated successfully!' });
        setTimeout(() => setStatus({ type: null, message: '' }), 3000);
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Loading Settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen bg-gray-50/30">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[24px] shadow-xl shadow-blue-200">
            <Settings size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Configuration</h1>
            <p className="text-gray-500 font-bold uppercase text-[11px] tracking-[0.2em] mt-1">Global platform parameters</p>
          </div>
        </div>

        {status.type && (
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300 ${
            status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            {status.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            <span className="font-bold text-sm tracking-tight">{status.message}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Setting Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-2xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
            
            <div className="flex items-center gap-5 mb-10 relative">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-[20px] flex items-center justify-center border border-amber-100 shadow-sm">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 leading-none">Traffic Challan Rewards</h3>
                <p className="text-gray-400 text-[11px] font-black uppercase tracking-widest mt-2">Pledge & Drive Safely System</p>
              </div>
            </div>

            <div className="space-y-6 relative">
              <label className="block group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-gray-700 uppercase tracking-[0.2em] ml-1">Pledge Discount Percentage</span>
                  <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Active Rate</span>
                </div>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Percent size={24} />
                  </div>
                  <input
                    type="number"
                    value={pledgePercentage}
                    onChange={(e) => setPledgePercentage(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-full h-20 bg-gray-50 hover:bg-gray-100/50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-[24px] px-16 text-3xl font-black text-gray-900 transition-all outline-none"
                    placeholder="40"
                  />
                </div>
                <div className="mt-4 flex items-start gap-3 px-2">
                  <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                    This percentage is applied to the total challan amount when a user completes the "Drive Safely Pledge". Changes are applied in real-time.
                  </p>
                </div>
              </label>
            </div>

            <div className="mt-12 pt-10 border-t border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Cloud Sync Active</span>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full md:w-auto bg-gray-900 hover:bg-blue-600 text-white px-12 py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-gray-300 hover:shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                Commit Changes
              </button>
            </div>
          </div>
        </div>

        {/* Analytics/Summary Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-10 rounded-[40px] text-white shadow-2xl shadow-blue-900/10 border border-white/5 relative overflow-hidden">
             {/* Decorative element */}
             <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mb-16 -mr-16" />
             
            <h4 className="text-2xl font-black mb-6 leading-tight relative">Current Impact Analysis</h4>
            <div className="space-y-8 relative">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-2">Pledge Success Reward</p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black tracking-tighter">{pledgePercentage}</span>
                  <span className="text-2xl font-black text-blue-400 mb-1.5">%</span>
                </div>
              </div>
              
              <div className="space-y-4 pt-6 border-t border-white/10">
                <div className="bg-white/5 p-5 rounded-[24px] border border-white/5 backdrop-blur-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-2">Business Logic</p>
                  <p className="text-xs font-bold text-gray-300 leading-relaxed">
                    A reward of {pledgePercentage}% means users pay {100 - pledgePercentage}% of the base challan amount.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-amber-400 px-2">
                  <AlertCircle size={14} />
                  Higher rewards drive volume
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 p-8 rounded-[40px] border border-blue-100/50 group hover:bg-blue-50 transition-colors duration-500">
             <div className="flex items-center gap-4 mb-4">
               <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600">
                  <CheckCircle2 size={24} />
               </div>
               <span className="font-black text-sm uppercase tracking-widest text-blue-900">System Ready</span>
             </div>
            <p className="text-blue-700/70 text-[11px] font-bold leading-relaxed px-1">
              All infrastructure connections are active. Changing settings here will affect the primary mobile application and the user settlement portal instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettings;
