import React, { useState } from 'react';
import { AudioTrackVolume } from '../types';
import { soundEngine } from '../utils/audioSynth';
import { Volume2, VolumeX, Music, CloudRain, Flame, Coffee, Trees, Moon, Waves, Clock, Sparkles } from 'lucide-react';

interface AmbientSoundMixerProps {
  isOpen: boolean;
  onClose: () => void;
  audioState: AudioTrackVolume;
  onAudioChange: (newState: AudioTrackVolume) => void;
}

export const AmbientSoundMixer: React.FC<AmbientSoundMixerProps> = ({
  isOpen,
  onClose,
  audioState,
  onAudioChange,
}) => {
  if (!isOpen) return null;

  const handleToggleLofi = () => {
    const newPlayState = !audioState.isPlaying;
    if (newPlayState) {
      soundEngine.startLofiChords(audioState.lofiChords);
    } else {
      soundEngine.stopLofiChords();
    }
    onAudioChange({ ...audioState, isPlaying: newPlayState });
  };

  const handleTrackChange = (track: keyof Omit<AudioTrackVolume, 'isPlaying'>, val: number) => {
    const updated = { ...audioState, [track]: val };
    onAudioChange(updated);

    switch (track) {
      case 'lofiChords':
        if (audioState.isPlaying) {
          soundEngine.stopLofiChords();
          soundEngine.startLofiChords(val);
        }
        break;
      case 'rain':
        soundEngine.setRainVolume(val);
        break;
      case 'fireplace':
        soundEngine.setFireplaceVolume(val);
        break;
      case 'cafeMurmur':
        soundEngine.setCafeVolume(val);
        break;
      case 'forestBirds':
        soundEngine.setForestBirdsVolume(val);
        break;
      case 'nightCrickets':
        soundEngine.setNightCricketsVolume(val);
        break;
      case 'clockTick':
        soundEngine.setClockTickVolume(val);
        break;
      case 'master':
        soundEngine.setMasterVolume(val);
        break;
    }
  };

  const tracks: { key: keyof Omit<AudioTrackVolume, 'isPlaying' | 'master'>; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'lofiChords', label: 'Lo-Fi Jazz Chords', icon: <Music className="w-4 h-4" />, color: 'text-purple-400' },
    { key: 'rain', label: 'Gentle Rain', icon: <CloudRain className="w-4 h-4" />, color: 'text-cyan-400' },
    { key: 'fireplace', label: 'Cozy Fireplace', icon: <Flame className="w-4 h-4" />, color: 'text-orange-400' },
    { key: 'cafeMurmur', label: 'Café Murmur', icon: <Coffee className="w-4 h-4" />, color: 'text-amber-400' },
    { key: 'forestBirds', label: 'Forest Birds', icon: <Trees className="w-4 h-4" />, color: 'text-emerald-400' },
    { key: 'nightCrickets', label: 'Night Crickets', icon: <Moon className="w-4 h-4" />, color: 'text-indigo-400' },
    { key: 'clockTick', label: 'Clock Ticking', icon: <Clock className="w-4 h-4" />, color: 'text-rose-400' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 select-none">
      <div className="w-full max-w-lg bg-[#1e1a2f] border border-purple-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl animate-fade-in text-purple-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-800/40 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xl text-purple-300">
              🎧
            </div>
            <div>
              <h2 className="font-cozy font-bold text-lg text-white">Ambient Sound Mixer</h2>
              <p className="text-xs text-purple-300">Procedural lofi chords & relaxing soundscapes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-purple-900/60 text-purple-400 hover:text-white transition-all text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Master Play / Lofi Switch */}
        <div className="bg-purple-950/70 border border-purple-800/50 rounded-2xl p-3.5 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${audioState.isPlaying ? 'bg-purple-600 text-white animate-pulse' : 'bg-purple-900/40 text-purple-400'}`}>
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-cozy font-bold text-xs text-white">Generative Lo-Fi Rhodes</h4>
              <p className="text-[10px] text-purple-300 font-cozy">Warm analog jazz chord loops</p>
            </div>
          </div>

          <button
            onClick={handleToggleLofi}
            className={`px-4 py-2 rounded-xl font-cozy text-xs font-bold transition-all shadow-md active:scale-95 ${
              audioState.isPlaying
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            {audioState.isPlaying ? 'Stop Music' : 'Play Lo-Fi'}
          </button>
        </div>

        {/* Individual Sound Sliders */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1">
          {tracks.map((track) => {
            const val = audioState[track.key];
            return (
              <div
                key={track.key}
                className="bg-purple-950/40 border border-purple-800/30 rounded-2xl p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-[130px]">
                  <div className={`p-1.5 rounded-lg bg-purple-900/40 ${track.color}`}>
                    {track.icon}
                  </div>
                  <span className="text-xs font-cozy font-medium text-purple-100">{track.label}</span>
                </div>

                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={val}
                    onChange={(e) => handleTrackChange(track.key, parseFloat(e.target.value))}
                    className="w-full accent-purple-500 h-1.5 bg-purple-900 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-mono-timer text-purple-400 w-8 text-right">
                    {Math.round(val * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Master Volume */}
        <div className="border-t border-purple-800/40 pt-3 mt-3 flex items-center justify-between gap-3">
          <span className="text-xs font-cozy font-bold text-purple-200">Master Volume</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={audioState.master}
            onChange={(e) => handleTrackChange('master', parseFloat(e.target.value))}
            className="w-44 accent-purple-400 h-2 bg-purple-900 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
