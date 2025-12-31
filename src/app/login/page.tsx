'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ApiError, API_BASE_URL } from '@/lib/api/client';
import { fetchMe, loginWithCredentials, registerWithCredentials } from '@/lib/auth/api';
import { getAuthToken, setAuthSession } from '@/lib/auth/storage';

type Mode = 'login' | 'register';

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

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const token = getAuthToken();
    if (!token) return;
    fetchMe(token)
      .then((user) => {
        if (!active) return;
        setAuthSession(token, user);
        router.replace('/calendar');
      })
      .catch(() => {
        // 로그인되지 않은 경우 무시
      });
    return () => {
      active = false;
    };
  }, [router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const action =
        mode === 'login' ? loginWithCredentials : registerWithCredentials;
      const session = await action(email, password);
      setAuthSession(session.access_token, session.user);
      if (!session.user) {
        const user = await fetchMe(session.access_token);
        setAuthSession(session.access_token, user);
      }
      router.replace('/calendar');
    } catch (err) {
      const fallback =
        mode === 'login'
          ? '로그인에 실패했습니다.'
          : '회원가입에 실패했습니다.';
      setError(getErrorMessage(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  const onGoogleLogin = () => {
    const base = API_BASE_URL.replace(/\/+$/, '');
    window.location.href = `${base}/auth/google`;
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[rgb(var(--bg))] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[rgb(var(--panel))] p-6 shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Calabi logo" width={44} height={44} />
          <div>
            <div className="text-base font-semibold text-white/90">Calabi</div>
            <div className="text-xs text-white/50">
              시간을 공간으로, 나의 우주를 투영하는 일정 관리
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-white/5 p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={[
              'rounded-lg px-3 py-2 font-semibold transition',
              mode === 'login'
                ? 'bg-white/15 text-white'
                : 'text-white/55 hover:text-white/80',
            ].join(' ')}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={[
              'rounded-lg px-3 py-2 font-semibold transition',
              mode === 'register'
                ? 'bg-white/15 text-white'
                : 'text-white/55 hover:text-white/80',
            ].join(' ')}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="block text-xs text-white/60">
            이메일
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none transition focus:border-white/30 focus:bg-white/10"
            />
          </label>
          <label className="block text-xs text-white/60">
            비밀번호
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none transition focus:border-white/30 focus:bg-white/10"
            />
          </label>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-white/90 py-2 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-[10px] text-white/40">
          <div className="h-px flex-1 bg-white/10" />
          또는
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={onGoogleLogin}
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
        >
          Google로 계속하기
        </button>
      </div>
    </div>
  );
}
