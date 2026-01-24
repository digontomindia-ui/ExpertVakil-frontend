import React, { useState, useEffect } from 'react';
import { SupportAPI, type SupportTicket } from '../../config/api';
import { useApiAbortController } from '../../config/api';
import Answer from './answer';

const Viewall: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState({
    status: '',
    userType: '',
    category: '',
    search: ''
  });
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [answeringTicketId, setAnsweringTicketId] = useState<string>('');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const abortController = useApiAbortController();

  useEffect(() => {
    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      loadTickets();
    }, 100);

    return () => clearTimeout(timer);
  }, [filters]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      if (!loading) { // Only refresh if not already loading
        console.log('Auto-refreshing tickets...');
        loadTickets();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loading, filters, autoRefreshEnabled]); // Depend on loading, filters, and autoRefreshEnabled

  const loadTickets = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError('');

      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.userType) params.userType = filters.userType;
      if (filters.category) params.category = filters.category;

      console.log('Making API call with params:', params);

      const response = await SupportAPI.getAll(params, abortController.signal);
      console.log('API Response:', response);

      if (response.success) {
        console.log('Raw response data:', response.data);

        // Filter and transform tickets to handle mixed data formats
        const transformedTickets = response.data
          .filter((item: any) => {
            // Keep items that have the new format (userId) or can be transformed
            return item.userId || (item.email && item.message);
          })
          .map((item: any) => {
            // Transform old format to new format if needed
            if (item.userId) {
              // Already in new format
              return {
                ...item,
                createdAt: item.createdAt?._seconds
                  ? new Date(item.createdAt._seconds * 1000).toISOString()
                  : item.createdAt,
                updatedAt: item.updatedAt?._seconds
                  ? new Date(item.updatedAt._seconds * 1000).toISOString()
                  : item.updatedAt,
              };
            } else {
              // Transform old format to new format
              return {
                id: item.id,
                userId: item.email,
                userType: 'CLIENT' as const,
                purpose: 'SUPPORT',
                category: 'GENERAL',
                title: `Contact from ${item.name || 'Unknown'}`,
                description: `Phone: ${item.phone || 'N/A'}\n\n${item.message}`,
                status: (item.status === 'new' ? 'PENDING' : item.status || 'PENDING') as SupportTicket['status'],
                answers: [],
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
              };
            }
          });

        console.log('Transformed tickets:', transformedTickets.length);
        setTickets(transformedTickets);
        setLastRefresh(new Date());
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (err: any) {
      console.error('Error loading tickets:', err);

      if (err.name !== 'AbortError') {
        // Retry logic for network errors
        if (retryCount < 3 && (err.message?.includes('fetch') || err.message?.includes('network'))) {
          console.log(`Retrying... Attempt ${retryCount + 1}/3`);
          setTimeout(() => loadTickets(retryCount + 1), 1000 * (retryCount + 1));
          return;
        }

        setError(err.message || 'Failed to load tickets');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (ticketId: string, newStatus: SupportTicket['status']) => {
    try {
      // Find the ticket to check if it's old or new format
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) return;

      // For now, only update status for new format tickets (those with userId)
      // Old format tickets (without userId) can't be updated via API yet
      if (ticket.userId) {
        const response = await SupportAPI.updateStatus(ticketId, newStatus);
        if (response.success) {
          // Update local state
          setTickets(tickets.map(ticket =>
            ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
          ));
          if (selectedTicket && selectedTicket.id === ticketId) {
            setSelectedTicket({ ...selectedTicket, status: newStatus });
          }
        }
      } else {
        // For old format tickets, just update locally (no API update available)
        setTickets(tickets.map(ticket =>
          ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
        ));
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: newStatus });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const deleteTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;

    try {
      // Find the ticket to check if it's old or new format
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) return;

      // For now, only delete new format tickets (those with userId) via API
      // Old format tickets might need different endpoint
      if (ticket.userId) {
        const response = await SupportAPI.remove(ticketId);
        if (response.success) {
          setTickets(tickets.filter(ticket => ticket.id !== ticketId));
          if (selectedTicket && selectedTicket.id === ticketId) {
            setSelectedTicket(null);
          }
        }
      } else {
        // For old format tickets, just remove locally (no API delete available)
        setTickets(tickets.filter(ticket => ticket.id !== ticketId));
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(null);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete ticket');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(filters.search.toLowerCase()) ||
    ticket.description.toLowerCase().includes(filters.search.toLowerCase()) ||
    ticket.userId.toLowerCase().includes(filters.search.toLowerCase())
  );

  const handleAnswerTicket = (ticketId: string) => {
    setAnsweringTicketId(ticketId);
    setShowAnswerModal(true);
  };

  const handleAnswerAdded = (updatedTicket?: any) => {
    if (updatedTicket) {
      // Update the tickets array with the updated ticket
      setTickets(tickets.map(ticket =>
        ticket.id === updatedTicket.id ? {
          ...updatedTicket,
          createdAt: updatedTicket.createdAt?._seconds
            ? new Date(updatedTicket.createdAt._seconds * 1000).toISOString()
            : updatedTicket.createdAt,
          updatedAt: updatedTicket.updatedAt?._seconds
            ? new Date(updatedTicket.updatedAt._seconds * 1000).toISOString()
            : updatedTicket.updatedAt,
        } : ticket
      ));

      // Update the selected ticket if it's the one being answered
      if (selectedTicket && selectedTicket.id === answeringTicketId) {
        setSelectedTicket({
          ...updatedTicket,
          createdAt: updatedTicket.createdAt?._seconds
            ? new Date(updatedTicket.createdAt._seconds * 1000).toISOString()
            : updatedTicket.createdAt,
          updatedAt: updatedTicket.updatedAt?._seconds
            ? new Date(updatedTicket.updatedAt._seconds * 1000).toISOString()
            : updatedTicket.updatedAt,
        });
      }
    } else {
      // Fallback: refresh all tickets if no updated ticket data provided
      loadTickets();
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <div className="flex items-center space-x-2">
            {autoRefreshEnabled && (
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                Auto-refresh ON
              </span>
            )}
            {lastRefresh && (
              <span className="text-xs text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            className={`px-3 py-1 rounded text-xs ${
              autoRefreshEnabled
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={autoRefreshEnabled ? 'Disable auto-refresh' : 'Enable auto-refresh'}
          >
            {autoRefreshEnabled ? '🔄' : '⏸️'}
          </button>
          <button
            onClick={() => loadTickets()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search tickets..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={filters.userType}
            onChange={(e) => setFilters({ ...filters, userType: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All User Types</option>
            <option value="CLIENT">Client</option>
            <option value="LAWYER">Lawyer</option>
            <option value="ADMIN">Admin</option>
            <option value="SUBADMIN">Sub-Admin</option>
          </select>

          <input
            type="text"
            placeholder="Category..."
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Tickets ({filteredTickets.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading tickets...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No tickets found
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      selectedTicket?.id === ticket.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {ticket.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {ticket.description.length > 100
                            ? `${ticket.description.substring(0, 100)}...`
                            : ticket.description
                          }
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <span>{ticket.userType}</span>
                          <span className="mx-2">•</span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                          <span className="mx-2">•</span>
                          <span>{Array.isArray(ticket.answers) ? ticket.answers.length : 0} answers</span>
                          {!ticket.userId && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="text-orange-600 font-medium">Legacy</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTicket(ticket.id);
                          }}
                          className="mt-2 text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="lg:col-span-1">
          {selectedTicket ? (
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Ticket Details
                </h3>
                <button
                  onClick={() => handleAnswerTicket(selectedTicket.id)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Answer Ticket
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => updateStatus(selectedTicket.id, e.target.value as SupportTicket['status'])}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">User ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTicket.userId}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">User Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTicket.userType}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTicket.category}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>

                {Array.isArray(selectedTicket.answers) && selectedTicket.answers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Answers ({selectedTicket.answers.length})
                    </label>
                    <div className="space-y-3">
                      {selectedTicket.answers.map((answer: any, index: number) => (
                        <div key={answer.id || index} className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-900">{answer.answer}</p>
                          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                            <span>{answer.answeredByType || 'ADMIN'}: {answer.answeredBy || 'Admin'}</span>
                            <span>
                              {answer.answeredAt
                                ? (typeof answer.answeredAt === 'string'
                                    ? new Date(answer.answeredAt).toLocaleDateString()
                                    : new Date(answer.answeredAt._seconds * 1000).toLocaleDateString())
                                : 'Unknown date'
                              }
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Select a ticket to view details
            </div>
          )}
        </div>
      </div>

      {/* Answer Modal */}
      {showAnswerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-4xl w-full mx-4">
            <Answer
              ticketId={answeringTicketId}
              onAnswerAdded={handleAnswerAdded}
              onClose={() => setShowAnswerModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Viewall;
