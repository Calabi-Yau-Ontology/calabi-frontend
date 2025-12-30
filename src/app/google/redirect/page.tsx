'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { fetchMe, loginWithGoogle } from '@/lib/auth/api';
import { setAuthSession } from '@/lib/auth/storage';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    const payload = error.payload;
    if (payload && typeof payload === 'object' && 'message' in payload) {
      const message = (payload as { message?: string | string[] }).message;
      if (Array.isArray(message)) return message.join(', ');
      if (typeof message === 'string') return message;
    }
  }
  return fallback;
};

export default function GoogleRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError('구글 로그인에 실패했습니다.');
      setLoading(false);
      return;
    }

    const query = Object.fromEntries(searchParams.entries());
    if (!query.code) {
      setError('구글 인증 정보를 찾을 수 없습니다.');
      setLoading(false);
      return;
    }

    loginWithGoogle(query)
      .then(async (session) => {
        setAuthSession(session.access_token, session.user);
        if (!session.user) {
          const user = await fetchMe(session.access_token);
          setAuthSession(session.access_token, user);
        }
        router.replace('/calendar');
      })
      .catch((err) => {
        setError(getErrorMessage(err, '로그인에 실패했습니다.'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[rgb(var(--bg))] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[rgb(var(--panel))] p-6 text-center">
        {loading && !error && (
          <div className="text-sm text-white/70">로그인 처리 중...</div>
        )}
        {error && (
          <div className="space-y-3">
            <div className="text-sm text-red-200">{error}</div>
            <Link
              href="/login"
              className="inline-flex rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
            >
              로그인으로 돌아가기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
