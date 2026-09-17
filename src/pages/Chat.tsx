import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, db, OperationType, handleFirestoreError } from '../firebase';
import { Character } from '../types';
import ChatInterface from '../components/ChatInterface';
import { ChevronLeft, Loader2 } from 'lucide-react';

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [character, setCharacter] = React.useState<Character | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;

    const fetchCharacter = async () => {
      try {
        const docRef = doc(db, 'characters', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCharacter({ id: docSnap.id, ...docSnap.data() } as Character);
        } else {
          navigate('/');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `characters/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!character) return null;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      <div className="absolute top-4 left-4 z-20">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-black/50 text-white hover:bg-purple-600 transition-colors backdrop-blur-md"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>
      <ChatInterface character={character} />
    </div>
  );
}
