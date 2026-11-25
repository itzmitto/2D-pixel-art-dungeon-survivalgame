export interface FrameScheduler<Handle> {
  request(callback: (timestamp: number) => void): Handle;
  cancel(handle: Handle): void;
}

export interface GameLoop {
  start(): void;
  stop(): void;
  isRunning(): boolean;
}

export interface GameLoopOptions<Handle> {
  readonly scheduler: FrameScheduler<Handle>;
  readonly update: (deltaSeconds: number) => void;
  readonly render: (timestampSeconds: number) => void;
  readonly maxDeltaSeconds?: number;
}

export function createGameLoop<Handle>(options: GameLoopOptions<Handle>): GameLoop {
  const maxDelta = options.maxDeltaSeconds ?? 0.033;
  let running = false;
  let frameHandle: Handle | undefined;
  let previousTimestamp: number | undefined;

  const frame = (timestampMilliseconds: number): void => {
    if (!running) return;
    const elapsed = previousTimestamp === undefined ? 0 : (timestampMilliseconds - previousTimestamp) / 1000;
    previousTimestamp = timestampMilliseconds;
    options.update(Math.max(0, Math.min(elapsed, maxDelta)));
    options.render(timestampMilliseconds / 1000);
    if (running) frameHandle = options.scheduler.request(frame);
  };

  return {
    start(): void {
      if (running) return;
      running = true;
      previousTimestamp = undefined;
      frameHandle = options.scheduler.request(frame);
    },
    stop(): void {
      if (!running) return;
      running = false;
      previousTimestamp = undefined;
      if (frameHandle !== undefined) options.scheduler.cancel(frameHandle);
      frameHandle = undefined;
    },
    isRunning: () => running,
  };
}

export const browserFrameScheduler: FrameScheduler<number> = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (handle) => cancelAnimationFrame(handle),
};
