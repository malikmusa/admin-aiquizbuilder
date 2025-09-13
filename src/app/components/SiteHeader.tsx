/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';

import { Work_Sans } from 'next/font/google';
import Image from 'next/image';

const workSans = Work_Sans({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-work-sans',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if current page is an embed page
  const isEmbedPage = pathname?.startsWith('/embed');

  useEffect(() => {
  let isMounted = true;

  const fetchUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted) {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserData(session.user.id);
        }
      }
    } catch (err) {
      console.error("Error fetching session:", err);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  fetchUser();

  const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
    if (session?.user) {
      fetchUserData(session.user.id);
    } else {
      setSubscription(null);
      setUsage(null);
    }
    setLoading(false);
  });

  return () => {
    isMounted = false;
    authListener?.subscription?.unsubscribe();
  };
}, []);


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

      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Unexpected error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    // setLoading(true);
    setProfileDropdownOpen(false);
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/login');
    }
    setLoading(false);
  };

  const isActivePath = (path: string) => {
    return pathname === path;
  };

  const NavLink = ({
    href,
    children,
    className = '',
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <Link
      href={href}
      className={`relative px-3 py-2 rounded-lg text-base font-normal transition-all duration-200 ${'text-[#222f38] hover:text-[#f5773a]'} ${className}`}
      onClick={() => setMobileMenuOpen(false)}
    >
      {children}
      {/* Small active indicator - minimal line */}
      {isActivePath(href) && (
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-[85%] h-[3px] bg-[#f5773a] rounded-full"></div>
      )}
    </Link>
  );

  const AuthButton = ({
    href,
    children,
    variant = 'primary',
  }: {
    href: string;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
  }) => (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
        variant === 'primary'
          ? 'bg-[#f5773a] hover:bg-orange-600 text-white shadow-md'
          : 'bg-[#3b505c] hover:bg-[#2f404a] text-white shadow-md'
      }`}
      onClick={() => setMobileMenuOpen(false)}
    >
      {children}
    </Link>
  );

  const getPlanStatus = () => {
    if (!subscription || subscription.status !== 'active') {
      return { name: 'Free Plan', color: 'text-gray-600' };
    }
    return {
      name: subscription.plan_name || 'Pro Plan',
      color: 'text-emerald-600',
    };
  };

  const getUsageInfo = () => {
    if (!usage) return { used: 0, limit: 3 };
    if (subscription?.status === 'active') {
      return { used: usage.quizzes_created, limit: '∞' };
    }
    return { used: usage.quizzes_created, limit: usage.quizzes_limit };
  };

  return (
    <div className={workSans.variable}>
        {/* Header */}
        {!isEmbedPage && (
          <header className="bg-white shadow-lg border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Logo */}
                <div className="flex items-center">
                  <Link href="/" className="flex items-center space-x-2">
                  <Image src="/logo.svg" alt="Logo" width={150} height={30} />
                    
                  </Link>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-1">
                  {user ? (
                    // Authenticated user navigation
                    <>
                      <NavLink href="/dashboard">Dashboard</NavLink>
                      <NavLink href="/generate">Create Quiz</NavLink>
                      <NavLink href="/quizzes">Quizzes</NavLink>
                    </>
                  ) : (
                    // Unauthenticated user navigation
                    <>
                      <NavLink href="/">Home</NavLink>
                      <NavLink href="/generate">Create Quiz</NavLink>
                      <NavLink href="/pricing">Pricing</NavLink>
                      <NavLink href="/contact">Contact Us</NavLink>
                    </>
                  )}
                </div>

                {/* Desktop Auth Buttons */}
                <div className="hidden md:flex items-center space-x-3">
                  {loading ? (
                    <div className="flex items-center space-x-2 text-[#3b505c]">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#f5773a]"></div>
                      <span className="text-sm">Loading...</span>
                    </div>
                  ) : user ? (
                    // User Profile Dropdown
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() =>
                          setProfileDropdownOpen(!profileDropdownOpen)
                        }
                        className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#f5773a] focus:ring-offset-2"
                      >
                        <div className="w-9 h-9 bg-[#f5773a] rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow duration-200">
                          <span className="text-sm font-bold text-white">
                            {user.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <svg
                          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                            profileDropdownOpen ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {profileDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                          {/* User Info Section */}
                          <div className="px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-[#f5773a] rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-white">
                                  {user.email?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {user.email?.split('@')[0]}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {user.email}
                                </p>
                              </div>
                            </div>

                            {/* Plan Status */}
                            <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                              <div className="flex justify-between items-center mb-1">
                                <span
                                  className={`text-xs font-semibold ${
                                    getPlanStatus().color
                                  }`}
                                >
                                  {getPlanStatus().name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {getUsageInfo().used}/{getUsageInfo().limit}{' '}
                                  quizzes
                                </span>
                              </div>
                              {subscription?.status !== 'active' && (
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                  <div
                                    className="bg-[#f5773a] h-1.5 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${
                                        (getUsageInfo().used /
                                          (getUsageInfo().limit as number)) *
                                        100
                                      }%`,
                                    }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Menu Items */}
                          <div className="px-2 py-1">
                            <Link
                              href="/profile"
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <svg
                                className="w-4 h-4 mr-3 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              Profile
                            </Link>

                            <Link
                              href="/billing"
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <svg
                                className="w-4 h-4 mr-3 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                />
                              </svg>
                              Billing & Plans
                              {subscription?.status !== 'active' && (
                                <span className="ml-auto text-xs bg-[#f5773a] text-white px-2 py-0.5 rounded-full">
                                  Upgrade
                                </span>
                              )}
                            </Link>

                            <Link
                              href="/settings"
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <svg
                                className="w-4 h-4 mr-3 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              Settings
                            </Link>
                          </div>

                          {/* Logout Section */}
                          <div className="border-t border-gray-100 px-2 py-1 mt-1">
                            <button
                              onClick={handleLogout}
                              className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                            >
                              <svg
                                className="w-4 h-4 mr-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                              </svg>
                              Sign out
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <AuthButton href="/login" variant="secondary">
                        Login
                      </AuthButton>
                      <AuthButton href="/signup" variant="primary">
                        Sign Up
                      </AuthButton>
                    </div>
                  )}
                </div>

                {/* Mobile menu button */}
                <div className="md:hidden">
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 rounded-lg text-[#3b505c] hover:text-[#f5773a] hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {mobileMenuOpen ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h16"
                        />
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              {/* Mobile Navigation Menu */}
              {mobileMenuOpen && (
                <div className="md:hidden border-t border-gray-200 py-4">
                  <div className="flex flex-col space-y-2">
                    {user ? (
                      // Authenticated user mobile navigation
                      <>
                        <Link
                          href="/dashboard"
                          className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isActivePath('/dashboard')
                              ? 'text-[#f5773a] bg-orange-50'
                              : 'text-[#3b505c] hover:text-[#f5773a] hover:bg-orange-50'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Dashboard
                          {isActivePath('/dashboard') && (
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-[#f5773a] rounded-full"></div>
                          )}
                        </Link>
                        <Link
                          href="/generate"
                          className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isActivePath('/generate')
                              ? 'text-[#f5773a] bg-orange-50'
                              : 'text-[#3b505c] hover:text-[#f5773a] hover:bg-orange-50'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Create Quiz
                          {isActivePath('/generate') && (
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-[#f5773a] rounded-full"></div>
                          )}
                        </Link>
                        <Link
                          href="/quizzes"
                          className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isActivePath('/quizzes')
                              ? 'text-[#f5773a] bg-orange-50'
                              : 'text-[#3b505c] hover:text-[#f5773a] hover:bg-orange-50'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Quizzes
                          {isActivePath('/quizzes') && (
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-[#f5773a] rounded-full"></div>
                          )}
                        </Link>
                      </>
                    ) : (
                      // Unauthenticated user mobile navigation
                      <>
                        <Link
                          href="/"
                          className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isActivePath('/')
                              ? 'text-[#f5773a] bg-orange-50'
                              : 'text-[#3b505c] hover:text-[#f5773a] hover:bg-orange-50'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Home
                          {isActivePath('/') && (
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-[#f5773a] rounded-full"></div>
                          )}
                        </Link>
                        <Link
                          href="/about"
                          className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isActivePath('/about')
                              ? 'text-[#f5773a] bg-orange-50'
                              : 'text-[#3b505c] hover:text-[#f5773a] hover:bg-orange-50'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          About Us
                          {isActivePath('/about') && (
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-[#f5773a] rounded-full"></div>
                          )}
                        </Link>
                        <Link
                          href="/contact"
                          className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isActivePath('/contact')
                              ? 'text-[#f5773a] bg-orange-50'
                              : 'text-[#3b505c] hover:text-[#f5773a] hover:bg-orange-50'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Contact Us
                          {isActivePath('/contact') && (
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-[#f5773a] rounded-full"></div>
                          )}
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Mobile Auth Section */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {loading ? (
                      <div className="flex items-center space-x-2 text-[#3b505c] px-3 py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#f5773a]"></div>
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : user ? (
                      <div className="space-y-3">
                        {/* Mobile User Info */}
                        <div className="flex items-center space-x-3 px-3 py-3 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 bg-[#f5773a] rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {user.email?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user.email}
                            </p>
                            <p
                              className={`text-xs font-semibold ${
                                getPlanStatus().color
                              }`}
                            >
                              {getPlanStatus().name} • {getUsageInfo().used}/
                              {getUsageInfo().limit} quizzes
                            </p>
                          </div>
                        </div>

                        {/* Mobile Profile Links */}
                        <div className="space-y-1">
                          <Link
                            href="/profile"
                            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <svg
                              className="w-4 h-4 mr-3 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            View Profile
                          </Link>

                          <Link
                            href="/billing"
                            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <svg
                              className="w-4 h-4 mr-3 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                              />
                            </svg>
                            Billing & Plans
                            {subscription?.status !== 'active' && (
                              <span className="ml-auto text-xs bg-[#f5773a] text-white px-2 py-0.5 rounded-full">
                                Upgrade
                              </span>
                            )}
                          </Link>

                          <Link
                            href="/settings"
                            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <svg
                              className="w-4 h-4 mr-3 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            Settings
                          </Link>
                        </div>

                        {/* Mobile Logout Button */}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          Sign out
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-2">
                        <AuthButton href="/login" variant="secondary">
                          Login
                        </AuthButton>
                        <AuthButton href="/signup" variant="primary">
                          Sign Up
                        </AuthButton>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </nav>
          </header>
        )}

        {/* Main Content */}
        <main className={isEmbedPage ? '' : 'pt-16'}>{children}</main>
      </div>
  );
}
