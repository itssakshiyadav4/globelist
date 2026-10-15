import { useCallback, useEffect, useState } from 'react'

type Category =
  | 'TRANSPORT'
  | 'ACCOMMODATION'
  | 'FOOD'
  | 'ACTIVITIES'
  | 'SHOPPING'
  | 'MISC'

type Summary = {
  budget: number | null
  spent: number
  remaining: number | null
  byCategory: Record<Category, number>
}

type Expense = {
  id: string
  title: string
  amount: number
  category: Category
  date: string
  notes: string | null
}

const CATEGORY_LABELS: Record<Category, string> = {
  TRANSPORT: '🚆 Transport',
  ACCOMMODATION: '🏨 Accommodation',
  FOOD: '🍽️ Food',
  ACTIVITIES: '🎟️ Activities',
  SHOPPING: '🛍️ Shopping',
  MISC: '📦 Misc',
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[]

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function sortExpenses(list: Expense[]) {
  return [...list].sort((a, b) => b.date.localeCompare(a.date))
}

export default function BudgetSection({ tripId }: { tripId: string }) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')

  const [budgetInput, setBudgetInput] = useState('')
  const [budgetError, setBudgetError] = useState('')
  const [savingBudget, setSavingBudget] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category>('FOOD')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const refreshSummary = useCallback(async () => {
    const res = await fetch(`/api/trips/${tripId}/budget`)
    if (!res.ok) throw new Error('summary failed')
    const data: Summary = await res.json()
    setSummary(data)
  }, [tripId])

  useEffect(() => {
    Promise.all([
      fetch(`/api/trips/${tripId}/budget`),
      fetch(`/api/trips/${tripId}/expenses`),
    ])
      .then(async ([summaryRes, expensesRes]) => {
        if (!summaryRes.ok || !expensesRes.ok) throw new Error('load failed')
        const s: Summary = await summaryRes.json()
        setSummary(s)
        setBudgetInput(s.budget === null ? '' : String(s.budget))
        setExpenses(await expensesRes.json())
      })
      .catch(() => setLoadError('Could not load the budget'))
      .finally(() => setLoading(false))
  }, [tripId])

  async function handleSaveBudget(e: React.FormEvent) {
    e.preventDefault()
    setBudgetError('')

    const value = budgetInput.trim() === '' ? null : Number(budgetInput)
    if (value !== null && Number.isNaN(value)) {
      setBudgetError('Enter a valid number')
      return
    }

    setSavingBudget(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget: value }),
      })
      const data = await res.json()
      if (!res.ok) {
        setBudgetError(data.error ?? 'Could not save the budget')
        return
      }
      await refreshSummary()
    } catch {
      setBudgetError('Could not reach the server')
    } finally {
      setSavingBudget(false)
    }
  }

  function resetForm() {
    setEditingId(null)
    setTitle('')
    setAmount('')
    setCategory('FOOD')
    setDate('')
    setNotes('')
    setFormError('')
  }

  function handleEdit(expense: Expense) {
    setEditingId(expense.id)
    setTitle(expense.title)
    setAmount(String(expense.amount))
    setCategory(expense.category)
    setDate(expense.date.slice(0, 10))
    setNotes(expense.notes ?? '')
    setFormError('')
    setActionError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setSaving(true)

    const url = editingId
      ? `/api/trips/${tripId}/expenses/${editingId}`
      : `/api/trips/${tripId}/expenses`
    const method = editingId ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          amount: Number(amount),
          category,
          date,
          notes: notes || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setFormError(data.error ?? 'Could not save the expense')
        return
      }

      if (editingId) {
        setExpenses((prev) =>
          sortExpenses(prev.map((x) => (x.id === editingId ? data : x))),
        )
      } else {
        setExpenses((prev) => sortExpenses([...prev, data]))
      }
      resetForm()
      await refreshSummary()
    } catch {
      setFormError('Could not reach the server')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(expenseId: string) {
    if (!window.confirm('Delete this expense?')) return
    setActionError('')

    try {
      const res = await fetch(`/api/trips/${tripId}/expenses/${expenseId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        setActionError('Could not delete the expense')
        return
      }
      setExpenses((prev) => prev.filter((x) => x.id !== expenseId))
      if (editingId === expenseId) resetForm()
      await refreshSummary()
    } catch {
      setActionError('Could not reach the server')
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-brand-500 focus:outline-none'

  if (loading) return <p className="text-gray-500">Loading budget...</p>

  if (loadError || !summary) {
    return (
      <p className="rounded-lg bg-red-50 p-3 text-red-600">
        {loadError || 'Could not load the budget'}
      </p>
    )
  }

  const budget = summary.budget
  const spent = summary.spent
  const percent = budget && budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
  const over = budget !== null && spent > budget
  const usedCategories = CATEGORIES.filter((c) => summary.byCategory[c] > 0)

  return (
    <section>
      <h2 className="text-xl font-bold text-gray-800">💰 Budget</h2>

      <div className="mt-3 rounded-2xl bg-white p-6 shadow-md">
        <form
          onSubmit={handleSaveBudget}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="grow">
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
              Total budget (₹)
            </label>
            <input
              id="budget"
              type="number"
              min="0"
              step="0.01"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="e.g. 20000"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={savingBudget}
            className="rounded-full bg-brand-600 px-6 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {savingBudget ? 'Saving...' : 'Save budget'}
          </button>
        </form>

        {budgetError && (
          <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">{budgetError}</p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500">Budget</p>
            <p className="text-xl font-bold text-gray-800">
              {budget === null ? '—' : money.format(budget)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Spent</p>
            <p className="text-xl font-bold text-gray-800">{money.format(spent)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{over ? 'Over budget by' : 'Remaining'}</p>
            <p
              className={`text-xl font-bold ${over ? 'text-red-600' : 'text-brand-700'}`}
            >
              {summary.remaining === null
                ? '—'
                : money.format(Math.abs(summary.remaining))}
            </p>
          </div>
        </div>

        {budget !== null && (
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-brand-500'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        )}

        {budget === null && (
          <p className="mt-4 text-sm text-gray-500">
            Set a budget above to see how much is left.
          </p>
        )}

        {usedCategories.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {usedCategories.map((c) => (
              <span
                key={c}
                className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-800"
              >
                {CATEGORY_LABELS[c]}: {money.format(summary.byCategory[c])}
              </span>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 rounded-2xl bg-white p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-800">
          {editingId ? 'Edit expense' : 'Add an expense'}
        </h3>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="exp-title" className="block text-sm font-medium text-gray-700">
              What was it for?
            </label>
            <input
              id="exp-title"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="exp-amount" className="block text-sm font-medium text-gray-700">
              Amount (₹)
            </label>
            <input
              id="exp-amount"
              type="number"
              required
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="exp-category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="exp-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="exp-date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              id="exp-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="exp-notes" className="block text-sm font-medium text-gray-700">
            Notes (optional)
          </label>
          <input
            id="exp-notes"
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClass}
          />
        </div>

        {formError && (
          <p className="mt-4 rounded-lg bg-red-50 p-2 text-sm text-red-600">{formError}</p>
        )}

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand-600 px-6 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add expense'}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-gray-300 px-6 py-2 font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-6">
        {actionError && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-600">{actionError}</p>
        )}

        {expenses.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-brand-200 p-8 text-center text-gray-500">
            No expenses yet. Add your first one above 🧾
          </div>
        )}

        <ul className="space-y-3">
          {expenses.map((expense) => (
            <li key={expense.id} className="rounded-2xl bg-white p-4 shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-800">{expense.title}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    <span className="mr-2 rounded-full bg-brand-100 px-2 py-0.5 text-brand-800">
                      {CATEGORY_LABELS[expense.category]}
                    </span>
                    {formatDate(expense.date)}
                  </p>
                  {expense.notes && (
                    <p className="mt-2 text-sm text-gray-600">{expense.notes}</p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold text-gray-800">
                    {money.format(expense.amount)}
                  </p>
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="rounded-full border border-brand-200 px-3 py-1 text-sm font-medium text-brand-700 hover:bg-brand-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="rounded-full border border-red-200 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}