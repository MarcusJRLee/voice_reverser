
import React from 'react';

interface AudioPlayerProps {
  audioUrl: string | null;
  title: string;
  loop?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, title, loop = false }) => {
  if (!audioUrl) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <p className="text-slate-400">No audio available.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <h2 className="text-xl font-semibold mb-4 text-center">{title}</h2>
      <audio controls src={audioUrl} loop={loop} className="w-full max-w-md">
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default AudioPlayer;
