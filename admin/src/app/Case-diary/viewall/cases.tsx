import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { CasesAPI, type Case } from "../../../config/api";

type SortOption = "recent" | "name" | "status" | "court";

export default function CasesDirectory() {
  const [items, setItems] = useState<Case[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Load cases on component mount
  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      // For admin, we might want to get all cases or cases by current user
      // For now, let's get upcoming hearings as a sample
      const response = await CasesAPI.getUpcomingHearings({ limit: 50 });
      setItems(response.data);
    } catch (err: any) {
      setError(err?.message || "Failed to load cases");
    } finally {
      setLoading(false);
    }
  };

  // Filtered and sorted cases
  const filteredAndSortedCases = useMemo(() => {
    let filtered = items.filter((item) => {
      const matchesSearch =
        item.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partitionarName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.respondentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.courtName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort cases
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.partitionarName.localeCompare(b.partitionarName);
        case "status":
          return a.status.localeCompare(b.status);
        case "court":
          return a.courtName.localeCompare(b.courtName);
        case "recent":
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return filtered;
  }, [items, searchTerm, sortBy, statusFilter]);

  const handleDelete = async (caseId: string) => {
    if (!window.confirm("Are you sure you want to delete this case?")) return;

    try {
      await CasesAPI.remove(caseId);
      setItems((prev) => prev.filter((item) => item.id !== caseId));
    } catch (err: any) {
      alert(`Failed to delete: ${err?.message || "Unknown error"}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Case Diary</h1>
            <p className="mt-1 text-sm text-slate-600">Manage legal cases and hearings</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Case Diary</h1>
            <p className="mt-1 text-sm text-slate-600">Manage legal cases and hearings</p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Cases</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadCases}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Case Diary</h1>
            <p className="mt-1 text-sm text-slate-600">Manage legal cases and hearings</p>
          </div>
          <Link
            to="/cases/new"
            className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            + Add New Case
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            >
              <option value="recent">Recent</option>
              <option value="name">Petitioner Name</option>
              <option value="status">Status</option>
              <option value="court">Court</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="ADJOURNED">Adjourned</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadCases}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedCases.map((caseItem) => (
            <CaseCard
              key={caseItem.id}
              case={caseItem}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {filteredAndSortedCases.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No cases found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || statusFilter ? "Try adjusting your filters" : "Get started by adding your first case"}
            </p>
            <Link
              to="/cases/new"
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
              Add New Case
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function CaseCard({ case: caseItem, onDelete }: {
  case: Case;
  onDelete: (id: string) => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      case "ADJOURNED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(caseItem.status)}`}>
              {caseItem.status}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-slate-900 truncate">
            Case #{caseItem.caseNumber}
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            {caseItem.partitionarName} vs {caseItem.respondentName}
          </p>

          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Court:</span>
              <span className="font-medium">{caseItem.courtName}</span>
            </div>
            <div className="flex justify-between">
              <span>Judge:</span>
              <span className="font-medium">{caseItem.judgeName}</span>
            </div>
            <div className="flex justify-between">
              <span>Next Hearing:</span>
              <span className="font-medium">{formatDate(caseItem.nextHearingDate)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Link
          to={`/cases/${caseItem.id}`}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View
        </Link>
        <Link
          to={`/cases/${caseItem.id}/edit`}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Edit
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(caseItem.id);
          }}
          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
