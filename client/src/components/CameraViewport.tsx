import type { RefObject } from 'react';

interface CameraViewportProps {
  videoRef: RefObject<HTMLVideoElement>;
  isCameraActive: boolean;
  countdown: number | null;
  isFlashVisible: boolean;
}

export const CameraViewport = ({
  videoRef,
  isCameraActive,
  countdown,
  isFlashVisible
}: CameraViewportProps) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black shadow-glow">
      <div className="relative aspect-[4/3] w-full">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full scale-x-[-1] object-cover"
        />

        {!isCameraActive && (
          <div className="absolute inset-0 grid place-items-center bg-noir-950/90 backdrop-blur-sm">
            <p className="max-w-sm px-4 text-center text-sm text-zinc-300">
              Camera preview appears here after you click Start Camera.
            </p>
          </div>
        )}

        {typeof countdown === 'number' && (
          <div className="absolute inset-0 grid place-items-center bg-black/35">
            <span className="font-heading text-8xl text-brass-200 drop-shadow-[0_8px_40px_rgba(245,209,127,0.7)]">
              {countdown}
            </span>
          </div>
        )}

        {isFlashVisible && <div className="pointer-events-none absolute inset-0 animate-flash bg-white" />}
      </div>
    </div>
  );
};
