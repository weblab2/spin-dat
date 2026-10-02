/// <reference types="next" />
/// <reference types="next/image-types/global" />

declare module '*.worker.ts' {
  class WebpackWorker extends Worker {
    constructor();
  }
  export default WebpackWorker;
}
