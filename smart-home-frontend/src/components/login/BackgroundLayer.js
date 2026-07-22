export default function BackgroundLayer({
  darkMode,
  reducedMotion,
}) {
  if (darkMode) return <div className="absolute inset-0 z-0 pointer-events-none bg-[#050D0A]" />;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {/* Deep background glow - left */}
      <div className="absolute" style={{
        left: '12%', top: '35%',
        width: '1000px', height: '1000px',
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle at center, rgba(22,163,74,0.06) 0%, transparent 60%)',
        filter: 'blur(140px)',
      }} />

      {/* Deep background glow - right */}
      <div className="absolute" style={{
        left: '78%', top: '45%',
        width: '800px', height: '800px',
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle at center, rgba(22,163,74,0.05) 0%, transparent 60%)',
        filter: 'blur(120px)',
      }} />

      {/* Hero area glow - stronger */}
      <div className="absolute" style={{
        left: '30%', top: '62%',
        width: '800px', height: '500px',
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle at center, rgba(22,163,74,0.10) 0%, transparent 55%)',
        filter: 'blur(100px)',
      }} />

      {/* Login card glow */}
      <div className="absolute" style={{
        left: '82%', top: '50%',
        width: '600px', height: '600px',
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle at center, rgba(22,163,74,0.07) 0%, transparent 55%)',
        filter: 'blur(120px)',
      }} />

      {/* Floating blurred circles - top right */}
      <div className="absolute top-12 right-24 w-48 h-48 rounded-full" style={{
        background: 'radial-gradient(circle at 30% 40%, rgba(22,163,74,0.07) 0%, transparent 60%)',
        filter: 'blur(40px)',
        transform: 'rotate(15deg)',
      }} />

      {/* Floating blurred circles - bottom left */}
      <div className="absolute bottom-16 left-16 w-64 h-64 rounded-full" style={{
        background: 'radial-gradient(circle at 60% 70%, rgba(22,163,74,0.06) 0%, transparent 60%)',
        filter: 'blur(45px)',
        transform: 'rotate(-10deg)',
      }} />

      {/* Floating blurred circles - top left subtle */}
      <div className="absolute top-36 left-1/5 w-36 h-36 rounded-full" style={{
        background: 'radial-gradient(circle at center, rgba(22,163,74,0.04) 0%, transparent 60%)',
        filter: 'blur(30px)',
      }} />

      {/* Floating blurred circles - bottom right */}
      <div className="absolute bottom-28 right-32 w-40 h-40 rounded-full" style={{
        background: 'radial-gradient(circle at center, rgba(22,163,74,0.05) 0%, transparent 60%)',
        filter: 'blur(35px)',
      }} />

      {/* Center decorative blur */}
      <div className="absolute top-1/2 left-1/3 w-56 h-56 rounded-full" style={{
        background: 'radial-gradient(circle at center, rgba(22,163,74,0.04) 0%, transparent 60%)',
        filter: 'blur(50px)',
      }} />

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 200px',
      }} />

      {/* Decorative wave - bottom */}
      <svg className="absolute bottom-0 left-0 w-full" style={{ opacity: 0.025, height: '140px' }}
        viewBox="0 0 1440 140" preserveAspectRatio="none">
        <path d="M0,40 C360,100 540,10 720,50 C900,90 1080,10 1440,40 L1440,140 L0,140 Z"
          fill="rgba(22,163,74,0.6)" />
      </svg>

      {/* Decorative wave - bottom reverse */}
      <svg className="absolute bottom-0 left-0 w-full" style={{ opacity: 0.015, height: '100px' }}
        viewBox="0 0 1440 100" preserveAspectRatio="none">
        <path d="M0,60 C240,20 480,100 720,40 C960,-20 1200,80 1440,30 L1440,100 L0,100 Z"
          fill="rgba(22,163,74,0.5)" />
      </svg>

      {/* Soft SVG line pattern - bottom right */}
      <svg className="absolute bottom-0 right-0 w-80 h-80" style={{ opacity: 0.03 }}>
        <path d="M 0 72 Q 36 36, 72 72 T 144 72 T 216 72 T 288 72" stroke="rgba(22,163,74,0.5)" strokeWidth="1" fill="none" />
        <path d="M 0 144 Q 36 108, 72 144 T 144 144 T 216 144 T 288 144" stroke="rgba(22,163,74,0.5)" strokeWidth="1" fill="none" />
        <path d="M 0 216 Q 36 180, 72 216 T 144 216 T 216 216 T 288 216" stroke="rgba(22,163,74,0.5)" strokeWidth="1" fill="none" />
        <path d="M 72 0 Q 108 36, 72 72 T 72 144 T 72 216 T 72 288" stroke="rgba(22,163,74,0.5)" strokeWidth="1" fill="none" />
      </svg>

      {/* Soft SVG line pattern - bottom left */}
      <svg className="absolute bottom-0 left-0 w-64 h-64" style={{ opacity: 0.025 }}>
        <path d="M 0 48 Q 24 24, 48 48 T 96 48 T 144 48 T 192 48" stroke="rgba(22,163,74,0.5)" strokeWidth="1" fill="none" />
        <path d="M 0 96 Q 24 72, 48 96 T 96 96 T 144 96 T 192 96" stroke="rgba(22,163,74,0.5)" strokeWidth="1" fill="none" />
        <path d="M 0 144 Q 24 120, 48 144 T 96 144 T 144 144 T 192 144" stroke="rgba(22,163,74,0.5)" strokeWidth="1" fill="none" />
        <path d="M 48 0 Q 72 24, 48 48 T 48 96 T 48 144 T 48 192" stroke="rgba(22,163,74,0.5)" strokeWidth="1" fill="none" />
      </svg>
    </div>
  );
}
