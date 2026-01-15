export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-slate-100 bg-white/60 backdrop-blur-xl">
      <div className="container py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-accent-400 rounded-xl blur-lg opacity-40" />
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">E</span>
              </div>
            </div>
            <div>
              <span className="font-bold text-base tracking-wide">
                <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">Edu</span>
                <span className="bg-gradient-to-r from-accent-500 to-accent-600 bg-clip-text text-transparent"> FLI</span>
              </span>
              <p className="text-[10px] text-slate-400 tracking-wider font-medium">Education & Future Learning Innovation</p>
            </div>
          </div>

          {/* Info */}
          <div className="text-center">
            <p className="text-xs text-slate-500 font-medium">
              전주교육대학교 교육공학 동아리
            </p>
          </div>

          {/* Copyright */}
          <p className="text-xs text-slate-400">
            &copy; {currentYear} Edu FLI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
