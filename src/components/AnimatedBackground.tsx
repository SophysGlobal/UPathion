const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Main gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[100px] animate-float" />
      <div className="absolute top-1/2 -right-32 w-[400px] h-[400px] bg-accent/25 rounded-full blur-[100px] animate-float-delayed" />
      <div className="absolute -bottom-32 left-1/3 w-[350px] h-[350px] bg-primary/20 rounded-full blur-[100px] animate-float-slow" />
      
      {/* Secondary orbs for depth */}
      <div className="absolute top-20 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-[80px] animate-pulse-soft" />
      <div className="absolute bottom-1/4 left-20 w-56 h-56 bg-primary/15 rounded-full blur-[80px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
      <div className="absolute top-2/3 right-10 w-32 h-32 bg-primary/25 rounded-full blur-[60px] animate-float" style={{ animationDelay: '3s' }} />
      
      {/* Accent highlights */}
      <div className="absolute top-10 left-1/2 w-24 h-24 bg-accent/30 rounded-full blur-[50px] animate-pulse-soft" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-40 right-1/3 w-40 h-40 bg-primary/20 rounded-full blur-[70px] animate-float-delayed" />
      
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--foreground-rgb,255,255,255),0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--foreground-rgb,255,255,255),0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background/60" />
    </div>
  );
};

export default AnimatedBackground;
