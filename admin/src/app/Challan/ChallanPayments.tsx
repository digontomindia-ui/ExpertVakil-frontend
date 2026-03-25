"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ChallanAPI, type ChallanPayment } from "../../config/api";
import { format } from "date-fns";

export default function ChallanPayments() {
    const [payments, setPayments] = useState<ChallanPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                setLoading(true);
                const res = await ChallanAPI.list();
                if (res.success) {
                    setPayments(res.data);
                }
            } catch (err: any) {
                setError(err.message || "Failed to fetch challan payments");
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, []);

    const filteredPayments = useMemo(() => {
        return payments.filter(p => 
            p.vehicleNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.challanNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.phone?.includes(searchQuery)
        );
    }, [payments, searchQuery]);

    const formatDate = (date: any) => {
        if (!date) return "N/A";
        try {
            const d = new Date(date);
            return format(d, "MMM dd, yyyy HH:mm");
        } catch {
            return "Invalid Date";
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this payment record?")) return;
        try {
            setDeletingId(id);
            const res = await ChallanAPI.remove(id);
            if (res.success) {
                setPayments(prev => prev.filter(p => p.id !== id));
            }
        } catch (err: any) {
            alert(err.message || "Failed to delete payment record");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Challan Payments</h1>
                        <p className="text-gray-500 mt-1">Monitor and manage all challan payments made via Razorpay</p>
                    </div>
                    <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100">
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Payments</span>
                        <p className="text-2xl font-black text-blue-600">₹{payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                        <div className="relative max-w-md">
                            <input
                                type="text"
                                placeholder="Search by Vehicle, Name, or Challan #"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                            />
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">User Details</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Vehicle & Challan</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Amount</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Razorpay IDs</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
                                            <p className="mt-4 text-sm font-bold text-gray-400">Loading payments...</p>
                                        </td>
                                    </tr>
                                ) : filteredPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center text-gray-400 font-medium">
                                            No payments found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPayments.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900">{p.name}</span>
                                                    <span className="text-xs text-gray-500 font-medium">{p.phone}</span>
                                                    <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">{p.city}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-black inline-block w-fit mb-1">{p.vehicleNumber}</span>
                                                    <span className="text-xs text-gray-400 font-mono italic">{p.challanNumber}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 underline decoration-blue-200 decoration-4">
                                                <span className="text-lg font-black text-gray-900">₹{p.amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] text-gray-400 font-mono">ORD: {p.orderId}</span>
                                                    <span className="text-[10px] text-gray-400 font-mono">PAY: {p.paymentId}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-bold text-gray-600">{formatDate(p.createdAt)}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <button 
                                                    onClick={() => handleDelete(p.id)}
                                                    disabled={deletingId === p.id}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {deletingId === p.id ? (
                                                        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
