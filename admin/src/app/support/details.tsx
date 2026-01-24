import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SupportAPI, type SupportTicket, type AddSupportAnswer } from '../../config/api';
import { useApiAbortController } from '../../config/api';

const Details: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string>('');

  // Answer form state
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const abortController = useApiAbortController();

  useEffect(() => {
    if (id) {
      loadTicket();
    }
  }, [id]);

  const loadTicket = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError('');

      const response = await SupportAPI.getById(id, abortController.signal);
      if (response.success) {
        setTicket(response.data);
      } else {
        setError('Failed to load ticket');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load ticket');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: SupportTicket['status']) => {
    if (!ticket) return;

    try {
      setUpdating(true);
      const response = await SupportAPI.updateStatus(ticket.id, newStatus);
      if (response.success) {
        setTicket({ ...ticket, status: newStatus });
      } else {
        setError('Failed to update status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const submitAnswer = async () => {
    if (!ticket || !answerText.trim()) return;

    try {
      setSubmittingAnswer(true);

      const answerData: AddSupportAnswer = {
        answer: answerText.trim(),
        answeredBy: 'Admin', // You can get this from auth context
        answeredByType: 'ADMIN'
      };

      const response = await SupportAPI.addAnswer(ticket.id, answerData);
      if (response.success) {
        setTicket(response.data);
        setAnswerText('');
        setShowAnswerForm(false);
      } else {
        setError('Failed to add answer');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add answer');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const deleteTicket = async () => {
    if (!ticket) return;

    if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return;

    try {
      const response = await SupportAPI.remove(ticket.id);
      if (response.success) {
        navigate('/admin/support');
      } else {
        setError('Failed to delete ticket');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete ticket');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESOLVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CLOSED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button
          onClick={() => navigate('/admin/support')}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Back to Support
        </button>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          Ticket not found
        </div>
        <button
          onClick={() => navigate('/admin/support')}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Back to Support
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/support')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Support Ticket Details</h1>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={loadTicket}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Refresh
          </button>
          <button
            onClick={deleteTicket}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Delete Ticket
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Ticket Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{ticket.title}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Ticket ID: {ticket.id}</span>
              <span>•</span>
              <span>User: {ticket.userId}</span>
              <span>•</span>
              <span>Type: {ticket.userType}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={ticket.status}
              onChange={(e) => updateStatus(e.target.value as SupportTicket['status'])}
              disabled={updating}
              className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ticket.status)}`}
            >
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <p className="mt-1 text-sm text-gray-900">{ticket.category}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Purpose</label>
            <p className="mt-1 text-sm text-gray-900">{ticket.purpose}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Created</label>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(ticket.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Answers ({ticket.answers?.length || 0})
          </h3>
          <button
            onClick={() => setShowAnswerForm(!showAnswerForm)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            {showAnswerForm ? 'Cancel' : 'Add Answer'}
          </button>
        </div>

        {/* Add Answer Form */}
        {showAnswerForm && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="text-md font-medium text-gray-900 mb-3">Add New Answer</h4>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your answer here..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
              disabled={submittingAnswer}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowAnswerForm(false);
                  setAnswerText('');
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                disabled={submittingAnswer}
              >
                Cancel
              </button>
              <button
                onClick={submitAnswer}
                disabled={submittingAnswer || !answerText.trim()}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {submittingAnswer ? 'Submitting...' : 'Submit Answer'}
              </button>
            </div>
          </div>
        )}

        {/* Answers List */}
        {ticket.answers && ticket.answers.length > 0 ? (
          <div className="space-y-4">
            {ticket.answers.map((answer) => (
              <div key={answer.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {answer.answeredBy.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{answer.answeredBy}</p>
                      <p className="text-xs text-gray-500">{answer.answeredByType}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(answer.answeredAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{answer.answer}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No answers yet. Be the first to respond!</p>
          </div>
        )}
      </div>

      {/* Ticket Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{ticket.answers?.length || 0}</div>
          <div className="text-sm text-gray-600">Total Answers</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {Math.floor((new Date().getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
          </div>
          <div className="text-sm text-gray-600">Days Open</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className={`text-2xl font-bold ${
            ticket.status === 'CLOSED' ? 'text-gray-600' :
            ticket.status === 'RESOLVED' ? 'text-green-600' :
            ticket.status === 'IN_PROGRESS' ? 'text-blue-600' : 'text-yellow-600'
          }`}>
            {ticket.status.replace('_', ' ')}
          </div>
          <div className="text-sm text-gray-600">Current Status</div>
        </div>
      </div>
    </div>
  );
};

export default Details;
