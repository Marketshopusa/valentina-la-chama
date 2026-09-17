import React, { useState } from 'react';
import { Mail, X, LogIn, AlertCircle, Loader2, Crown, Sparkles, CheckCircle2 } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signInAnonymously, setDoc, doc, db, serverTimestamp } from '../firebase';
import { ADMIN_EMAIL, isAdminUser } from '../data/adminInitialData';

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
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const displayTitle = title || 'Acceso con Google o Correo';
  const displaySubtitle = subtitle || 'Entra directamente con tu cuenta de Google o tu Gmail verificado. Sin contraseñas ni formularios complicados.';

  // 1. Google 1-Click Sign-In
  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const googleUser = cred.user;
      if (googleUser && googleUser.email) {
        const cleanEmail = googleUser.email.trim().toLowerCase();
        const isAdm = isAdminUser(cleanEmail);

        // Store user email in localStorage for instant recognition across sessions
        try {
          localStorage.setItem('op_user_email', cleanEmail);
          localStorage.setItem('op_user_displayName', googleUser.displayName || cleanEmail.split('@')[0]);
        } catch (e) {}

        // Save to Firestore
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

        // Save to server-side profile (syncable across PC and mobile)
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
      }
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        const isUnauthorizedDomain = err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized domain');
        const isPopupBlocked = err?.code === 'auth/popup-blocked';
        
        if (isUnauthorizedDomain) {
          setError(`El dominio actual (${window.location.hostname}) no está autorizado en tu consola Firebase (nicol-ai). Para habilitarlo, añade "${window.location.hostname}" en Firebase Console > Auth > Settings > Authorized Domains.`);
        } else if (isPopupBlocked) {
          setError('El navegador bloqueó la ventana emergente de Google. Si estás en vista previa dentro de un iframe, abre la aplicación en una pestaña nueva o usa el acceso directo abajo.');
        } else {
          setError(err?.message || 'No se pudo completar el acceso con Google. Intenta de nuevo o escribe tu correo abajo.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Direct Email Access (No Password)
  const handleDirectEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError('Por favor ingresa un correo electrónico verificado válido (ej: tu.correo@gmail.com).');
      return;
    }

    setIsLoading(true);
    try {
      await processDirectLogin(cleanEmail);
    } catch (err: any) {
      console.error("Direct email login error:", err);
      setError('Error al procesar el acceso con este correo. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Quick Admin Access Button
  const handleAdminQuickAccess = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await processDirectLogin(ADMIN_EMAIL, 'Administrador Master');
    } catch (err: any) {
      console.error("Admin quick access error:", err);
      setError('Error al entrar como administrador.');
    } finally {
      setIsLoading(false);
    }
  };

  // Core helper to log in directly by email without password
  const processDirectLogin = async (cleanEmail: string, explicitDisplayName?: string) => {
    const isAdm = isAdminUser(cleanEmail);
    const resolvedName = explicitDisplayName || (isAdm ? 'Administrador Master' : cleanEmail.split('@')[0]);

    // Ensure persistent client storage
    try {
      localStorage.setItem('op_user_email', cleanEmail);
      localStorage.setItem('op_user_displayName', resolvedName);
    } catch (e) {}

    // Ensure Firebase Auth session is active so Firestore security rules succeed
    let firebaseUid = 'user_' + cleanEmail.replace(/[^a-z0-9]/gi, '_');
    try {
      if (!auth.currentUser) {
        const anonCred = await signInAnonymously(auth);
        firebaseUid = anonCred.user.uid;
      } else {
        firebaseUid = auth.currentUser.uid;
      }
    } catch (authErr) {
      console.warn("Anonymous auth initialization notice:", authErr);
    }

    // Persist to Firestore
    try {
      await setDoc(doc(db, 'users', firebaseUid), {
        email: cleanEmail,
        displayName: resolvedName,
        isAdmin: isAdm,
        role: isAdm ? 'admin' : 'user',
        lastLoginAt: serverTimestamp(),
        authProvider: 'direct_email'
      }, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore doc write notice:', fsErr);
    }

    // Persist to server user profiles
    try {
      await fetch('/api/user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          displayName: resolvedName
        })
      });
    } catch (serverErr) {
      console.warn('Server user profile sync notice:', serverErr);
    }

    onSuccess({
      email: cleanEmail,
      displayName: resolvedName,
      isAdmin: isAdm,
      uid: firebaseUid
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#13101c] border border-white/10 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
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
          <div className="mb-5 p-3.5 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex flex-col gap-2.5 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span>{error}</span>
              </div>
            </div>
            
            <div className="pt-2 border-t border-red-500/20 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAdminQuickAccess}
                disabled={isLoading}
                className="py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 rounded-lg text-amber-200 font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Entrar como Administrador ({ADMIN_EMAIL})</span>
              </button>

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
          </div>
        )}

        {/* 1-CLICK HERO GOOGLE BUTTON */}
        <div className="space-y-3 mb-5">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-white hover:bg-zinc-100 active:scale-[0.98] text-zinc-900 font-bold text-sm rounded-2xl shadow-xl shadow-white/5 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-zinc-900" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continuar con Google</span>
          </button>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Selecciona tu Gmail para sincronizar en tu PC y móvil</span>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative px-3 bg-[#13101c] text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
            O escribe tu correo directamente
          </span>
        </div>

        {/* Direct Email Form - NO PASSWORD */}
        <form onSubmit={handleDirectEmailSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Tu Correo Electrónico (Gmail)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              Sin contraseñas. El sistema guardará y reconocerá tu historial con este correo.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-[#d926a9] to-[#8e2de2] hover:opacity-90 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-pink-950/40 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Entrar con este Correo</span>
              </>
            )}
          </button>
        </form>

        {/* Direct Admin Access Button */}
        <div className="mt-5 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={handleAdminQuickAccess}
            disabled={isLoading}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-amber-500/15 hover:from-amber-500/25 hover:to-purple-500/25 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 hover:text-amber-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-950/20 disabled:opacity-50"
            title="Acceso directo de Administrador para marketshopusafl@gmail.com sin contraseña"
          >
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Acceso Administrador (marketshopusafl@gmail.com)</span>
          </button>
          <p className="text-[10px] text-center text-zinc-500 mt-1.5">
            Acceso total con privilegios ilimitados y todas las historias maestras.
          </p>
        </div>
      </div>
    </div>
  );
};
