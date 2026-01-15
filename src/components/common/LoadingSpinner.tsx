export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full blur-xl opacity-30 animate-pulse" />

        {/* Outer ring */}
        <div className="relative w-14 h-14 rounded-full border-4 border-slate-100" />

        {/* Spinning gradient ring */}
        <div
          className="absolute top-0 left-0 w-14 h-14 rounded-full border-4 border-transparent animate-spin"
          style={{
            borderTopColor: '#6366F1',
            borderRightColor: '#06B6D4',
          }}
        />
      </div>
    </div>
  )
}
