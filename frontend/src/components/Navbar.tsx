export default function Navbar() {
  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <span className="text-xl font-bold text-sky-600">GLOBElist 🌍</span>
        <div className="flex gap-4 text-sm text-gray-600 md:gap-8 md:text-base">
          <a href="#" className="hover:text-sky-600">Trips</a>
          <a href="#" className="hover:text-sky-600">Login</a>
        </div>
      </nav>
    </header>
  )
}