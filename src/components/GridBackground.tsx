export const GridBackground = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundImage: `
          linear-gradient(to right, hsl(var(--border) / 0.3) 1px, transparent 1px),
          linear-gradient(to bottom, hsl(var(--border) / 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    />
  );
};
