import React, { useState, useEffect } from 'react';
import { DeleteRequestsAPI, type DeleteRequest } from '../../../config/api';
import { useAuth } from '../../../config/auth';

const DeleteRequestsPage: React.FC = () => {
    const [requests, setRequests] = useState<DeleteRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [selectedRequest, setSelectedRequest] = useState<DeleteRequest | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState<'approved' | 'rejected' | null>(null);

    const abortControllerRef = React.useRef<AbortController | null>(null);
    const { user } = useAuth(); // To get the admin ID for reviews

    useEffect(() => {
        loadRequests();
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [statusFilter]);

    const loadRequests = async () => {
        // Cancel previous request if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new controller for this request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            console.log('Fetching delete requests with filter:', statusFilter);
            setLoading(true);
            setError('');

            const response = await DeleteRequestsAPI.getAll(
                { status: statusFilter || undefined },
                controller.signal
            );
            console.log('Delete requests response:', response);

            if (response.success) {
                setRequests(response.data);
            } else {
                throw new Error('Failed to load delete requests');
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Error fetching delete requests:', err);
                setError(err.message || 'Error loading requests');
            }
        } finally {
            // Only update loading state if this is still the active request
            if (abortControllerRef.current === controller) {
                setLoading(false);
            }
        }
    };

    const handleReview = async () => {
        if (!selectedRequest || !showReviewModal) return;

        try {
            setIsSubmitting(true);

            // Determine user identifier (fallback to 'Admin' if ID not available)
            const reviewerId = user?.id || 'admin';

            const response = await DeleteRequestsAPI.review(selectedRequest.id, {
                status: showReviewModal,
                adminNotes: reviewNotes,
                reviewedBy: reviewerId
            });

            if (response.success) {
                // Update local list
                setRequests(requests.map(req =>
                    req.id === selectedRequest.id ? { ...req, ...response.data } : req
                ));

                // Update selected if needed
                if (selectedRequest.id === response.data.id) {
                    setSelectedRequest(response.data);
                }

                closeModal();
            } else {
                alert('Failed to update request status');
            }
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setShowReviewModal(null);
        setReviewNotes('');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-red-100 text-red-800'; // Red because it's destructive (deleted)
            case 'rejected': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Account Deletion Requests</h1>
                <button
                    onClick={loadRequests}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                    disabled={loading}
                >
                    {loading ? 'Refreshing...' : 'Refresh List'}
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700">Filter Status:</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="">All Requests</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved (Deleted)</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List Column */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Requests ({requests.length})</h2>
                        </div>

                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                <p className="mt-4 text-gray-500">Loading...</p>
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No delete requests found.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                                {requests.map((req) => (
                                    <div
                                        key={req.id}
                                        onClick={() => setSelectedRequest(req)}
                                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedRequest?.id === req.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="text-sm font-bold text-gray-900">
                                                        {req.userName || 'Unknown User'}
                                                    </h3>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(req.status)}`}>
                                                        {req.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">{req.userEmail}</p>
                                                <p className="text-xs text-gray-500">{req.userPhone}</p>
                                                <p className="text-sm text-gray-800 mt-2 font-medium">
                                                    Reason: <span className="font-normal">{req.reason}</span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs text-gray-400">
                                                    {req.requestedAt
                                                        ? new Date(
                                                            typeof req.requestedAt === 'string' ? req.requestedAt : (req.requestedAt as any)._seconds * 1000
                                                        ).toLocaleDateString()
                                                        : 'Date unknown'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail Column */}
                <div className="lg:col-span-1">
                    {selectedRequest ? (
                        <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                                Request Details
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-uppercase text-gray-500 font-bold tracking-wider">Status</label>
                                    <div className="mt-1">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(selectedRequest.status)}`}>
                                            {selectedRequest.status}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-uppercase text-gray-500 font-bold tracking-wider">User Info</label>
                                    <p className="text-sm font-medium mt-1">{selectedRequest.userName}</p>
                                    <p className="text-sm text-gray-600">{selectedRequest.userEmail}</p>
                                    <p className="text-sm text-gray-600">{selectedRequest.userPhone}</p>
                                    <p className="text-xs text-gray-400 mt-1">ID: {selectedRequest.userId}</p>
                                </div>

                                <div>
                                    <label className="text-xs font-uppercase text-gray-500 font-bold tracking-wider">Reason</label>
                                    <p className="text-sm text-gray-800 mt-1 bg-gray-50 p-2 rounded border">
                                        {selectedRequest.reason}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs font-uppercase text-gray-500 font-bold tracking-wider">Timeline</label>
                                    <div className="mt-1 text-sm text-gray-600 space-y-1">
                                        <p>Requested: {selectedRequest.requestedAt ? new Date(
                                            typeof selectedRequest.requestedAt === 'string' ? selectedRequest.requestedAt : (selectedRequest.requestedAt as any)._seconds * 1000
                                        ).toLocaleString() : 'N/A'}</p>
                                        {selectedRequest.reviewedAt && (
                                            <p>Reviewed: {new Date(
                                                typeof selectedRequest.reviewedAt === 'string' ? selectedRequest.reviewedAt : (selectedRequest.reviewedAt as any)._seconds * 1000
                                            ).toLocaleString()}</p>
                                        )}
                                    </div>
                                </div>

                                {selectedRequest.adminNotes && (
                                    <div>
                                        <label className="text-xs font-uppercase text-gray-500 font-bold tracking-wider">Admin Notes</label>
                                        <p className="text-sm text-gray-800 mt-1 bg-yellow-50 p-2 rounded border border-yellow-100">
                                            {selectedRequest.adminNotes}
                                        </p>
                                    </div>
                                )}

                                {/* Actions */}
                                {selectedRequest.status === 'pending' && (
                                    <div className="pt-4 border-t mt-4 flex gap-3">
                                        <button
                                            onClick={() => setShowReviewModal('approved')}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium shadow-sm"
                                        >
                                            Approve & Delete
                                        </button>
                                        <button
                                            onClick={() => setShowReviewModal('rejected')}
                                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg text-sm font-medium"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400 border-2 border-dashed border-gray-200">
                            <p>Select a request from the list to view details and take action.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
                        <h3 className={`text-xl font-bold mb-2 ${showReviewModal === 'approved' ? 'text-red-600' : 'text-gray-800'}`}>
                            {showReviewModal === 'approved' ? 'Confirm Account Deletion' : 'Reject Deletion Request'}
                        </h3>

                        <p className="text-gray-600 mb-4 text-sm">
                            {showReviewModal === 'approved'
                                ? 'Are you sure you want to approve this request? The user account will be permanently marked for deletion. This action cannot be undone.'
                                : 'You are about to reject this deletion request. The user account will remain active.'
                            }
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {'Admin Notes (Optional)'}
                            </label>
                            <textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="Add internal notes about this decision..."
                                rows={3}
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReview}
                                disabled={isSubmitting}
                                className={`px-4 py-2 text-white rounded-lg text-sm font-medium shadow-sm ${showReviewModal === 'approved'
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-gray-800 hover:bg-gray-900'
                                    }`}
                            >
                                {isSubmitting ? 'Processing...' : (showReviewModal === 'approved' ? 'Confirm Delete' : 'Reject Request')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeleteRequestsPage;
