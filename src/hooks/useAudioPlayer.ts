import { useState, useRef, useEffect } from 'react';

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = "anonymous"; // Enable CORS for audio context
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      // Verify duration is valid and finite
      if (isFinite(audio.duration) && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      } else {
        console.warn('Invalid duration detected:', audio.duration);
        setDuration(0);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentTrack(null);
    };
    const handleError = (e: ErrorEvent) => {
      console.error('Audio error:', e);
      handleEnded();
    };

    // Add event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Cleanup function
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);

      // Cleanup audio
      audio.pause();
      audio.src = '';
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);

      // Clean up audio context
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  const initializeAudioContext = (): AudioContext => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      // Type-safe way to handle webkit prefix
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error('AudioContext is not supported in this browser');
      }

      audioContextRef.current = new AudioContextClass();
    }
    return audioContextRef.current;
  };

  const playAudio = async (url: string) => {
    if (!audioRef.current) return;

    try {
      if (currentTrack !== url) {
        audioRef.current.src = url;
        setCurrentTrack(url);
        // Reset states when loading new track
        setCurrentTime(0);
        setDuration(0);
      }

      // Initialize audio context on user interaction
      const audioContext = initializeAudioContext();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Wait for metadata to load before playing
      if (audioRef.current.readyState < 2) { // HAVE_CURRENT_DATA
        await new Promise((resolve) => {
          audioRef.current!.addEventListener('loadedmetadata', resolve, { once: true });
        });
      }

      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentTrack(null);
    }
  };

  return {
    playAudio,
    pauseAudio,
    stopAudio,
    isPlaying,
    currentTime,
    duration,
    currentTrack,
    audioElement: audioRef.current,
    audioContext: audioContextRef.current
  };
}