import Navbar from './components/Navbar'

function App() {
  return (
    <div className="min-h-screen bg-sky-50">
      <Navbar />
      <main className="mx-auto max-w-5xl p-4">
        <h1 className="text-2xl font-bold text-gray-800 md:text-4xl">
          Welcome to GLOBElist
        </h1>
        <p className="mt-2 text-gray-600">Plan. Organize. Track. Remember.</p>
      </main>
    </div>
  )
}

export default App