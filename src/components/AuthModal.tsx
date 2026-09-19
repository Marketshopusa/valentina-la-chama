import React, { useState } from 'react';
import { X, AlertCircle, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, setDoc, doc, db, serverTimestamp } from '../firebase';
import { isAdminUser } from '../data/adminInitialData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userProfile?: any) => void;
  title?: string;
  subtitle?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title,
  subtitle
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const displayTitle = title || 'Regístrate con Google';
  const displaySubtitle = subtitle || 'Para entrar debes crear o iniciar sesión con tu cuenta de Google. Así se guarda tu historia en tu PC y móvil.';

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const googleUser = cred.user;
      if (!googleUser?.email || googleUser.isAnonymous) {
        setError('Se requiere una cuenta de Google válida para continuar.');
        return;
      }

      const cleanEmail = googleUser.email.trim().toLowerCase();
      const isAdm = isAdminUser(cleanEmail);

      try {
        localStorage.setItem('op_user_email', cleanEmail);
        localStorage.setItem('op_user_displayName', googleUser.displayName || cleanEmail.split('@')[0]);
      } catch (e) {}

      try {
        await setDoc(doc(db, 'users', googleUser.uid), {
          email: cleanEmail,
          displayName: googleUser.displayName || (isAdm ? 'Administrador Master' : cleanEmail.split('@')[0]),
          isAdmin: isAdm,
          role: isAdm ? 'admin' : 'user',
          lastLoginAt: serverTimestamp(),
          authProvider: 'google'
        }, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore doc write notice:', fsErr);
      }

      try {
        await fetch('/api/user-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            displayName: googleUser.displayName || (isAdm ? 'Administrador Master' : cleanEmail.split('@')[0])
          })
        });
      } catch (serverErr) {
        console.warn('Server user profile sync notice:', serverErr);
      }

      onSuccess({
        email: cleanEmail,
        displayName: googleUser.displayName || (isAdm ? 'Administrador Master' : cleanEmail.split('@')[0]),
        isAdmin: isAdm,
        uid: googleUser.uid
      });
      onClose();
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        const isUnauthorizedDomain = err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized domain');
        const isPopupBlocked = err?.code === 'auth/popup-blocked';

        if (isUnauthorizedDomain) {
          setError(`El dominio actual (${window.location.hostname}) no está autorizado en Firebase. Añade "${window.location.hostname}" en Firebase Console > Authentication > Settings > Authorized Domains.`);
        } else if (isPopupBlocked) {
          setError('El navegador bloqueó la ventana de Google. Abre la app en una pestaña nueva e inténtalo de nuevo.');
        } else {
          setError(err?.message || 'No se pudo completar el acceso con Google. Intenta de nuevo.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#13101c] border border-white/10 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative text-white">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 mx-auto flex items-center justify-center mb-3 shadow-lg shadow-pink-900/40">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            {displayTitle}
          </h2>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
            {displaySubtitle}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex flex-col gap-2.5">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
            {typeof window !== 'undefined' && window.self !== window.top && (
              <button
                type="button"
                onClick={() => window.open(window.location.href, '_blank')}
                className="py-1.5 px-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium text-[11px] transition-colors cursor-pointer"
              >
                Abrir en pestaña nueva ↗
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-3.5 px-4 bg-white hover:bg-zinc-100 active:scale-[0.98] text-zinc-900 font-bold text-sm rounded-2xl shadow-xl shadow-white/5 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-zinc-900" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          <span>Continuar con Google</span>
        </button>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Obligatorio · sin acceso de invitado</span>
        </div>
      </div>
    </div>
  );
};
