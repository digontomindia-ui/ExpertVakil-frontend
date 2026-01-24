
import { ArrowLeft, Printer, Share2, Mail, Shield, Lock, Eye, FileText, Users, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Props = {
    companyName?: string;
    lastUpdated?: string;
    contactEmail?: string;
    website?: string;
};

export default function PrivacyPolicyLegalNetwork({
    companyName = "Legal Network",
    lastUpdated = "4th December 2025",
    contactEmail = "official.legalnetwork@gmail.com",
    website = "https://legalnetwork.in",
}: Props) {
    const navigate = useNavigate();

    const sections = [
        {
            id: "info-collect",
            title: "1. Information We Collect",
            icon: <FileText className="w-5 h-5 text-blue-600" />,
            content: (
                <div className="space-y-6">
                    <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            A. Information You Provide
                        </h4>
                        <p className="text-gray-600 mb-3 text-sm">We collect information when you register, update your profile, or use communication features:</p>
                        <ul className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
                            {[
                                "Full Name", "Phone Number", "Email Address", "Gender",
                                "Professional Details", "Law Firm Information", "Profile Photos",
                                "Uploaded Documents", "Case & Diary Entries", "Messages & Content"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                            <h4 className="font-semibold text-gray-900 mb-3 text-sm">B. Automatically Collected</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400 mt-1">•</span>
                                    Device information (model, OS, ID)
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400 mt-1">•</span>
                                    Log data (IP, access times, crashes)
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400 mt-1">•</span>
                                    Usage data & search activity
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400 mt-1">•</span>
                                    Cookies & tracking technologies
                                </li>
                            </ul>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                            <h4 className="font-semibold text-gray-900 mb-3 text-sm">C. External Sources</h4>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">From eCourts</p>
                                    <p className="text-sm text-gray-600">We access publicly available case information to autofill details. We do not modify official data.</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">From Expert Vakeel</p>
                                    <p className="text-sm text-gray-600">Your profile may appear on our co-owned platform to improve visibility. Only public details are shared.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: "usage",
            title: "2. How We Use Your Information",
            icon: <Users className="w-5 h-5 text-indigo-600" />,
            content: (
                <ul className="grid sm:grid-cols-2 gap-3">
                    {[
                        "Create and manage your account",
                        "Display profile for networking",
                        "Enable messaging & media sharing",
                        "Provide legal news and updates",
                        "Sync case info from eCourts",
                        "Show profile on Expert Vakeel",
                        "Improve performance & support",
                        "Ensure safety & fraud prevention",
                        "Comply with legal obligations"
                    ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            <span className="text-indigo-500 mt-0.5">✓</span>
                            {item}
                        </li>
                    ))}
                </ul>
            )
        },
        {
            id: "sharing",
            title: "3. How We Share Your Information",
            icon: <Share2 className="w-5 h-5 text-purple-600" />,
            content: (
                <div className="space-y-4">
                    <p className="text-sm font-medium text-purple-900 bg-purple-50 p-3 rounded-lg border border-purple-100">
                        We do not sell your personal data. We only share information in specific scenarios:
                    </p>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {[
                            { title: "With Other Users", desc: "Public profile details and content shared in chats/groups." },
                            { title: "Service Providers", desc: "Trusted partners for hosting, analytics, and payments." },
                            { title: "Legal Compliance", desc: "When required by law or to protect rights and safety." }
                        ].map((card, i) => (
                            <div key={i} className="p-4 rounded-xl border border-gray-100 hover:border-purple-100 transition-colors">
                                <h4 className="font-semibold text-gray-900 mb-2 text-sm">{card.title}</h4>
                                <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )
        },
        {
            id: "security",
            title: "4. Data Security & Retention",
            icon: <Shield className="w-5 h-5 text-green-600" />,
            content: (
                <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-green-600" />
                            Security Measures
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                Encrypted communication (HTTPS/SSL)
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                Secure servers and firewalls
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                Access control and authentication
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                Regular security audits
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Eye className="w-4 h-4 text-green-600" />
                            Retention Policy
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            We retain your information as long as your account is active or required for service provision, legal compliance, and security. You may request data deletion anytime.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: "rights",
            title: "5. Your Rights & Controls",
            icon: <Globe className="w-5 h-5 text-orange-600" />,
            content: (
                <div className="bg-orange-50/50 rounded-xl p-5 border border-orange-100">
                    <p className="text-sm text-gray-600 mb-4">You have the right to:</p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            "Access your data", "Update profile", "Delete account",
                            "Control visibility", "Stop notifications", "Request data copy"
                        ].map((right, i) => (
                            <span key={i} className="px-3 py-1 bg-white border border-orange-200 rounded-full text-xs font-medium text-orange-700 shadow-sm">
                                {right}
                            </span>
                        ))}
                    </div>
                    <p className="mt-4 text-sm text-gray-600">
                        To exercise these rights, contact us at <a href={`mailto:${contactEmail}`} className="text-orange-600 hover:underline font-medium">{contactEmail}</a>
                    </p>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.print()}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all"
                            title="Print Policy"
                        >
                            <Printer className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                // You might want to add a toast notification here
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all"
                            title="Copy Link"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Title Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-2 bg-blue-50 rounded-xl mb-4">
                        <Shield className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">Privacy Policy</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        {companyName} is committed to protecting the privacy of lawyers, law firms, and all users who use our services.
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                        <span>Last Updated: {lastUpdated}</span>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-6">
                    {sections.map((section) => (
                        <section
                            key={section.id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
                        >
                            <div className="p-6 sm:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gray-50 rounded-lg">
                                        {section.icon}
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                                </div>
                                {section.content}
                            </div>
                        </section>
                    ))}

                    {/* Additional Info Cards */}
                    <div className="grid sm:grid-cols-2 gap-6">
                        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                            <h3 className="font-bold text-gray-900 mb-4">Children's Privacy</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {companyName} is not intended for individuals under 18 years of age. We do not knowingly collect information from children.
                            </p>
                        </section>

                        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                            <h3 className="font-bold text-gray-900 mb-4">Third-Party Links</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                The app may include links to external websites like eCourts. We are not responsible for their privacy practices.
                            </p>
                        </section>
                    </div>

                    {/* Contact Section */}
                    <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-8 text-center text-white">
                        <h2 className="text-2xl font-bold mb-4">Questions or Concerns?</h2>
                        <p className="text-blue-100 mb-8 max-w-xl mx-auto">
                            If you have any questions about our privacy policy or how we handle your data, please don't hesitate to reach out.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a
                                href={`mailto:${contactEmail}`}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
                            >
                                <Mail className="w-4 h-4" />
                                Contact Support
                            </a>
                            <a
                                href={website}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/20 text-white border border-white/20 rounded-xl font-semibold hover:bg-blue-500/30 transition-colors"
                            >
                                <Globe className="w-4 h-4" />
                                Visit Website
                            </a>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <footer className="mt-12 text-center text-sm text-gray-500">
                    <p>© {new Date().getFullYear()} {companyName}. All rights reserved.</p>
                </footer>
            </main>
        </div>
    );
}
