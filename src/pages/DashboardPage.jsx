import {
  Bar,
  BarChart,
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

const chartColors = ['#a78bfa', '#f5f0ff', '#746880', '#c9b8ff']
const tooltipStyle = {
  border: '1px solid rgba(167, 139, 250, 0.28)',
  borderRadius: 12,
  background: '#242426',
  color: '#f8f7f9',
}
const tooltipLabelStyle = { color: '#cab1ff' }
const tooltipCursor = { fill: 'rgba(167, 139, 250, 0.08)' }

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
            {formatMinutes(stats.totalFocusWeek)} focused this week across{' '}
            {stats.completedWeek} completed sessions. Best subject:{' '}
            {stats.bestSubject.label}. Best time: {stats.bestFocusTime.label}.
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
          label="Today"
          value={formatMinutes(stats.totalFocusToday)}
          tone="green"
        />
        <StatCard
          label="This week"
          value={formatMinutes(stats.totalFocusWeek)}
          tone="blue"
        />
        <StatCard label="Sessions today" value={stats.completedToday} />
        <StatCard
          label="Sessions this week"
          value={stats.completedWeek}
        />
        <StatCard
          label="Distractions today"
          value={stats.totalDistractionsToday}
          tone="orange"
        />
        <StatCard
          label="Avg. distractions"
          value={stats.averageDistractions}
        />
        <StatCard
          label="Success rate"
          value={`${stats.successRate}%`}
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
      </section>

      <section className="charts-grid" aria-label="Charts">
        <ChartCard title="By subject">
          {focusBySubject.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={focusBySubject}>
                <XAxis dataKey="subject" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={tooltipCursor}
                  labelStyle={tooltipLabelStyle}
                />
                <Bar dataKey="minutes" radius={[8, 8, 0, 0]} fill="#a78bfa" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No subject data yet." />
          )}
        </ChartCard>

        <ChartCard title="By day">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={focusByDay}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={tooltipCursor}
                labelStyle={tooltipLabelStyle}
              />
              <Line
                dataKey="minutes"
                stroke="#cab1ff"
                strokeWidth={3}
                type="monotone"
                dot={{ fill: '#1f1f20', r: 4, stroke: '#cab1ff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Completion">
          {completionSplit.some((item) => item.value > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={completionSplit}
                  dataKey="value"
                  innerRadius={58}
                  nameKey="name"
                  outerRadius={92}
                >
                  {completionSplit.map((entry, index) => (
                    <Cell
                      fill={chartColors[index % chartColors.length]}
                      key={entry.name}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={tooltipCursor}
                  labelStyle={tooltipLabelStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No sessions this week yet." />
          )}
        </ChartCard>

        <ChartCard title="Distractions">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distractionsByDay}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={tooltipCursor}
                labelStyle={tooltipLabelStyle}
              />
              <Bar
                dataKey="distractions"
                radius={[8, 8, 0, 0]}
                fill="#746880"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="badge-panel panel" aria-label="Achievements">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Achievements</p>
            <h2>Milestones</h2>
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
