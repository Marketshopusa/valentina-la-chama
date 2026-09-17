import React from 'react';
import { useNavigate } from 'react-router-dom';
import { db, collection, getDocs, deleteDoc, doc, updateDoc, query, where, handleFirestoreError, OperationType } from '../firebase';
import { Character } from '../types';
import { auth } from '../firebase';
import { Users, Trash2, Edit3, Plus, Sparkles, BookOpen, AlertCircle, Save, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Characters() {
  const navigate = useNavigate();
  const [myCharacters, setMyCharacters] = React.useState<Character[]>([]);
  const [allCharacters, setAllCharacters] = React.useState<Character[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingChar, setEditingChar] = React.useState<Character | null>(null);

  // Form states for editing
  const [editName, setEditName] = React.useState('');
  const [editDesc, setEditDesc] = React.useState('');
  const [editPers, setEditPers] = React.useState('');
  const [editGreet, setEditGreet] = React.useState('');
  const [editAvatar, setEditAvatar] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'mine' | 'all'>('mine');

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'characters'));
      const querySnapshot = await getDocs(q);
      const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Character));
      
      setAllCharacters(list);
      if (auth.currentUser) {
        setMyCharacters(list.filter(c => c.creatorId === auth.currentUser?.uid));
      } else {
        setMyCharacters([]);
      }
    } catch (error) {
      console.error('Error fetching characters:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCharacters();
  }, [auth.currentUser]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que deseas eliminar este personaje? Esta acción es irreversible.')) return;
    
    try {
      await deleteDoc(doc(db, 'characters', id));
      // Remove from lists
      setMyCharacters(prev => prev.filter(c => c.id !== id));
      setAllCharacters(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting character:', error);
      alert('Hubo un error al eliminar el personaje. Inténtalo de nuevo.');
    }
  };

  const startEdit = (char: Character, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChar(char);
    setEditName(char.name);
    setEditDesc(char.description || '');
    setEditPers(char.personality);
    setEditGreet(char.greeting);
    setEditAvatar(char.avatarUrl);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChar) return;

    try {
      const charRef = doc(db, 'characters', editingChar.id);
      await updateDoc(charRef, {
        name: editName,
        description: editDesc,
        personality: editPers,
        greeting: editGreet,
        avatarUrl: editAvatar
      });

      // Update locally
      await fetchCharacters();
      setEditingChar(null);
    } catch (error) {
      console.error('Error updating character:', error);
      alert('Hubo un error al actualizar el personaje.');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 font-medium">Cargando personajes...</p>
        </div>
      </div>
    );
  }

  const currentList = activeTab === 'mine' ? myCharacters : allCharacters;

  return (
    <div className="min-h-screen pb-20 px-12 pt-12 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-900/10 blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-900/10 blur-3xl" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600/10 rounded-2xl border border-purple-500/20 text-purple-400">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white font-serif">Personajes de IA</h1>
              <p className="text-zinc-400 mt-1">Crea, edita y explora compañeros de conversación únicos.</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/create')}
            className="flex items-center gap-2 px-6 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-purple-600/20 active:scale-95 text-sm md:text-base cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-5 h-5" /> Crear Personaje
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-white/5 mb-10 gap-8">
          <button
            onClick={() => setActiveTab('mine')}
            className={cn(
              "pb-4 font-semibold text-base transition-all relative px-2 cursor-pointer",
              activeTab === 'mine' ? "text-purple-400 font-bold" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Mis Personajes
            {activeTab === 'mine' && (
              <motion.div layoutId="subTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-purple-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "pb-4 font-semibold text-base transition-all relative px-2 cursor-pointer",
              activeTab === 'all' ? "text-purple-400 font-bold" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Todos los Personajes
            {activeTab === 'all' && (
              <motion.div layoutId="subTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-purple-500" />
            )}
          </button>
        </div>

        {/* List Grid */}
        {currentList.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-12 rounded-[2rem] text-center border border-white/5 shadow-2xl"
          >
            <div className="w-16 h-16 bg-purple-600/15 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">No se encontraron personajes</h3>
            <p className="text-zinc-400 max-w-sm mx-auto mb-6 text-sm">
              {activeTab === 'mine' 
                ? '¿Aún no has creado tu primer personaje? Da rienda suelta a tu imaginación ahora mismo.' 
                : 'No hay personajes disponibles todavía.'}
            </p>
            {activeTab === 'mine' && (
              <button 
                onClick={() => navigate('/create')}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg text-sm"
              >
                Crear Ahora
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {currentList.map((char) => (
                <motion.div
                  key={char.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => navigate(`/chat/${char.id}`)}
                  className="glass hover:bg-white/5 border border-white/5 hover:border-purple-500/20 p-5 rounded-3xl cursor-pointer group transition-all duration-300 flex flex-col justify-between shadow-xl min-h-[300px]"
                >
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <img 
                        src={char.avatarUrl} 
                        alt={char.name} 
                        className="w-16 h-16 rounded-2xl object-cover border border-white/10 group-hover:border-purple-500/30 transition-all shadow-md"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors truncate">{char.name}</h3>
                          {char.category && (
                            <span className="text-[9px] uppercase tracking-wider font-extrabold bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">
                              {char.category}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 font-medium truncate mt-0.5">Creador: {char.creatorId === auth.currentUser?.uid ? 'Tú' : 'Comunidad'}</p>
                      </div>
                    </div>

                    <p className="text-sm text-zinc-400 line-clamp-3 mb-4 h-12 leading-relaxed">{char.description || 'Sin descripción disponible'}</p>
                    
                    <div className="glass-dark border border-white/5 rounded-xl p-3 mb-4 text-xs">
                      <span className="block font-bold text-purple-400 mb-1 font-mono uppercase tracking-wider">Saludo:</span>
                      <p className="text-zinc-300 italic line-clamp-2">"{char.greeting}"</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                    <span className="text-xs text-purple-400 font-bold group-hover:underline flex items-center gap-1">
                      Chatear ahora <ExternalLink className="w-3 h-3" />
                    </span>

                    {/* Creator actions */}
                    {char.creatorId === auth.currentUser?.uid && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => startEdit(char, e)}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                          title="Editar Personaje"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(char.id, e)}
                          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Eliminar Personaje"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Edit Modal */}
        <AnimatePresence>
          {editingChar && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              {/* Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingChar(null)}
                className="absolute inset-0 bg-[#000]/80 backdrop-blur-md"
              />

              {/* Form Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass-dark border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden z-10 shadow-2xl"
              >
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold font-serif text-white">Editar Compañero</h2>
                    <p className="text-xs text-zinc-500 mt-1">Modifica la mentalidad y personalidad del personaje.</p>
                  </div>
                  <button 
                    onClick={() => setEditingChar(null)}
                    className="p-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 font-mono uppercase tracking-widest mb-2">Nombre del Personaje</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 font-mono uppercase tracking-widest mb-2">URL de Imagen Avatar</label>
                      <input 
                        type="url" 
                        value={editAvatar}
                        onChange={(e) => setEditAvatar(e.target.value)}
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 font-mono uppercase tracking-widest mb-2">Descripción Corta</label>
                    <input 
                      type="text" 
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Una breve descripción intrigante..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 font-mono uppercase tracking-widest mb-2">Saludo Inicial</label>
                    <textarea 
                      value={editGreet}
                      onChange={(e) => setEditGreet(e.target.value)}
                      required
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 transition-all text-sm resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 font-mono uppercase tracking-widest mb-2">Personalidad y Configuración del Modelo (System Prompt)</label>
                    <textarea 
                      value={editPers}
                      onChange={(e) => setEditPers(e.target.value)}
                      required
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 transition-all text-sm resize-none leading-relaxed"
                    />
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setEditingChar(null)}
                      className="px-6 py-3 border border-white/10 hover:border-white/20 text-white font-bold rounded-xl transition-all text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg text-xs"
                    >
                      <Save className="w-4 h-4" /> Guardar Cambios
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
