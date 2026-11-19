import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Globe2, Loader2, Check } from 'lucide-react';

export const VoiceRecorder = ({ onTranscriptionComplete, onAudioRecorded }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState('en-IN'); // 'en-IN' or 'hi-IN'
  const [recordTime, setRecordTime] = useState(0);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    // Check speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    setTranscript('');
    setRecordTime(0);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    // 1. Start Speech Recognition
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onresult = (event) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript + ' ';
          }
          setTranscript(current.trim());
        };

        recognition.onerror = (event) => {
          console.warn("Speech recognition error:", event.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.error("Speech recognition startup error:", e);
      }
    }

    // 2. Start MediaRecorder for audio recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (onAudioRecorded) {
          onAudioRecorded(audioBlob);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Start elapsed timer
      timerRef.current = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.warn("Microphone permission denied or not available:", err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);

    if (transcript && onTranscriptionComplete) {
      onTranscriptionComplete(transcript);
    }
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-ai-50/70 via-indigo-50/50 to-brand-50/70 border border-ai-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-ai-600 text-white shadow-xs">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Voice Complaint Reporter</h4>
            <p className="text-[11px] text-slate-500">Record in English or Hindi (हिंदी) to auto-fill</p>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
          <Globe2 className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
          <button
            type="button"
            onClick={() => setLanguage('en-IN')}
            className={`px-2 py-0.5 text-xs font-semibold rounded-lg transition-colors ${
              language === 'en-IN' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('hi-IN')}
            className={`px-2 py-0.5 text-xs font-semibold rounded-lg transition-colors ${
              language === 'hi-IN' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            हिंदी
          </button>
        </div>
      </div>

      {/* Recording Control Button & Soundwave */}
      <div className="flex items-center gap-3">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-800 border border-slate-300 hover:border-ai-400 hover:text-ai-700 shadow-xs transition-all active:scale-95"
          >
            <Mic className="w-4 h-4 text-ai-600" />
            Start Voice Recording
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-xs hover:bg-rose-700 transition-all active:scale-95 animate-pulse"
          >
            <MicOff className="w-4 h-4" />
            Stop & Apply ({formatSeconds(recordTime)})
          </button>
        )}

        {isRecording && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-6 bg-ai-500 rounded-full animate-bounce"></span>
            <span className="w-1.5 h-9 bg-ai-600 rounded-full animate-bounce [animation-delay:0.15s]"></span>
            <span className="w-1.5 h-4 bg-ai-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
            <span className="w-1.5 h-8 bg-brand-500 rounded-full animate-bounce [animation-delay:0.1s]"></span>
            <span className="w-1.5 h-5 bg-brand-600 rounded-full animate-bounce [animation-delay:0.25s]"></span>
            <span className="text-xs font-semibold text-ai-700 ml-1">Listening in {language === 'en-IN' ? 'English' : 'Hindi'}...</span>
          </div>
        )}
      </div>

      {/* Live transcript preview */}
      {transcript && (
        <div className="mt-3 p-3 bg-white rounded-xl border border-ai-200 text-xs text-slate-700 shadow-xs animate-in fade-in">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-[11px] text-ai-700 uppercase tracking-wide">Live Transcription:</span>
            {!isRecording && (
              <button
                type="button"
                onClick={() => onTranscriptionComplete(transcript)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
              >
                <Check className="w-3 h-3" /> Insert into Description
              </button>
            )}
          </div>
          <p className="italic text-slate-800 leading-relaxed">"{transcript}"</p>
        </div>
      )}
    </div>
  );
};
