
import React, { useState, useCallback } from 'react';
import { AppStep } from './types';
import Recorder from './components/Recorder';
import AudioPlayer from './components/AudioPlayer';
import { reverseAudioBuffer, audioBufferToWavBlob } from './services/AudioProcessor';
import { ResetIcon } from './components/Icons';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.IDLE);
  const [originalAudioBlob, setOriginalAudioBlob] = useState<Blob | null>(null);
  const [reversedOriginalAudioUrl, setReversedOriginalAudioUrl] = useState<string | null>(null);
  const [reversedImitationAudioUrl, setReversedImitationAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processAndReverseAudio = useCallback(async (blob: Blob, target: 'original' | 'imitation') => {
    if (target === 'original') {
      setStep(AppStep.PROCESSING_ORIGINAL);
    } else {
      setStep(AppStep.PROCESSING_IMITATION);
    }

    const reversedBuffer = await reverseAudioBuffer(blob);
    if (reversedBuffer) {
      const wavBlob = audioBufferToWavBlob(reversedBuffer);
      const url = URL.createObjectURL(wavBlob);
      if (target === 'original') {
        setReversedOriginalAudioUrl(url);
        setStep(AppStep.PLAYING_REVERSED_ORIGINAL);
      } else {
        setReversedImitationAudioUrl(url);
        setStep(AppStep.PLAYING_REVERSED_IMITATION);
      }
    } else {
      setError('Failed to process audio. Please try again.');
      setStep(AppStep.IDLE);
    }
  }, []);

  const handleOriginalRecordingComplete = useCallback((blob: Blob) => {
    setOriginalAudioBlob(blob);
    processAndReverseAudio(blob, 'original');
  }, [processAndReverseAudio]);

  const handleImitationRecordingComplete = useCallback((blob: Blob) => {
    processAndReverseAudio(blob, 'imitation');
  }, [processAndReverseAudio]);

  const handleStart = async () => {
    setStep(AppStep.REQUESTING_PERMISSION);
    try {
      // Quick check for permissions
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setStep(AppStep.RECORDING_ORIGINAL);
    } catch (err) {
      console.error("Permission denied:", err);
      setStep(AppStep.PERMISSION_DENIED);
    }
  };

  const resetApp = () => {
    setStep(AppStep.IDLE);
    setOriginalAudioBlob(null);
    setReversedOriginalAudioUrl(null);
    setReversedImitationAudioUrl(null);
    setError(null);
  };
  
  const renderContent = () => {
    switch (step) {
      case AppStep.IDLE:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to Backward Vocal Fun!</h2>
            <p className="mb-6 text-slate-400">Record yourself, hear it backward, then try to sing the backward version. The result is often hilarious!</p>
            <button
              onClick={handleStart}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300"
            >
              Start the Fun
            </button>
          </div>
        );
      case AppStep.REQUESTING_PERMISSION:
        return <p className="text-center text-slate-400">Requesting microphone access...</p>;
      case AppStep.PERMISSION_DENIED:
        return (
           <div className="text-center text-red-400">
            <h2 className="text-2xl font-bold mb-4">Microphone Access Denied</h2>
            <p className="mb-6">This app needs microphone access to work. Please enable it in your browser settings and refresh the page.</p>
            <button
              onClick={resetApp}
              className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Try Again
            </button>
          </div>
        );
      case AppStep.RECORDING_ORIGINAL:
        return <Recorder onStop={handleOriginalRecordingComplete} prompt="Step 1: Record yourself singing for up to 30 seconds." />;
      case AppStep.PROCESSING_ORIGINAL:
        return <p className="text-center text-slate-400 animate-pulse">Processing your masterpiece...</p>;
      case AppStep.PLAYING_REVERSED_ORIGINAL:
        return (
          <div className="text-center">
            <AudioPlayer audioUrl={reversedOriginalAudioUrl} title="Step 2: Listen to it backward" />
            <button
              onClick={() => setStep(AppStep.RECORDING_IMITATION)}
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300"
            >
              I'm Ready to Imitate!
            </button>
          </div>
        );
      case AppStep.RECORDING_IMITATION:
        return <Recorder onStop={handleImitationRecordingComplete} prompt="Step 3: Now, try to imitate the backward sound!" />;
      case AppStep.PROCESSING_IMITATION:
        return <p className="text-center text-slate-400 animate-pulse">Reversing your imitation...</p>;
      case AppStep.PLAYING_REVERSED_IMITATION:
        return (
          <div className="text-center">
             <AudioPlayer audioUrl={reversedImitationAudioUrl} title="The Big Reveal! Does it sound like your original?" loop={true} />
             <button
              onClick={resetApp}
              className="mt-8 bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center mx-auto"
            >
              <ResetIcon className="w-5 h-5 mr-2"/>
              Start Over
            </button>
          </div>
        );
      default:
        return <p>Something went wrong.</p>;
    }
  };

  return (
    <div className="min-h-screen text-slate-200 flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-2xl mx-auto">
        <div className="bg-slate-800 rounded-xl shadow-2xl p-6 sm:p-10 border border-slate-700">
          {error && <p className="text-red-400 text-center mb-4">{error}</p>}
          {renderContent()}
        </div>
        <footer className="text-center mt-8 text-slate-500 text-sm">
            <p>Built by a world-class senior frontend React engineer.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
