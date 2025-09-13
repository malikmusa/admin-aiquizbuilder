/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BiLock } from 'react-icons/bi';
import { FaLock } from 'react-icons/fa';
import { QuizTypeSelectPlain } from './Select';

export default function GenerateQuizPage() {
  const [content, setContent] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [questionCount, setQuestionCount] = useState(5);
  const [quizType, setQuizType] = useState('multiple-choice');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLoading, setUserLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [url, setUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'file' | 'url'>('text');
  const [user, setUser] = useState<any>(null);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const router = useRouter();

  // Loading phrases that will rotate during quiz generation
  const loadingPhrases = [
    'Your quiz is generating...',
    'Thanks for your patience!',
    'Creating amazing questions...',
    'Almost ready for you!',
    'Crafting the perfect quiz...',
    'Just a few more moments...',
    'Preparing your personalized quiz...',
    'Quality questions coming up!',
    'Making learning fun for you...',
    'Your quiz will be worth the wait!',
  ];

  // Effect to rotate loading phrases every 3 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (loading) {
      interval = setInterval(() => {
        setCurrentPhraseIndex(
          (prevIndex) => (prevIndex + 1) % loadingPhrases.length
        );
      }, 3000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [loading, loadingPhrases.length]);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        await fetchUserData(user.id);
      }

      setUserLoading(false);
    };
    checkUser();

    // Restore form data from localStorage if user just logged in
    const restoreFormData = () => {
      const savedFormData = localStorage.getItem('quizFormData');
      if (savedFormData) {
        try {
          const formData = JSON.parse(savedFormData);
          setContent(formData.content || '');
          setDifficulty(formData.difficulty || 'easy');
          setQuestionCount(formData.questionCount || 5);
          setQuizType(formData.quizType || 'mix');
          setUploadedFileName(formData.uploadedFileName || '');
          setUrl(formData.url || '');
          setActiveTab(formData.activeTab || 'text');

          // Clear the saved data after restoring
          localStorage.removeItem('quizFormData');
        } catch (error) {
          console.error('Error restoring form data:', error);
          localStorage.removeItem('quizFormData');
        }
      }
    };

    restoreFormData();
  }, [router]);

  const fetchUserData = async (userId: string) => {
    try {
      // First, make sure we have an authenticated session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('No valid session:', sessionError);
        return;
      }

      // Fetch subscription with proper error handling
      const { data: subscriptionData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no record exists

      if (subError) {
        console.error('Error fetching subscription:', subError);
        // Don't return here, continue to fetch usage data
      }

      // Fetch usage with proper error handling
      const { data: usageData, error: usageError } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single()

      if (usageError) {
        console.error('Error fetching usage:', usageError);
        // If no usage record exists, create one
        if (usageError.code === 'PGRST116') {
          const { data: newUsage, error: createError } = await supabase
            .from('user_usage')
            .insert({
              user_id: userId,
              quizzes_created: 0,
              quizzes_limit: 3,
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating usage record:', createError);
          } else {
            setUsage(newUsage);
          }
        }
      } else {
        setUsage(usageData);
      }
      console.log('sub:', subscriptionData);
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Unexpected error fetching user data:', error);
    }
  };

  const canCreateQuiz = () => {
    if (!usage) return true; // Allow if no usage data yet
    if (subscription?.status === 'active') return true; // Unlimited for active subscribers
    console.log(usage);
    return usage?.quizzes_created < usage?.quizzes_limit;
  };

  const getRemainingQuizzes = () => {
    console.log(
      'usage:',
      usage,
      usage?.quizzes_limit,
      usage?.quizzes_created,
      subscription
    );
    if (!usage) return 3;
    // if (subscription?.status === 'active') return '∞';
    return Math.max(0, usage?.quizzes_limit - usage?.quizzes_created);
  };

  // Function to extract text from different file types
  const extractTextFromFile = async (file: File): Promise<string> => {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    try {
      if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
        return await file.text();
      } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/extract-pdf-text', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to extract text from PDF');
        }

        const data = await response.json();
        return data.text;
      } else if (
        fileType ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'application/msword' ||
        fileName.endsWith('.docx') ||
        fileName.endsWith('.doc')
      ) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/extract-doc-text', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to extract text from document');
        }

        const data = await response.json();
        return data.text;
      } else {
        throw new Error(
          'Unsupported file type. Please upload PDF, TXT, DOC, or DOCX files.'
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to extract text: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  };

  // Handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    const fileName = file.name.toLowerCase();
    const isValidType =
      allowedTypes.includes(file.type) ||
      fileName.endsWith('.txt') ||
      fileName.endsWith('.pdf') ||
      fileName.endsWith('.doc') ||
      fileName.endsWith('.docx');

    if (!isValidType) {
      setError('Please upload a PDF, TXT, DOC, or DOCX file');
      return;
    }

    setFileLoading(true);
    setError('');
    setUploadedFileName(file.name);

    try {
      const extractedText = await extractTextFromFile(file);

      if (extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the file');
      }

      setContent(extractedText);
      setActiveTab('text');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
      setUploadedFileName('');
    } finally {
      setFileLoading(false);
      event.target.value = '';
    }
  };

  // Handle URL content extraction
  const handleUrlExtraction = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL (e.g., https://aiquizbuilder.com)');
      return;
    }

    setUrlLoading(true);
    setError('');

    try {
      const response = await fetch('/api/extract-url-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to extract content from URL'
        );
      }

      const data = await response.json();

      if (!data.text || data.text.trim().length === 0) {
        throw new Error('No text content could be extracted from this URL');
      }

      setContent(data.text);
      setUploadedFileName(`Content from: ${url}`);
      setActiveTab('text');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to extract content from URL'
      );
    } finally {
      setUrlLoading(false);
    }
  };

  const clearContent = () => {
    setContent('');
    setUploadedFileName('');
    setUrl('');
    setError('');
    // Don't clear localStorage here since this is just clearing current content
  };

  const saveFormDataToStorage = () => {
    const formData = {
      content,
      difficulty,
      questionCount,
      quizType,
      uploadedFileName,
      url,
      activeTab,
    };
    localStorage.setItem('quizFormData', JSON.stringify(formData));
  };

  const resetForm = () => {
    setContent('');
    setDifficulty('easy');
    setQuestionCount(5);
    setQuizType('mix');
    setUploadedFileName('');
    setUrl('');
    setActiveTab('text');
    setError('');

    // Also clear any saved form data
    localStorage.removeItem('quizFormData');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is logged in before generating quiz
    if (!user) {
      // Save current form data before redirecting to login
      saveFormDataToStorage();

      // Redirect to login with parameter indicating data was saved
      router.push('/login?from=generate&dataSaved=true');

      return;
    }

    // Check if user can create more quizzes
    if (!canCreateQuiz()) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    setCurrentPhraseIndex(0); // Reset phrase index when starting
    setError('');

    if (content.split(/\s+/).filter(Boolean).length < 100) {
      setError('Content must be at least 100 words.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, difficulty, questionCount, quizType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate quiz.');
      }

      const data = await response.json();
      console.log('data.data', data.data);
      if (data.data && data.data.quizId) {
        // Update user usage
        if (user) {
          await supabase
            .from('user_usage')
            .update({
              quizzes_created: (usage?.quizzes_created || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);
        }

        // Reset form after successful quiz generation
        resetForm();
        const quizId = data.data.quizId;
        console.log('quizId', quizId);
        setLoading(false);
        router.push(`/quiz/${quizId}`);
      } else {
        throw new Error('Quiz ID not found in response.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const getMaxQuestionsAllowed = () => {
    console.log('user subscription plan:', subscription);
    if (subscription?.plan_type === 'pro') return 100;
    if (subscription?.plan_type === 'plus') return 20;
    return 5; // basic or no subscription
  };

  const getWordLimits = () => {
    if (subscription?.plan_type === 'pro') return { min: 100, max: 2000 };
    if (subscription?.plan_type === 'plus') return { min: 100, max: 500 };
    return { min: 100, max: 150 }; // free/basic
  };

  const plan = subscription?.plan_type ?? 'free';
  const hasPremium = plan === 'plus' || plan === 'pro';

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const isContentValid = wordCount >= 100;

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-['Work_Sans']">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#f5773a]"></div>
            <p className="text-[#f5773a] font-medium text-lg">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Count words without altering the text
  const countWords = (text: string) => (text.trim().match(/\S+/g) || []).length;

  // Preserve original whitespace while trimming to the first `max` words
  const clampToWordLimit = (text: string, max: number) => {
    const total = countWords(text);
    if (total <= max) return text;

    // Match each "word + any following spaces/newlines"
    const re = /(\S+)(\s*)/g;
    let out = '';
    let count = 0;
    let m: RegExpExecArray | null;

    while ((m = re.exec(text)) !== null) {
      out += m[0]; // keep the word and whatever whitespace was after it
      count++;
      if (count === max) break;
    }

    // Optional: remove extra trailing whitespace after the last allowed word
    return out.replace(/\s+$/, '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4 font-['Work_Sans']">
      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUpgradeModal(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-[#f5773a] rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>

              <h3 className="text-xl font-semibold text-[#0c4a6e] mb-2">
                Quiz Limit Reached
              </h3>
              <p className="text-gray-600 mb-6">
                You've created {usage?.quizzes_created || 0} out of{' '}
                {usage?.quizzes_limit || 3} free quizzes this month. Upgrade to
                Pro for unlimited quiz creation!
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <Link
                  href="/billing"
                  className="flex-1 bg-[#f5773a] hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-center"
                >
                  Upgrade Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-[#f5773a] rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
              </div>

              <h3 className="text-xl font-semibold text-[#0c4a6e] mb-2">
                Generating Your Quiz
              </h3>
              <p className="text-lg text-[#f5773a] font-medium transition-all duration-500 ease-in-out">
                {loadingPhrases[currentPhraseIndex]}
              </p>

              <div className="mt-6 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#f5773a] h-2 rounded-full animate-pulse"
                  style={{ width: '70%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#f5773a] to-orange-600 rounded-xl mb-4 shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-[#0c4a6e] mb-3">
            AI Quiz Builder – Create a Quiz in Minutes
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform your content into engaging quizzes. Upload files, paste
            URLs, or write directly.
          </p>

          {/* Usage indicator for logged in users */}
          {user && (
            <div className="mt-4 inline-flex items-center space-x-2 bg-white rounded-lg px-4 py-2 shadow-sm border">
              <svg
                className="w-4 h-4 text-[#f5773a]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                {`${getRemainingQuizzes()} quizzes remaining this month`}
              </span>
              {subscription?.status !== 'active' &&
                getRemainingQuizzes() === 0 && (
                  <Link
                    href="/billing"
                    className="text-xs bg-[#f5773a] text-white px-2 py-1 rounded-full hover:bg-orange-600 transition-colors"
                  >
                    Upgrade
                  </Link>
                )}
            </div>
          )}
        </div>

        {/* Quiz Settings */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-bold text-[#0c4a6e] mb-6 flex items-center">
            <div className="w-7 h-7 bg-[#0c4a6e] rounded-lg flex items-center justify-center mr-3">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            Quiz Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#0c4a6e] mb-2">
                Quiz Type
              </label>
              <QuizTypeSelectPlain
                quizType={quizType}
                setQuizType={setQuizType}
                subscription={subscription}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0c4a6e] mb-2">
                Difficulty Level
              </label>
              <select
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5773a] focus:border-[#f5773a] text-[#0c4a6e] text-base bg-white transition-all duration-200"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0c4a6e] mb-2">
                Number of Questions
              </label>
              <input
                type="number"
                min="1"
                max={getMaxQuestionsAllowed()}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5773a] focus:border-[#f5773a] text-[#0c4a6e] text-base bg-white transition-all duration-200"
                value={questionCount}
                onChange={(e) => {
                  if (parseInt(e.target.value) > getMaxQuestionsAllowed()) {
                    setQuestionCount(getMaxQuestionsAllowed());
                  } else if (parseInt(e.target.value) < 1) {
                    setQuestionCount(1);
                  } else {
                    setQuestionCount(parseInt(e.target.value));
                  }
                }}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="max-w-3xl mx-auto mb-6">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content Input Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 bg-gray-50">
              <nav className="flex space-x-8 px-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                    activeTab === 'text'
                      ? 'border-[#f5773a] text-[#f5773a]'
                      : 'border-transparent text-[#0c4a6e] hover:text-[#f5773a] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span>Write Text</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                    activeTab === 'file'
                      ? 'border-[#f5773a] text-[#f5773a]'
                      : 'border-transparent text-[#0c4a6e] hover:text-[#f5773a] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span>Upload File</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('url')}
                  className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                    activeTab === 'url'
                      ? 'border-[#f5773a] text-[#f5773a]'
                      : 'border-transparent text-[#0c4a6e] hover:text-[#f5773a] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    <span>From URL</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'text' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-lg font-bold text-[#0c4a6e]">
                      Content for Quiz Generation
                    </label>
                    {content && (
                      <button
                        type="button"
                        onClick={clearContent}
                        className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Clear Content
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={10}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5773a] focus:border-[#f5773a] text-[#0c4a6e] placeholder-gray-400 resize-none text-base leading-relaxed bg-gray-50 focus:bg-white transition-all duration-200"
                    placeholder="Paste your content here or use the other tabs to upload files or extract from URLs..."
                    value={content}
                    onChange={(e) => {
                      const { max } = getWordLimits();
                      const next = clampToWordLimit(e.target.value, max);
                      setContent(next);
                    }}
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
                          isContentValid
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-red-600 bg-red-50'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isContentValid ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        ></div>
                        <span className="text-sm font-medium">
                          {wordCount}/{' '}
                          {`(min ${getWordLimits().min} - max ${
                            getWordLimits().max
                          })`}{' '}
                          words {isContentValid ? '✓' : 'required'}
                        </span>
                      </div>
                    </div>
                    {uploadedFileName && (
                      <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="truncate max-w-xs font-medium">
                          {uploadedFileName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'file' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-[#f5773a] hover:bg-orange-50 transition-all duration-300">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                        </div>
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="bg-[#f5773a] hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            {fileLoading ? 'Processing...' : 'Choose File'}
                          </span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept=".pdf,.txt,.doc,.docx"
                            onChange={handleFileUpload}
                            disabled={fileLoading}
                          />
                        </label>
                        <p className="text-gray-600 mt-3 text-base font-medium">
                          Support for PDF, TXT, DOC, and DOCX files
                        </p>
                        <p className="text-gray-400 text-sm">
                          Maximum file size: 10MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {fileLoading && (
                    <div className="flex items-center justify-center space-x-3 py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#f5773a] border-t-transparent"></div>
                      <span className="text-[#f5773a] font-semibold">
                        Extracting text from file...
                      </span>
                    </div>
                  )}

                  {uploadedFileName &&
                    !uploadedFileName.startsWith('Content from:') && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-emerald-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-emerald-800 font-semibold">
                                File uploaded successfully
                              </p>
                              <p className="text-emerald-600 text-sm">
                                {uploadedFileName}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={clearContent}
                            className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                </div>
              )}

              {activeTab === 'url' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-bold text-[#0c4a6e] mb-3">
                      Extract Content from URL
                    </label>
                    <div className="flex space-x-3">
                      <input
                        type="url"
                        placeholder="https://aiquizbuilder.com/article"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5773a] focus:border-[#f5773a] text-[#0c4a6e] text-base bg-gray-50 focus:bg-white transition-all duration-200"
                        disabled={urlLoading}
                      />
                      <button
                        type="button"
                        onClick={handleUrlExtraction}
                        disabled={urlLoading || !url.trim()}
                        className="bg-[#f5773a] hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        {urlLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Extracting...</span>
                          </div>
                        ) : (
                          'Extract Content'
                        )}
                      </button>
                    </div>
                  </div>

                  {urlLoading && (
                    <div className="flex items-center justify-center space-x-3 py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#f5773a] border-t-transparent"></div>
                      <span className="text-[#f5773a] font-semibold">
                        Fetching content from URL...
                      </span>
                    </div>
                  )}

                  {uploadedFileName &&
                    uploadedFileName.startsWith('Content from:') && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-blue-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-blue-800 font-semibold">
                                Content extracted successfully
                              </p>
                              <p className="text-blue-600 text-sm">
                                {uploadedFileName}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={clearContent}
                            className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center pb-6">
            <button
              type="submit"
              className="bg-gradient-to-r from-[#f5773a] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-12 rounded-xl transition-all duration-300 disabled:opacity-50 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:hover:shadow-lg"
              disabled={
                loading ||
                fileLoading ||
                urlLoading ||
                !isContentValid ||
                (!canCreateQuiz() && user)
              }
            >
              {loading ? (
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Generating...</span>
                </div>
              ) : !canCreateQuiz() && user ? (
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span>Upgrade to Create More</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>Generate Quiz</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
