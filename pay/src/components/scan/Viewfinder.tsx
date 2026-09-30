import { RefObject } from 'react';

interface ViewfinderProps {
  videoRef: RefObject<HTMLVideoElement | null>;
}

export function Viewfinder({ videoRef }: ViewfinderProps) {
  return (
    <>
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      <div className="relative flex flex-col items-center justify-center w-full z-10">
        <div className="relative w-[70%] max-w-[280px] aspect-square">
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl"></div>
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl"></div>
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl"></div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl"></div>

          <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent animate-scan-line motion-reduce:animate-none top-1/2 -ml-2 -mr-2"></div>
        </div>
        <p className="mt-8 text-white/80 text-[14px] font-medium text-center px-4">
          Point at a QR code · PayRaksha checks it before you pay
        </p>
      </div>
    </>
  );
}
