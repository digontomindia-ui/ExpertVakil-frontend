import React, { useState } from 'react';
import { SupportAPI, type AddSupportAnswer } from '../../config/api';

interface AnswerProps {
  ticketId: string;
  onAnswerAdded?: (updatedTicket?: any) => void;
  onClose?: () => void;
}

const Answer: React.FC<AnswerProps> = ({ ticketId, onAnswerAdded, onClose }) => {
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const submitAnswer = async () => {
    if (!answerText.trim()) {
      setError('Please enter an answer');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const answerData: AddSupportAnswer = {
        answer: answerText.trim(),
        answeredBy: 'Admin', // You can get this from auth context
        answeredByType: 'ADMIN'
      };

      const response = await SupportAPI.addAnswer(ticketId, answerData);
      if (response.success) {
        setAnswerText('');
        onAnswerAdded?.(response.data); // Pass the updated ticket data
        onClose?.();
      } else {
        setError('Failed to add answer');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add answer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Add Answer</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Answer
          </label>
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Type your detailed answer here..."
            rows={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={submitting}
          />
          <p className="text-xs text-gray-500 mt-1">
            Provide a clear and helpful response to the user's query
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          {onClose && (
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              disabled={submitting}
            >
              Cancel
            </button>
          )}
          <button
            onClick={submitAnswer}
            disabled={submitting || !answerText.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {submitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{submitting ? 'Submitting...' : 'Submit Answer'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Answer;
