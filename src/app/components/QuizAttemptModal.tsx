/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { FiClock, FiCalendar, FiPercent, FiX } from 'react-icons/fi';

interface QuizAttemptDetail {
  id: string;
  taker_name: string;
  quiz_title: string;
  score: number;
  total_questions: number;
  percentage_score: number;
  time_taken: number;
  completed_at: string;
  questions_data: any[];
  user_answers: Record<string, any>;
  question_timings: Record<string, number>;
}

interface QuizAttemptModalProps {
  attemptId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuizAttemptModal({
  attemptId,
  isOpen,
  onClose,
}: QuizAttemptModalProps) {
  const [attempt, setAttempt] = useState<QuizAttemptDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId || !isOpen) {
      setAttempt(null);
      setError(null);
      return;
    }

    const fetchAttemptDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('quiz_attempts')
          .select(
            `
            id,
            taker_name,
            quiz_title,
            score,
            total_questions,
            percentage_score,
            time_taken,
            completed_at,
            questions_data,
            user_answers,
            question_timings
          `
          )
          .eq('id', attemptId)
          .single();

        if (error) throw error;
        setAttempt(data);
      } catch (err: any) {
        console.error('Error fetching attempt details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAttemptDetails();
  }, [attemptId, isOpen]);

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const renderQuestionAnalysis = (question: any, questionIndex: number) => {
    if (!attempt) return null;

    const userAnswer = attempt.user_answers[questionIndex];
    const timing = attempt.question_timings[questionIndex];

    let isCorrect = false;
    switch (question.type) {
      case 'multiple-choice':
      case 'short-answer':
      case 'true-false':
      case 'fill-in-the-blanks':
        isCorrect =
          String(userAnswer).toLowerCase() ===
          String(question.correctAnswer).toLowerCase();
        break;
      case 'multiple-select':
        if (
          Array.isArray(userAnswer) &&
          Array.isArray(question.correctAnswers)
        ) {
          const sortedUserAnswers = [...userAnswer].sort();
          const sortedCorrectAnswers = [...question.correctAnswers].sort();
          isCorrect =
            JSON.stringify(sortedUserAnswers) ===
            JSON.stringify(sortedCorrectAnswers);
        }
        break;
    }

    return (
      <div
        key={questionIndex}
        className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-4"
      >
        <div className="flex justify-between items-start mb-4">
          <h4 className="font-semibold text-[#2f404a]">
            Question {questionIndex + 1}: {question.question}
          </h4>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isCorrect
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {isCorrect ? '✓ Correct' : '✗ Incorrect'}
            </span>
            {timing && (
              <span className="text-gray-500 text-sm flex items-center">
                <FiClock className="w-3 h-3 mr-1" />
                {formatTime(timing)}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-[#2f404a] mb-2">
              User Answer:
            </p>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-[#3b505c]">
                {Array.isArray(userAnswer)
                  ? userAnswer.join(', ')
                  : String(userAnswer || 'No answer')}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-[#2f404a] mb-2">
              Correct Answer:
            </p>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-green-700">
                {Array.isArray(question.correctAnswer)
                  ? question.correctAnswer.join(', ')
                  : String(question.correctAnswer || question.correctAnswers)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.75)] bg-opacity-50 flex items-center justify-center p-4 z-50 font-['Work_Sans']">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full py-4  ">
        <div className="max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
            <div className="flex justify-between items-center">
              <div>
                {loading ? (
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#f5773a]"></div>
                    <h3 className="text-2xl font-bold text-[#2f404a]">
                      Loading...
                    </h3>
                  </div>
                ) : error ? (
                  <div>
                    <h3 className="text-2xl font-bold text-red-600 mb-2">
                      Error
                    </h3>
                    <p className="text-red-500">{error}</p>
                  </div>
                ) : attempt ? (
                  <div>
                    <h3 className="text-2xl font-bold text-[#2f404a] mb-2">
                      {attempt.taker_name}&#39;s Quiz Results
                    </h3>
                    <p className="text-lg text-[#3b505c] mb-2">
                      Quiz: {attempt.quiz_title}
                    </p>
                    <div className="flex items-center gap-4 text-[#3b505c]">
                      <span className="flex items-center">
                        <FiPercent className="w-4 h-4 mr-1" />
                        Score: {attempt.score}/{attempt.total_questions}
                      </span>
                      <span className="flex items-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(
                            attempt.percentage_score
                          )}`}
                        >
                          {attempt.percentage_score}%
                        </span>
                      </span>
                      <span className="flex items-center">
                        <FiClock className="w-4 h-4 mr-1" />
                        {formatTime(attempt.time_taken)}
                      </span>
                      <span className="flex items-center">
                        <FiCalendar className="w-4 h-4 mr-1" />
                        {formatDateTime(attempt.completed_at)}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
              <button
                onClick={onClose}
                className="mt-[-120px] text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f5773a]"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600">Failed to load attempt details</p>
              </div>
            ) : attempt ? (
              <div className="space-y-6">
                <div className="bg-[#0c4a6e] p-4 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">
                    Quiz Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-white p-3 rounded">
                      <div className="text-2xl font-bold text-[#f5773a]">
                        {attempt.score}
                      </div>
                      <div className="text-sm text-gray-600">Correct</div>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <div className="text-2xl font-bold text-[#f5773a]">
                        {attempt.total_questions - attempt.score}
                      </div>
                      <div className="text-sm text-gray-600">Incorrect</div>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <div className="text-2xl font-bold text-[#f5773a]">
                        {attempt.percentage_score}%
                      </div>
                      <div className="text-sm text-gray-600">Score</div>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <div className="text-2xl font-bold text-[#f5773a]">
                        {formatTime(attempt.time_taken)}
                      </div>
                      <div className="text-sm text-gray-600">Time</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-semibold text-[#2f404a] mb-4">
                    Question-by-Question Analysis
                  </h4>
                  {attempt.questions_data?.map((question, index) =>
                    renderQuestionAnalysis(question, index)
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
