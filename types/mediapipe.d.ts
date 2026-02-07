declare module '@mediapipe/hands' {
  export interface HandsConfig {
    locateFile?: (file: string) => string;
  }

  export interface HandsOptions {
    maxNumHands?: number;
    modelComplexity?: number;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }

  export interface HandsResults {
    multiHandLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
    multiHandedness: Array<{ label: string; score: number }>;
    image: HTMLVideoElement | HTMLCanvasElement;
  }

  export class Hands {
    constructor(config?: HandsConfig);
    setOptions(options: HandsOptions): void;
    onResults(callback: (results: HandsResults) => void): void;
    send(inputs: { image: HTMLVideoElement | HTMLCanvasElement }): Promise<void>;
    close(): void;
  }
}

declare module '@mediapipe/camera_utils' {
  export interface CameraOptions {
    onFrame: () => Promise<void>;
    width?: number;
    height?: number;
    facingMode?: string;
  }

  export class Camera {
    constructor(videoElement: HTMLVideoElement, options: CameraOptions);
    start(): Promise<void>;
    stop(): void;
  }
}
