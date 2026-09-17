import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, collection, addDoc, serverTimestamp } from '../firebase';
import { Sparkles, Image as ImageIcon, Wand2, Loader2 } from 'lucide-react';

export default function Create() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    personality: '',
    greeting: '',
    avatarUrl: '',
    isPublic: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || loading) return;

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'characters'), {
        ...formData,
        creatorId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      navigate(`/chat/${docRef.id}`);
    } catch (error) {
      console.error('Create character error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Wand2 className="w-6 h-6 text-purple-400" />
          <h2 className="text-3xl font-bold text-white">Create Character</h2>
        </div>
        <p className="text-zinc-400">
          Design your own AI companion. Define their personality, backstory, and how they should interact.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Character Name</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Luna the Explorer"
                className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Short Description</label>
              <input
                required
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A curious space traveler from the year 3024."
                className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Avatar URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, avatarUrl: `https://picsum.photos/seed/${Math.random()}/400/600` })}
                  className="p-3 rounded-xl bg-white/5 text-zinc-400 hover:text-white transition-colors"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Personality & Backstory</label>
              <textarea
                required
                rows={5}
                value={formData.personality}
                onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                placeholder="Describe their traits, speech patterns, and history..."
                className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Greeting Message</label>
              <textarea
                required
                rows={3}
                value={formData.greeting}
                onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                placeholder="The first thing they say to the user..."
                className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="w-5 h-5 rounded bg-[#141414] border-white/5 text-purple-600 focus:ring-purple-500/50"
            />
            <label htmlFor="isPublic" className="text-sm text-zinc-400">Make this character public</label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Create Character
          </button>
        </div>
      </form>
    </div>
  );
}
