
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RecordIcon, PauseIcon, StopIcon, PlayIcon } from './Icons';

type RecorderStatus = 'idle' | 'recording' | 'paused' | 'stopped';

interface RecorderProps {
  onStop: (blob: Blob) => void;
  prompt: string;
}

const MAX_DURATION = 30; // 30 seconds

const Recorder: React.FC<RecorderProps> = ({ onStop, prompt }) => {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  const startTimer = useCallback(() => {
    timerIntervalRef.current = window.setInterval(() => {
      setRecordingTime(prevTime => {
        if (prevTime >= MAX_DURATION - 1) {
          stopRecording();
          return MAX_DURATION;
        }
        return prevTime + 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && status !== 'idle' && status !== 'stopped') {
      mediaRecorderRef.current.stop();
      setStatus('stopped');
      stopTimer();
    }
  }, [status, stopTimer]);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onStop(audioBlob);
        stream.getTracks().forEach(track => track.stop()); // Release microphone
      };

      mediaRecorderRef.current.start();
      setStatus('recording');
      startTimer();
    } catch (err) {
      console.error("Error starting recording:", err);
      // This case should be handled by the parent component's permission check
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.pause();
      setStatus('paused');
      stopTimer();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && status === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
      startTimer();
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
         mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stopTimer]);

  const progressPercentage = (recordingTime / MAX_DURATION) * 100;

  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="text-xl font-semibold mb-4 text-center">{prompt}</h2>
      
      <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4">
        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
      </div>
      <p className="text-2xl font-mono mb-6">{String(recordingTime).padStart(2, '0')}s / {MAX_DURATION}s</p>
      
      <div className="flex items-center space-x-4">
        {status === 'idle' && (
          <button 
            onClick={startRecording} 
            className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            aria-label="Start Recording"
          >
            <RecordIcon className="w-8 h-8"/>
          </button>
        )}
        
        {status === 'recording' && (
          <button 
            onClick={pauseRecording} 
            className="p-4 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-slate-800"
            aria-label="Pause Recording"
          >
            <PauseIcon className="w-8 h-8"/>
          </button>
        )}

        {status === 'paused' && (
          <button 
            onClick={resumeRecording} 
            className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-slate-800"
            aria-label="Resume Recording"
          >
            <PlayIcon className="w-8 h-8"/>
          </button>
        )}
        
        {(status === 'recording' || status === 'paused') && (
           <button 
            onClick={stopRecording}
            className="p-4 bg-slate-600 text-white rounded-full hover:bg-slate-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            aria-label="Stop Recording"
           >
             <StopIcon className="w-8 h-8"/>
           </button>
        )}
      </div>
    </div>
  );
};

export default Recorder;
