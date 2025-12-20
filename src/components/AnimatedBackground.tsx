const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Main gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float-delayed" />
      <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-float-slow" />
      
      {/* Subtle accent orbs */}
      <div className="absolute top-20 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-2xl animate-pulse-soft" />
      <div className="absolute bottom-1/4 left-20 w-40 h-40 bg-primary/10 rounded-full blur-2xl animate-pulse-soft" style={{ animationDelay: '2s' }} />
      
      {/* Grid overlay for texture */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
    </div>
  );
};

export default AnimatedBackground;
