/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';

type InsertPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
  user_id?: string | null;
};

export default function ContactClient() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [hp, setHp] = useState(''); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<null | string>(null);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    // Prefill from auth if available
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user?.email) setEmail(user.email);
      if (!name && user?.user_metadata?.full_name)
        setName(user.user_metadata.full_name);
    })();
  }, []);

  const reset = () => {
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setHp('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // simple validation
    if (hp) return; // bot
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError('Please complete all fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }
    if (message.trim().length < 20) {
      setError('Message should be at least 20 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: InsertPayload = {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        user_id: user?.id ?? null,
      };

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message, hp }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }

      setSuccess('Thanks! Your message has been sent.');
      reset();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase =
    'w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5773a] focus:border-[#f5773a] text-[#0c4a6e] bg-white transition-all';

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg"
    >
      <h2 className="text-2xl font-bold text-[#0c4a6e] mb-6">
        Send us a message
      </h2>

      {/* Honeypot (hidden) */}
      <div className="hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-[#0c4a6e] mb-2"
          >
            Full Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className={inputBase}
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-[#0c4a6e] mb-2"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={inputBase}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="mt-6">
        <label
          htmlFor="subject"
          className="block text-sm font-semibold text-[#0c4a6e] mb-2"
        >
          Subject
        </label>
        <input
          id="subject"
          type="text"
          className={inputBase}
          placeholder="How can we help?"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          minLength={3}
        />
      </div>

      <div className="mt-6">
        <label
          htmlFor="message"
          className="block text-sm font-semibold text-[#0c4a6e] mb-2"
        >
          Message
        </label>
        <textarea
          id="message"
          rows={6}
          className={inputBase}
          placeholder="Share as much detail as possible…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={20}
        />
        <p className="text-xs text-gray-500 mt-1">
          We’ll reply to{' '}
          <span className="font-medium">{email || 'your email'}</span>.
        </p>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="mt-6 bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded-r-lg">
          <p className="text-sm text-emerald-800 font-medium">{success}</p>
        </div>
      )}

      <div className="mt-6">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-white bg-[#f5773a] hover:bg-orange-600 shadow-lg transition-all disabled:opacity-60"
          aria-busy={submitting}
        >
          {submitting ? (
            <>
              <span
                className="mr-2 inline-block h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"
                aria-hidden="true"
              />
              Sending…
            </>
          ) : (
            <>
              Send Message
            </>
          )}
        </button>
      </div>
    </form>
  );
}
