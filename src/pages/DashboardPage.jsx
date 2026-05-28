import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import StatCard from '../components/StatCard'
import {
  getAchievementBadges,
  getCompletionSplit,
  getDashboardStats,
  getDistractionsByDay,
  getFocusByDay,
  getFocusBySubject,
} from '../utils/analytics'
import { formatMinutes } from '../utils/dateHelpers'

const chartColors = ['#2a8473', '#2563eb', '#d78b1f', '#dc2626', '#7c3aed']

function EmptyChart({ label }) {
  return (
    <div className="chart-empty">
      <p>{label}</p>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <article className="chart-card">
      <h3>{title}</h3>
      {children}
    </article>
  )
}

function DashboardPage({ sessions, settings }) {
  const stats = getDashboardStats(sessions)
  const focusBySubject = getFocusBySubject(sessions)
  const focusByDay = getFocusByDay(sessions)
  const completionSplit = getCompletionSplit(sessions)
  const distractionsByDay = getDistractionsByDay(sessions)
  const badges = getAchievementBadges(sessions)
  const goalPercent = Math.min(
    100,
    Math.round((stats.totalFocusToday / settings.dailyFocusGoalMinutes) * 100) || 0,
  )

  return (
    <div className="dashboard-page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Productivity analytics</h1>
          <p>
            This week you focused for {formatMinutes(stats.totalFocusWeek)}. Your
            best subject was {stats.bestSubject.label}. Your best focus time was{' '}
            {stats.bestFocusTime.label}. You completed {stats.completedWeek} focus
            sessions.
          </p>
        </div>
        <div className="goal-card">
          <span>Daily goal</span>
          <strong>{goalPercent}%</strong>
          <div className="progress-track" aria-label="Daily focus goal progress">
            <span style={{ width: `${goalPercent}%` }}></span>
          </div>
          <p>
            {formatMinutes(stats.totalFocusToday)} of{' '}
            {formatMinutes(settings.dailyFocusGoalMinutes)}
          </p>
        </div>
      </section>

      <section className="stats-grid" aria-label="Focus statistics">
        <StatCard
          label="Total focus time today"
          value={formatMinutes(stats.totalFocusToday)}
          tone="green"
        />
        <StatCard
          label="Total focus time this week"
          value={formatMinutes(stats.totalFocusWeek)}
          tone="blue"
        />
        <StatCard label="Completed sessions today" value={stats.completedToday} />
        <StatCard
          label="Completed sessions this week"
          value={stats.completedWeek}
        />
        <StatCard
          label="Total distractions today"
          value={stats.totalDistractionsToday}
          tone="orange"
        />
        <StatCard
          label="Average distractions per session"
          value={stats.averageDistractions}
        />
        <StatCard
          label="Focus success rate"
          value={`${stats.successRate}%`}
          detail="completed sessions / total sessions × 100"
          tone="green"
        />
        <StatCard label="Current streak" value={`${stats.streak} days`} />
      </section>

      <section className="insight-grid">
        <article className="panel">
          <p className="eyebrow">Best subject this week</p>
          <h2>{stats.bestSubject.label}</h2>
          <p>Total time: {formatMinutes(stats.bestSubject.totalMinutes)}</p>
        </article>
        <article className="panel">
          <p className="eyebrow">Best focus time</p>
          <h2>{stats.bestFocusTime.label}</h2>
          <p>Based on when your weekly sessions started.</p>
        </article>
        <article className="panel formula-panel">
          <p className="eyebrow">Success rate formula</p>
          <h2>{stats.successRate}%</h2>
          <p>{stats.successRateFormula} = focus success rate</p>
        </article>
      </section>

      <section className="charts-grid" aria-label="Charts">
        <ChartCard title="Focus minutes by subject">
          {focusBySubject.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={focusBySubject}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="minutes" radius={[6, 6, 0, 0]} fill="#2a8473" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No subject data yet." />
          )}
        </ChartCard>

        <ChartCard title="Focus minutes by day">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={focusByDay}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line
                dataKey="minutes"
                stroke="#2563eb"
                strokeWidth={3}
                type="monotone"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Completed vs incomplete sessions">
          {completionSplit.some((item) => item.value > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={completionSplit}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={92}
                  label
                >
                  {completionSplit.map((entry, index) => (
                    <Cell
                      fill={chartColors[index % chartColors.length]}
                      key={entry.name}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No sessions this week yet." />
          )}
        </ChartCard>

        <ChartCard title="Distractions by day">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distractionsByDay}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar
                dataKey="distractions"
                radius={[6, 6, 0, 0]}
                fill="#d78b1f"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="badge-panel panel" aria-label="Achievements">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Achievements</p>
            <h2>Badges</h2>
          </div>
        </div>
        <div className="badge-grid">
          {badges.map((badge) => (
            <article className={badge.earned ? 'earned' : ''} key={badge.label}>
              <strong>{badge.label}</strong>
              <span>{badge.detail}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
