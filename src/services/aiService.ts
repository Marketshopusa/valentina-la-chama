export interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  mannerism: string;
  langCode: string;
  pitch: number;
  rate: number;
}

export async function getAIResponse(
  characterName: string, 
  story: string, 
  voice: VoiceProfile, 
  history: { text: string, sender: 'user' | 'ai' }[], 
  userMessage: string,
  modoAdulto: boolean = false
) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      characterName,
      story,
      voice,
      history,
      userMessage,
      modoAdulto
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Fallo en la comunicación con el servidor de IA.");
  }

  const data = await response.json();
  return data.text;
}
