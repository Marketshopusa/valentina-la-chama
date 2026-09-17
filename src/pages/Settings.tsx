import React from 'react';
import { db, doc, getDoc, setDoc, auth, linkWithPopup, signInWithPopup, googleProvider } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { Settings as IconSettings, User, Key, Sliders, Palette, CheckCircle, AlertCircle, Save, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Settings() {
  const [currentUser, setCurrentUser] = React.useState(auth.currentUser);
  const [displayName, setDisplayName] = React.useState(currentUser?.displayName || '');
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');

  const [chatTemperature, setChatTemperature] = React.useState(() => {
    return localStorage.getItem('openlover_pref_temperature') || '0.9';
  });
  const [ambientTheme, setAmbientTheme] = React.useState(() => {
    return localStorage.getItem('openlover_pref_theme') || 'cosmic';
  });

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        setDisplayName(user.displayName || '');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setSaving(true);
    setSuccess(false);
    setError('');

    try {
      // 1. Update Auth Profile
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
      });

      // 2. Sync with Firestore /users collection
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        uid: auth.currentUser.uid,
        displayName: displayName.trim(),
        email: auth.currentUser.email || 'anonimo@openlover.ai',
        photoURL: auth.currentUser.photoURL || '',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 3. Save local preference states
      localStorage.setItem('openlover_pref_temperature', chatTemperature);
      localStorage.setItem('openlover_pref_theme', ambientTheme);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Error al guardar los ajustes.');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkGoogle = async () => {
    if (!auth.currentUser) return;
    try {
      await linkWithPopup(auth.currentUser, googleProvider);
      setCurrentUser(auth.currentUser);
      alert('¡Cuenta vinculada con éxito!');
    } catch (err: any) {
      console.error('Link failed:', err);
      if (err.code === 'auth/credential-already-in-use') {
        alert('Este correo de Google ya está vinculado con otro usuario.');
      } else {
        alert(`Hubo un error al vincular: ${err.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen pb-20 px-12 pt-12 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-20%] w-[500px] h-[500px] rounded-full bg-purple-900/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-900/10 blur-3xl" />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-purple-600/10 rounded-2xl border border-purple-500/20 text-purple-400">
            <IconSettings className="w-8 h-8 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white font-serif">Ajustes del Sistema</h1>
            <p className="text-zinc-400 mt-1">Configura tu perfil de usuario y preferencias de IA.</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-8">
          {/* Card 1: Perfil de Usuario */}
          <div className="glass p-8 rounded-[2rem] border border-white/5 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
            <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-3">
              <User className="w-5 h-5 text-purple-400" /> Perfil de Usuario
            </h2>

            {currentUser ? (
              <div className="space-y-6">
                <div className="flex items-center gap-5 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <img 
                    src={currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`} 
                    alt="Perfil avatar" 
                    className="w-16 h-16 rounded-full border-2 border-purple-500/30 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="text-white font-bold text-lg">{currentUser.isAnonymous ? 'Invitado Anónimo' : currentUser.displayName || 'Compañero'}</h3>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">UID: {currentUser.uid}</p>
                    <p className="text-xs text-purple-400 font-medium mt-1 uppercase tracking-widest">
                      {currentUser.isAnonymous ? 'Modo Invitado temporal' : 'Cuenta de Google verificada'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-400 font-mono uppercase tracking-widest">Nombre público</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Escribe tu apodo o nombre"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all text-sm"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">Este es el nombre con el que se dirigirán a ti los compañeros de IA.</p>
                </div>

                {currentUser.isAnonymous && (
                  <div className="p-4 bg-purple-950/20 rounded-2xl border border-purple-500/10 flex items-center justify-between gap-4 mt-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      <p className="text-xs text-zinc-300 leading-relaxed max-w-md">
                        Te encuentras en una cuenta de invitado. Vincula tu cuenta de Google para respaldar tus conversaciones y personajes creados.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLinkGoogle}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600 text-white font-bold rounded-xl transition-all border border-purple-500/30 text-xs shadow-md click-feedback"
                    >
                      <LogIn className="w-4 h-4" /> Vincular Google
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/5 text-zinc-500">
                Inicia sesión en la plataforma usando la barra lateral para configurar tu perfil.
              </div>
            )}
          </div>

          {/* Card 2: Configuración de la IA */}
          <div className="glass p-8 rounded-[2rem] border border-white/5 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
            <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-3">
              <Sliders className="w-5 h-5 text-purple-400" /> Preferencias de la IA
            </h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-zinc-400 font-mono uppercase tracking-widest">Temperatura de respuesta: {chatTemperature}</label>
                  <span className="text-zinc-500 text-xs font-mono">{chatTemperature === '0.5' ? 'Conservador' : chatTemperature === '0.9' ? 'Estándar' : 'Altamente Creativo'}</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.2"
                  step="0.1"
                  value={chatTemperature}
                  onChange={(e) => setChatTemperature(e.target.value)}
                  className="w-full accent-purple-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                />
                <p className="text-[11px] text-zinc-500">
                  Valores más altos producen respuestas con más sorpresa y personalidad, mientras que los valores bajos se mantienen más formales.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-400 font-mono uppercase tracking-widest">Estilo Atmosférico del Chat</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'cosmic', label: 'Crepúsculo Profundo', desc: 'Oscuridad con acentos púrpuras' },
                    { id: 'slate', label: 'Mineral Pálido', desc: 'Gris pizarra clásico y sobrio' },
                    { id: 'cyber', label: 'Neon Cyberpunk', desc: 'Fucsia vibrante de ciencia ficción' }
                  ].map((style) => (
                    <div
                      key={style.id}
                      onClick={() => setAmbientTheme(style.id)}
                      className={cn(
                        "p-4 rounded-2xl border cursor-pointer transition-all border-white/5 text-center flex flex-col items-center justify-center h-24",
                        ambientTheme === style.id 
                          ? "bg-purple-600/10 border-purple-500/50 shadow-lg shadow-purple-500/10"
                          : "bg-white/5 hover:bg-white/10"
                      )}
                    >
                      <span className="text-xs font-bold text-white block">{style.label}</span>
                      <span className="text-[10px] text-zinc-500 mt-1 line-clamp-1 h-3">{style.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex-1">
              <AnimatePresence>
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-emerald-500 font-medium text-sm"
                  >
                    <CheckCircle className="w-5 h-5 flex-shrink-0" /> Ajustes guardados y sincronizados con éxito.
                  </motion.div>
                )}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-rose-500 font-medium text-sm"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-xl shadow-purple-600/30 font-serif"
            >
              <Save className="w-5 h-5" /> {saving ? 'Guardando...' : 'Guardar Ajustes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
