import { useState } from 'react';
import { signInWithGoogle, signInWithGoogleRedirect } from '../firebase';
import Logo from './Logo';

export default function AuthScreen() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRedirectOption, setShowRedirectOption] = useState(false);

  const handleLogin = async () => {
    try {
      setErrorMsg(null);
      setShowRedirectOption(false);
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.code === 'auth/popup-blocked') {
        setErrorMsg("ブラウザのポップアップがブロックされました。Safariをお使いの場合は、設定で「ポップアップブロック」をオフにするか、下のボタンから別の方法をお試しください。");
        setShowRedirectOption(true);
      } else {
        setErrorMsg(error.message || "ログインに失敗しました。");
      }
    }
  };

  const handleRedirectLogin = async () => {
    try {
      setErrorMsg(null);
      await signInWithGoogleRedirect();
    } catch (error: any) {
      setErrorMsg(error.message || "ログインに失敗しました。");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center flex flex-col items-center">
        <div className="mb-10 mt-4">
          <Logo className="scale-150" />
        </div>
        
        {errorMsg && (
          <div className="mb-8 p-5 bg-stone-50 text-stone-600 rounded-2xl text-sm text-center break-words w-full border border-stone-100 leading-relaxed">
            <p className="font-medium mb-1">お知らせ</p>
            {errorMsg}
          </div>
        )}

        <div className="space-y-4 w-full">
          <button
            onClick={handleLogin}
            className="w-full bg-stone-900 text-white rounded-2xl py-4 px-4 font-medium hover:bg-stone-800 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Googleでログイン
          </button>

          {showRedirectOption && (
            <button
              onClick={handleRedirectLogin}
              className="w-full bg-white border border-stone-200 text-stone-500 rounded-2xl py-4 px-4 text-sm font-medium hover:bg-stone-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              別の方法でログインを試す
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
