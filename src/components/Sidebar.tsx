import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, Users, Settings, LogOut, PlusCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, googleProvider, signInWithPopup, signInAnonymously } from '../firebase';
import { cn } from '../lib/utils';

export default function Sidebar() {
  const [user, setUser] = React.useState(auth.currentUser);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
      // Fallback to anonymous if popup fails or is blocked
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error('Anonymous fallback failed:', err);
      }
    }
  };

  const handleLogout = () => auth.signOut();

  const navItems = [
    { icon: Home, label: 'Descubrir', path: '/' },
    { icon: MessageSquare, label: 'Mis Chats', path: '/chats' },
    { icon: Users, label: 'Personajes', path: '/characters' },
    { icon: PlusCircle, label: 'Crear', path: '/create' },
    { icon: Settings, label: 'Ajustes', path: '/settings' },
  ];

  return (
    <aside className="w-64 h-screen glass-dark flex flex-col fixed left-0 top-0 z-50 border-r border-white/5">
      <div className="p-8">
        <h1 className="text-3xl font-serif italic font-bold bg-gradient-to-br from-white via-purple-200 to-purple-500 bg-clip-text text-transparent tracking-tighter">
          OpenLover
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                isActive 
                  ? "bg-purple-600/20 text-white shadow-[0_0_20px_rgba(147,51,234,0.1)]" 
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-purple-400" : "group-hover:text-purple-400")} />
                <span className="font-semibold text-[15px]">{item.label}</span>
                {/* Active Indicator */}
                {isActive && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6">
        {user ? (
          <div className="flex items-center gap-4 p-3 rounded-2xl glass hover:bg-white/10 transition-all cursor-pointer group">
            <img 
              src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
              alt="Profile" 
              className="w-11 h-11 rounded-full border-2 border-purple-500/20 group-hover:border-purple-500/50 transition-all"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user.isAnonymous ? 'Invitado' : user.displayName}</p>
              <button 
                onClick={handleLogout}
                className="text-[11px] text-zinc-500 hover:text-purple-400 flex items-center gap-1 uppercase tracking-widest font-bold mt-0.5"
              >
                <LogOut className="w-3 h-3" /> Salir
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-xl shadow-purple-600/20 active:scale-95"
          >
            Conectar
          </button>
        )}
      </div>
    </aside>
  );
}
