import {
  addDays,
  formatMinutes,
  getDayLabel,
  getLastSevenDays,
  getTimeBucket,
  isThisWeek,
  isToday,
  startOfDay,
  toDateKey,
} from './dateHelpers'

const sum = (items, selector) =>
  items.reduce((total, item) => total + selector(item), 0)

const getSessionMinutes = (session) => Number(session.actualMinutes) || 0

const groupBy = (items, getKey, getValue) =>
  items.reduce((groups, item) => {
    const key = getKey(item)
    groups[key] = (groups[key] || 0) + getValue(item)

    return groups
  }, {})

const bestEntry = (groups) => {
  const entries = Object.entries(groups)
  if (!entries.length) return { label: 'No data yet', totalMinutes: 0 }

  const [label, totalMinutes] = entries.sort((a, b) => b[1] - a[1])[0]

  return { label, totalMinutes }
}

export const getDashboardStats = (sessions) => {
  const todaySessions = sessions.filter((session) => isToday(session.date))
  const weekSessions = sessions.filter((session) => isThisWeek(session.date))
  const completedWeekSessions = weekSessions.filter((session) => session.completed)
  const totalWeekSessions = weekSessions.length
  const totalDistractionsWeek = sum(weekSessions, (session) => session.distractions)
  const bestSubject = bestEntry(
    groupBy(
      weekSessions,
      (session) => session.subject || 'Unsorted',
      getSessionMinutes,
    ),
  )
  const bestFocusTime = bestEntry(
    groupBy(weekSessions, (session) => getTimeBucket(session.startTime), getSessionMinutes),
  )
  const successRate =
    totalWeekSessions === 0
      ? 0
      : Math.round((completedWeekSessions.length / totalWeekSessions) * 100)

  return {
    totalFocusToday: sum(todaySessions, getSessionMinutes),
    totalFocusWeek: sum(weekSessions, getSessionMinutes),
    completedToday: todaySessions.filter((session) => session.completed).length,
    completedWeek: completedWeekSessions.length,
    totalDistractionsToday: sum(todaySessions, (session) => session.distractions),
    averageDistractions:
      totalWeekSessions === 0
        ? 0
        : Number((totalDistractionsWeek / totalWeekSessions).toFixed(1)),
    successRate,
    successRateFormula: `${completedWeekSessions.length} / ${totalWeekSessions} × 100`,
    bestSubject,
    bestFocusTime,
    streak: getCurrentStreak(sessions),
  }
}

export const getCurrentStreak = (sessions) => {
  const completedDays = new Set(
    sessions
      .filter((session) => session.completed)
      .map((session) => toDateKey(session.date)),
  )
  let cursor = startOfDay()
  let streak = 0

  while (completedDays.has(toDateKey(cursor))) {
    streak += 1
    cursor = addDays(cursor, -1)
  }

  return streak
}

export const getFocusBySubject = (sessions) =>
  Object.entries(
    groupBy(
      sessions.filter((session) => isThisWeek(session.date)),
      (session) => session.subject || 'Unsorted',
      getSessionMinutes,
    ),
  )
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((a, b) => b.minutes - a.minutes)

export const getFocusByDay = (sessions) =>
  getLastSevenDays().map((date) => {
    const dateKey = toDateKey(date)
    const daySessions = sessions.filter((session) => session.date === dateKey)

    return {
      day: getDayLabel(date),
      minutes: sum(daySessions, getSessionMinutes),
    }
  })

export const getDistractionsByDay = (sessions) =>
  getLastSevenDays().map((date) => {
    const dateKey = toDateKey(date)
    const daySessions = sessions.filter((session) => session.date === dateKey)

    return {
      day: getDayLabel(date),
      distractions: sum(daySessions, (session) => session.distractions),
    }
  })

export const getCompletionSplit = (sessions) => {
  const weekSessions = sessions.filter((session) => isThisWeek(session.date))
  const completed = weekSessions.filter((session) => session.completed).length

  return [
    { name: 'Completed', value: completed },
    { name: 'Incomplete', value: weekSessions.length - completed },
  ]
}

export const getAchievementBadges = (sessions) => {
  const totalSessions = sessions.length
  const totalFocusMinutes = sum(sessions, getSessionMinutes)
  const todaySessions = sessions.filter((session) => isToday(session.date))
  const todayDistractions = sum(todaySessions, (session) => session.distractions)
  const streak = getCurrentStreak(sessions)

  return [
    {
      label: 'First session',
      earned: totalSessions >= 1,
      detail: 'Save your first focus session',
    },
    {
      label: '5 sessions',
      earned: totalSessions >= 5,
      detail: 'Complete five study sessions',
    },
    {
      label: '10 hours focused',
      earned: totalFocusMinutes >= 600,
      detail: `${formatMinutes(totalFocusMinutes)} logged`,
    },
    {
      label: 'Low distraction day',
      earned: todaySessions.length > 0 && todayDistractions <= 1,
      detail: 'One or fewer distractions today',
    },
    {
      label: '3-day streak',
      earned: streak >= 3,
      detail: `${streak} day current streak`,
    },
  ]
}
