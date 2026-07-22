import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

const VoiceInput = ({ onResult, lang = 'en-US' }) => {
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = lang;

    recog.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onResult) onResult(transcript);
      setListening(false);
    };

    recog.onerror = () => setListening(false);
    recog.onend = () => setListening(false);

    setRecognition(recog);
    return () => recog.abort();
  }, [lang, onResult]);

  const toggleListening = () => {
    if (!recognition) return;
    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      try {
        recognition.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  };

  if (!recognition) return null;

  return (
    <button
      onClick={toggleListening}
      className={`p-2 rounded-lg transition-all ${
        listening
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
      }`}
      title={listening ? 'Stop listening' : 'Voice input'}
    >
      {listening ? <MicOff size={16} /> : <Mic size={16} />}
    </button>
  );
};

export default VoiceInput;
