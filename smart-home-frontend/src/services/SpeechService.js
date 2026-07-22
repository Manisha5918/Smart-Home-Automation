class SpeechService {
  constructor() {
    this.recognition = null;
    this.onResultCallback = null;
    this.onEndCallback = null;
    this.onErrorCallback = null;
  }

  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  isSpeaking() {
    return window.speechSynthesis.speaking;
  }

  startListening({ onResult, onEnd, onError, language } = {}) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (onError) onError('Speech recognition is not supported in this browser.');
      return;
    }

    this.stopListening();

    this.onResultCallback = onResult || null;
    this.onEndCallback = onEnd || null;
    this.onErrorCallback = onError || null;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = language || 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (this.onResultCallback) {
        this.onResultCallback({
          text: finalTranscript || interimTranscript,
          isFinal: !!finalTranscript,
        });
      }
    };

    this.recognition.onend = () => {
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };

    this.recognition.onerror = (event) => {
      if (this.onErrorCallback) {
        this.onErrorCallback(event.error);
      }
    };

    try {
      this.recognition.start();
    } catch (err) {
      if (this.onErrorCallback) {
        this.onErrorCallback(err.message);
      }
    }
  }

  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore errors when stopping
      }
      this.recognition = null;
    }
  }

  speak(text, { lang, onEnd } = {}) {
    return new Promise((resolve) => {
      if (!text) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      if (lang) utterance.lang = lang;

      utterance.onend = () => {
        if (onEnd) onEnd();
        resolve();
      };

      utterance.onerror = () => {
        resolve();
      };

      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 50);
    });
  }

  cancelSpeech() {
    window.speechSynthesis.cancel();
  }

  getVoices() {
    return window.speechSynthesis.getVoices();
  }
}

const speechService = new SpeechService();
export default speechService;
