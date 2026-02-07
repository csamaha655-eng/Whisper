import { Suspense, useState, useEffect } from 'react';
import { Scene } from '../3d/Scene';

export function Background() {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[Background] 3D Scene error:', event.error);
      setHasError(true);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {/* Gradient overlay - ALWAYS RENDER THIS */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-dark via-cyber-dark/95 to-cyber-darker" />

      {/* 3D Scene - Only render if no errors */}
      {!hasError && (
        <div className="absolute inset-0 opacity-60">
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </div>
      )}

      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-full h-px bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent"
          style={{
            animation: 'scan-line 8s linear infinite',
          }}
        />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 245, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 245, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Vignette effect */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, transparent 30%, rgba(5, 5, 8, 0.8) 100%)',
        }}
      />
    </div>
  );
}
