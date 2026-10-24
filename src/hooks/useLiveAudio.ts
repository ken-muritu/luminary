import { useAudioStream } from "./useAudioStream";

/** @deprecated Use useAudioStream directly */
export function useLiveAudio(active: boolean) {
  const { level, devices, error } = useAudioStream(active);
  return { level, devices, error };
}
