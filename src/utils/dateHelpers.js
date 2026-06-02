export const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/

const parseLocalDate = (value = new Date()) => {
  if (value instanceof Date) {
    return new Date(value)
  }

  if (typeof value === 'string' && dateKeyPattern.test(value)) {
    const [year, month, day] = value.split('-').map(Number)

    return new Date(year, month - 1, day)
  }

  return new Date(value)
}

export const toDateKey = (value = new Date()) => {
  if (typeof value === 'string' && dateKeyPattern.test(value)) {
    return value
  }

  const date = parseLocalDate(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const startOfDay = (value = new Date()) => {
  const date = parseLocalDate(value)
  date.setHours(0, 0, 0, 0)

  return date
}

export const startOfWeek = (value = new Date()) => {
  const date = startOfDay(value)
  const day = date.getDay()
  const offset = day === 0 ? 6 : day - 1
  date.setDate(date.getDate() - offset)

  return date
}

export const addDays = (value, amount) => {
  const date = parseLocalDate(value)
  date.setDate(date.getDate() + amount)

  return date
}

export const isToday = (value) => toDateKey(value) === toDateKey()

export const isThisWeek = (value) => {
  const date = startOfDay(value)
  const weekStart = startOfWeek()
  const nextWeek = addDays(weekStart, 7)

  return date >= weekStart && date < nextWeek
}

export const formatMinutes = (minutes) => {
  const safeMinutes = Math.max(0, Math.round(Number(minutes) || 0))
  const hours = Math.floor(safeMinutes / 60)
  const remainingMinutes = safeMinutes % 60

  if (hours === 0) return `${remainingMinutes} min`
  if (remainingMinutes === 0) return `${hours} hr`

  return `${hours} hr ${remainingMinutes} min`
}

export const formatSessionDate = (value) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parseLocalDate(value))

export const getDayLabel = (value) => {
  const date = parseLocalDate(value)

  return dayNames[date.getDay()]
}

export const getTimeBucket = (value) => {
  const hour = new Date(value).getHours()

  if (hour >= 5 && hour < 12) return 'Morning'
  if (hour >= 12 && hour < 17) return 'Afternoon'
  if (hour >= 17 && hour < 22) return 'Evening'

  return 'Night'
}

export const getLastSevenDays = () => {
  const today = startOfDay()

  return Array.from({ length: 7 }, (_, index) => addDays(today, index - 6))
}
