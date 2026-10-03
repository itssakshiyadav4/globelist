import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('Login attempt:', { email })
  }

  return (
    <div className="mx-auto mt-8 w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
      <h1 className="text-2xl font-bold text-gray-800">Welcome back</h1>
      <p className="mt-1 text-sm text-gray-500">Log in to your GLOBElist account</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-sky-600 py-2 font-semibold text-white hover:bg-sky-700"
        >
          Log in
        </button>
      </form>
    </div>
  )
}