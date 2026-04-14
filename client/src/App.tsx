import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionButton } from './components/ActionButton';
import { CameraViewport } from './components/CameraViewport';
import { CapturedPhotoCard } from './components/CapturedPhotoCard';
import { LayoutSelector } from './components/LayoutSelector';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useCamera } from './hooks/useCamera';
import type { CapturedPhoto, FilterOption, LayoutOption } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const captureFrame = (videoElement: HTMLVideoElement): string => {
  const width = videoElement.videoWidth || 1280;
  const height = videoElement.videoHeight || 720;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to access canvas context.');
  }

  context.save();
  context.translate(width, 0);
  context.scale(-1, 1);
  context.drawImage(videoElement, 0, 0, width, height);
  context.restore();

  return canvas.toDataURL('image/jpeg', 0.95);
};

const playShutterSound = async (audioContextRef: { current: AudioContext | null }) => {
  const Context = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Context) {
    return;
  }

  if (!audioContextRef.current) {
    audioContextRef.current = new Context();
  }

  const ctx = audioContextRef.current;
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.08);

  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.23, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.11);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.12);
};

const createPhoto = (dataUrl: string): CapturedPhoto => ({
  id: crypto.randomUUID(),
  dataUrl,
  filter: 'original'
});

const App = () => {
  const { videoRef, isCameraActive, isStarting, error: cameraError, startCamera } = useCamera();

  const [layout, setLayout] = useState<LayoutOption>(3);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [caption, setCaption] = useState('');
  const [countdownEnabled, setCountdownEnabled] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isFlashVisible, setIsFlashVisible] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStripUrl, setGeneratedStripUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  const shotsNeeded = layout - photos.length;
  const canCapture = isCameraActive && !isCapturing && photos.length < layout;
  const isReadyToGenerate = photos.length === layout;

  useEffect(() => {
    if (photos.length > layout) {
      setPhotos((prev) => prev.slice(0, layout));
    }
  }, [layout, photos.length]);

  useEffect(() => {
    return () => {
      if (generatedStripUrl) {
        URL.revokeObjectURL(generatedStripUrl);
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {
          // Ignore teardown audio errors.
        });
      }
    };
    // cleanup only on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stripFilename = useMemo(() => `photobooth-strip-${layout}x-${Date.now()}.png`, [layout]);

  const clearGeneratedStrip = () => {
    setGeneratedStripUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }

      return null;
    });
  };

  const executeCapture = async () => {
    const video = videoRef.current;
    if (!video) {
      setErrorMessage('Camera preview is unavailable. Restart camera and try again.');
      return;
    }

    const dataUrl = captureFrame(video);
    setPhotos((prev) => [...prev, createPhoto(dataUrl)].slice(0, layout));

    setIsFlashVisible(true);
    window.setTimeout(() => setIsFlashVisible(false), 280);

    await playShutterSound(audioContextRef);
    clearGeneratedStrip();
  };

  const handleCapture = async () => {
    if (!canCapture) {
      return;
    }

    setErrorMessage(null);
    setIsCapturing(true);

    try {
      if (countdownEnabled) {
        for (let second = 3; second >= 1; second -= 1) {
          setCountdown(second);
          await sleep(1000);
        }
      }

      setCountdown(null);
      await executeCapture();
    } catch (error) {
      console.error(error);
      setErrorMessage('Capture failed. Please try again.');
    } finally {
      setIsCapturing(false);
      setCountdown(null);
    }
  };

  const handleRetake = () => {
    setPhotos([]);
    setErrorMessage(null);
    clearGeneratedStrip();
  };

  const handleFilterChange = (photoId: string, nextFilter: FilterOption) => {
    setPhotos((prev) =>
      prev.map((photo) => (photo.id === photoId ? { ...photo, filter: nextFilter } : photo))
    );
    clearGeneratedStrip();
  };

  const handleGenerateStrip = async () => {
    if (!isReadyToGenerate) {
      setErrorMessage(`Capture ${shotsNeeded} more photo(s) before generating your strip.`);
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/generate-strip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          photos: photos.map((photo) => photo.dataUrl),
          filters: photos.map((photo) => photo.filter),
          text: caption,
          layout
        })
      });

      if (!response.ok) {
        let message = 'Strip generation failed.';
        try {
          const payload = (await response.json()) as { error?: string };
          if (payload.error) {
            message = payload.error;
          }
        } catch {
          // Ignore parsing errors and use fallback message.
        }

        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      setGeneratedStripUrl((previousUrl) => {
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }

        return url;
      });
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : 'Strip generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedStripUrl) {
      return;
    }

    const link = document.createElement('a');
    link.href = generatedStripUrl;
    link.download = stripFilename;
    document.body.append(link);
    link.click();
    link.remove();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-noir-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(201,149,69,0.26),transparent_33%),radial-gradient(circle_at_78%_8%,rgba(56,189,248,0.12),transparent_32%),linear-gradient(145deg,#08090b_0%,#10131a_45%,#07080b_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,#ffffff1e_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1e_1px,transparent_1px)] [background-size:22px_22px]" />

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-7 px-4 py-8 sm:px-6 lg:px-10">
        <header className="animate-rise">
          <p className="mb-1 text-xs uppercase tracking-[0.18em] text-brass-200/80">Classic booth aesthetics</p>
          <h1 className="font-heading text-3xl text-brass-200 sm:text-5xl">PhotoBooth Strip Maker</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-300 sm:text-base">
            Capture {layout} shots, style each one with its own effect, and export a polished strip PNG.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
          <div className="space-y-4 rounded-3xl border border-white/10 bg-noir-900/65 p-4 backdrop-blur-md sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <LayoutSelector value={layout} onChange={setLayout} />

              <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-noir-950/40 px-3 py-2 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={countdownEnabled}
                  onChange={(event) => setCountdownEnabled(event.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-noir-900 text-brass-300 focus:ring-brass-300"
                />
                3s Countdown
              </label>
            </div>

            <CameraViewport
              videoRef={videoRef}
              isCameraActive={isCameraActive}
              countdown={countdown}
              isFlashVisible={isFlashVisible}
            />

            <div className="flex flex-wrap gap-3">
              <ActionButton onClick={startCamera} disabled={isStarting}>
                Start Camera
              </ActionButton>
              <ActionButton variant="accent" onClick={handleCapture} disabled={!canCapture}>
                {isCapturing ? 'Capturing...' : 'Capture'}
              </ActionButton>
              <ActionButton variant="danger" onClick={handleRetake} disabled={!photos.length && !generatedStripUrl}>
                Retake
              </ActionButton>
            </div>

            <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
              {isReadyToGenerate ? 'All shots captured' : `${shotsNeeded} shot(s) remaining`}
            </p>

            {(cameraError || errorMessage) && (
              <div className="rounded-xl border border-rose-300/30 bg-rose-900/25 px-3 py-2 text-sm text-rose-200">
                {cameraError ?? errorMessage}
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-3xl border border-white/10 bg-noir-900/70 p-4 backdrop-blur-md sm:p-5">
            <h2 className="font-heading text-2xl text-brass-200">Strip Controls</h2>

            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-zinc-300">
              Bottom Text Tab
              <input
                type="text"
                maxLength={34}
                value={caption}
                onChange={(event) => {
                  setCaption(event.target.value);
                  clearGeneratedStrip();
                }}
                placeholder="Best Day Ever"
                className="mt-2 w-full rounded-xl border border-white/10 bg-noir-950/80 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-brass-300"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <ActionButton onClick={handleGenerateStrip} disabled={isGenerating || !isReadyToGenerate}>
                Generate Strip
              </ActionButton>
              <ActionButton variant="ghost" onClick={handleDownload} disabled={!generatedStripUrl}>
                Download
              </ActionButton>
              {isGenerating && <LoadingSpinner />}
            </div>

            <div className="rounded-2xl border border-white/10 bg-noir-950/75 p-3">
              {generatedStripUrl ? (
                <img
                  src={generatedStripUrl}
                  alt="Generated photo strip"
                  className="mx-auto max-h-[460px] rounded-lg border border-white/10 object-contain"
                />
              ) : (
                <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-white/15 bg-noir-900/40 text-sm text-zinc-400">
                  Generated strip preview appears here.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-3xl border border-white/10 bg-noir-900/70 p-4 backdrop-blur-md sm:p-5">
          <h3 className="font-heading text-2xl text-brass-200">Captured Frames</h3>
          {!photos.length ? (
            <p className="text-sm text-zinc-400">Capture your first shot to start building the strip.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {photos.map((photo, index) => (
                <CapturedPhotoCard
                  key={photo.id}
                  photo={photo}
                  index={index}
                  onFilterChange={handleFilterChange}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
