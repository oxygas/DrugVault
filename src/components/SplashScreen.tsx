export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black splash-overlay">
      <div className="flex flex-col items-center justify-center">
        <img
          src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExYXFkdHQzaHphODF6Y3Rlb2JnMTYybzlsaHVibG8zZXNpYjAybWc4NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Wt0zLr2PkDbDkfQOSo/giphy.gif"
          alt="TripGem"
          className="w-20 h-20 sm:w-32 sm:h-32 mb-4"
        />
        <div className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white text-center">
          <span className="tripgem-text-trip">Trip</span><span className="tripgem-text-gem">Gem</span>
        </div>
        <div className="w-48 sm:w-56 h-1 mt-6 mx-auto rounded-full bg-gray-800 overflow-hidden">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 loading-bar-fill" />
        </div>
        <div className="text-xs sm:text-sm text-gray-500 tracking-widest uppercase mt-4">
          not working on overdoing
        </div>
      </div>
      <div className="absolute bottom-6 text-center">
        <div className="text-[10px] sm:text-xs text-gray-600 tracking-widest uppercase">
          loading harm reduction data
        </div>
      </div>
    </div>
  )
}
