import React, { useMemo, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useI18n } from '../../i18n/translations';
import { useToast } from '../../context/ToastContext';

export function VoiceMicButton({
  onTranscript,
  className = '',
}: {
  onTranscript: (spokenText: string) => void;
  className?: string;
}) {
  const { lang, bi } = useI18n();
  const { showToast } = useToast();
  const [listening, setListening] = useState(false);

  const SpeechRec = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
  }, []);

  // Hide cleanly if browser does not support Web Speech API
  if (!SpeechRec) return null;

  const handleListen = () => {
    if (listening) return;
    try {
      const recognition = new SpeechRec();
      recognition.lang = lang === 'ur' ? 'ur-PK' : 'en-PK';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onerror = () => {
        setListening(false);
        showToast(bi('Could not capture voice input. Please try again or type.', 'آواز ریکارڈ نہ ہو سکی، براہِ کرم دوبارہ کوشش کریں یا ٹائپ کریں۔'), 'info');
      };
      recognition.onresult = (event: any) => {
        const text = event?.results?.[0]?.[0]?.transcript;
        if (text) {
          onTranscript(String(text).trim());
        }
      };
      recognition.start();
    } catch {
      setListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleListen}
      disabled={listening}
      title={bi('Speak in Urdu or English', 'اردو یا انگریزی میں بول کر لکھوائیں')}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
        listening
          ? 'border-red-300 bg-red-50 text-red-700 animate-pulse'
          : 'border-[#D8D0BE] bg-[#ECE6D7]/50 text-[#176B4A] hover:bg-[#ECE6D7]'
      } ${className}`}
    >
      {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
      <span>{listening ? bi('Listening...', 'سن رہے ہیں...') : bi('Speak', 'بول کر لکھیں')}</span>
    </button>
  );
}
