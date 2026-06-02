import {
  Area,
  AreaChart,
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
import {
  getAchievementBadges,
  getCompletionSplit,
  getDashboardStats,
  getDistractionsByDay,
  getFocusByDay,
  getFocusBySubject,
} from '../utils/analytics'
import { formatMinutes } from '../utils/dateHelpers'
import { getTodoSummary, sortTodos, todoDifficultyOptions } from '../utils/todos'

const chartColors = ['#c026ff', '#d568ff', '#22d3ee', '#f5b451']
const tooltipStyle = {
  border: '1px solid rgba(192, 38, 255, 0.36)',
  borderRadius: 8,
  background: '#0f0b15',
  color: '#fbf9ff',
}
const tooltipLabelStyle = { color: '#e5b7ff' }
const tooltipCursor = { fill: 'rgba(192, 38, 255, 0.1)' }
const axisTick = { fill: '#b9acc8', fontSize: 12 }

function EmptyChart({ label }) {
  return (
    <div className="chart-empty">
      <p>{label}</p>
    </div>
  )
}

function ChartCard({ title, detail, children }) {
  return (
    <article className="chart-card">
      <div className="chart-card-header">
        <h3>{title}</h3>
        {detail ? <p>{detail}</p> : null}
      </div>
      {children}
    </article>
  )
}

function MetricGraphCard({ title, value, detail, children }) {
  return (
    <article className="metric-card">
      <div className="metric-card-copy">
        <p>{title}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
      <div className="metric-chart">{children}</div>
    </article>
  )
}

function DashboardPage({ sessions, settings, todos }) {
  const stats = getDashboardStats(sessions)
  const focusBySubject = getFocusBySubject(sessions)
  const focusByDay = getFocusByDay(sessions)
  const completionSplit = getCompletionSplit(sessions)
  const distractionsByDay = getDistractionsByDay(sessions)
  const badges = getAchievementBadges(sessions)
  const sortedTodos = sortTodos(todos)
  const openTodos = sortedTodos.filter((todo) => !todo.completed)
  const completedTodos = sortedTodos.length - openTodos.length
  const nextTodo = openTodos[0]
  const activeSubjects = new Set(openTodos.map((todo) => todo.subject)).size
  const todoDifficultyData = todoDifficultyOptions.map((difficulty) => ({
    difficulty,
    tasks: openTodos.filter((todo) => todo.difficulty === difficulty).length,
  }))
  const hasDistractions = distractionsByDay.some((item) => item.distractions > 0)
  const hasOpenTodos = openTodos.length > 0
  const totalWeekSessions = completionSplit.reduce(
    (total, item) => total + item.value,
    0,
  )
  const latestSession = sessions
    .slice()
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))[0]
  const dailyGoalMinutes = Math.max(1, Number(settings.dailyFocusGoalMinutes) || 1)
  const remainingGoalMinutes = Math.max(
    dailyGoalMinutes - stats.totalFocusToday,
    0,
  )
  const goalChartData = [
    {
      label: 'Today',
      focused: stats.totalFocusToday,
      remaining: remainingGoalMinutes,
    },
  ]
  const goalPercent = Math.min(
    100,
    Math.round((stats.totalFocusToday / dailyGoalMinutes) * 100) || 0,
  )
  const goalDomainMax = Math.max(dailyGoalMinutes, stats.totalFocusToday, 1)

  return (
    <div className="dashboard-page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Productivity analytics</h1>
          <p>
            Today&apos;s goal, current activity, and weekly focus patterns in one
            clear view.
          </p>
        </div>
      </section>

      <section className="overview-grid" aria-label="User and activity overview">
        <article className="overview-card">
          <p className="eyebrow">User info</p>
          <h2>
            {stats.bestSubject.label === 'No data yet'
              ? 'New focus profile'
              : stats.bestSubject.label}
          </h2>
          <dl className="overview-facts">
            <div>
              <dt>Total sessions</dt>
              <dd>{sessions.length}</dd>
            </div>
            <div>
              <dt>Current streak</dt>
              <dd>{stats.streak} days</dd>
            </div>
          </dl>
        </article>

        <article className="overview-card daily-goal-card">
          <p className="eyebrow">Daily goal</p>
          <h2>{goalPercent}% complete</h2>
          <div className="progress-track" aria-label="Daily focus goal progress">
            <span style={{ width: `${goalPercent}%` }}></span>
          </div>
          <p>
            {formatMinutes(stats.totalFocusToday)} focused,{' '}
            {formatMinutes(remainingGoalMinutes)} left.
          </p>
        </article>

        <article className="overview-card">
          <p className="eyebrow">Activity</p>
          <h2>{latestSession ? latestSession.subject : 'No session yet'}</h2>
          <p>
            {latestSession
              ? `${formatMinutes(latestSession.actualMinutes)} logged`
              : 'No saved activity yet.'}
          </p>
          <dl className="overview-facts">
            <div>
              <dt>Today</dt>
              <dd>{stats.completedToday} done</dd>
            </div>
            <div>
              <dt>This week</dt>
              <dd>{stats.completedWeek} done</dd>
            </div>
          </dl>
        </article>

        <article className="overview-card task-overview-card">
          <p className="eyebrow">Task queue</p>
          <h2>{openTodos.length ? `${openTodos.length} open` : 'No open tasks'}</h2>
          <p>
            {nextTodo
              ? getTodoSummary(nextTodo)
              : 'Add difficulty, subject, and a short description from the timer.'}
          </p>
          <dl className="overview-facts">
            <div>
              <dt>Subjects</dt>
              <dd>{activeSubjects}</dd>
            </div>
            <div>
              <dt>Done</dt>
              <dd>{completedTodos}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="metric-grid" aria-label="Productivity graphs">
        <MetricGraphCard
          title="Daily focus goal"
          value={formatMinutes(stats.totalFocusToday)}
          detail={`${formatMinutes(dailyGoalMinutes)} target`}
        >
          <ResponsiveContainer width="100%" height={112}>
            <BarChart
              data={goalChartData}
              layout="vertical"
              margin={{ bottom: 12, left: 0, right: 0, top: 12 }}
            >
              <XAxis type="number" hide domain={[0, goalDomainMax]} />
              <YAxis dataKey="label" type="category" hide />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={tooltipCursor}
                labelStyle={tooltipLabelStyle}
              />
              <Bar
                dataKey="focused"
                fill="#c026ff"
                radius={[8, 0, 0, 8]}
                stackId="goal"
              />
              <Bar
                dataKey="remaining"
                fill="#241a2e"
                radius={[0, 8, 8, 0]}
                stackId="goal"
              />
            </BarChart>
          </ResponsiveContainer>
        </MetricGraphCard>

        <MetricGraphCard
          title="Focus trend"
          value={formatMinutes(stats.totalFocusWeek)}
          detail="Last 7 days"
        >
          <ResponsiveContainer width="100%" height={112}>
            <AreaChart data={focusByDay} margin={{ bottom: 8, left: 0, right: 0, top: 8 }}>
              <XAxis dataKey="day" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={tooltipCursor}
                labelStyle={tooltipLabelStyle}
              />
              <Area
                dataKey="minutes"
                fill="#c026ff"
                fillOpacity={0.24}
                stroke="#d568ff"
                strokeWidth={3}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </MetricGraphCard>

        <MetricGraphCard
          title="Completion rate"
          value={`${stats.successRate}%`}
          detail={
            totalWeekSessions
              ? `${stats.completedWeek} of ${totalWeekSessions} sessions`
              : 'No sessions this week'
          }
        >
          {totalWeekSessions ? (
            <ResponsiveContainer width="100%" height={112}>
              <PieChart>
                <Pie
                  data={completionSplit}
                  dataKey="value"
                  innerRadius={28}
                  nameKey="name"
                  outerRadius={48}
                  paddingAngle={3}
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
            <EmptyChart label="No sessions this week." />
          )}
        </MetricGraphCard>

        <MetricGraphCard
          title="Distraction load"
          value={`${stats.averageDistractions} avg`}
          detail={`${stats.totalDistractionsToday} distractions today`}
        >
          {hasDistractions ? (
            <ResponsiveContainer width="100%" height={112}>
              <BarChart
                data={distractionsByDay}
                margin={{ bottom: 8, left: 0, right: 0, top: 8 }}
              >
                <XAxis dataKey="day" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={tooltipCursor}
                  labelStyle={tooltipLabelStyle}
                />
                <Bar
                  dataKey="distractions"
                  fill="#22d3ee"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No distractions this week." />
          )}
        </MetricGraphCard>

        <MetricGraphCard
          title="Task difficulty"
          value={`${openTodos.length} open`}
          detail="Hard tasks sorted first"
        >
          {hasOpenTodos ? (
            <ResponsiveContainer width="100%" height={112}>
              <BarChart
                data={todoDifficultyData}
                margin={{ bottom: 8, left: 0, right: 0, top: 8 }}
              >
                <XAxis dataKey="difficulty" hide />
                <YAxis allowDecimals={false} hide />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={tooltipCursor}
                  labelStyle={tooltipLabelStyle}
                />
                <Bar dataKey="tasks" radius={[8, 8, 0, 0]}>
                  {todoDifficultyData.map((entry, index) => (
                    <Cell
                      fill={chartColors[index % chartColors.length]}
                      key={entry.difficulty}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No open tasks yet." />
          )}
        </MetricGraphCard>
      </section>

      <section className="charts-grid" aria-label="Charts">
        <ChartCard
          title="Focus by subject"
          detail="Where your time is going this week."
        >
          {focusBySubject.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={focusBySubject}>
                <XAxis
                  dataKey="subject"
                  axisLine={false}
                  tick={axisTick}
                  tickLine={false}
                />
                <YAxis axisLine={false} tick={axisTick} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={tooltipCursor}
                  labelStyle={tooltipLabelStyle}
                />
                <Bar dataKey="minutes" radius={[8, 8, 0, 0]} fill="#c026ff" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No subject data yet." />
          )}
        </ChartCard>

        <ChartCard
          title="Focus by day"
          detail="A simple view of your 7-day rhythm."
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={focusByDay}>
              <XAxis dataKey="day" axisLine={false} tick={axisTick} tickLine={false} />
              <YAxis axisLine={false} tick={axisTick} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={tooltipCursor}
                labelStyle={tooltipLabelStyle}
              />
              <Line
                dataKey="minutes"
                stroke="#d568ff"
                strokeWidth={3}
                type="monotone"
                dot={{ fill: '#09070d', r: 4, stroke: '#d568ff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Sorted to-do queue"
          detail="Difficulty first, then subject and short description."
        >
          {sortedTodos.length ? (
            <div className="dashboard-todo-list">
              {sortedTodos.slice(0, 6).map((todo) => (
                <article
                  className={todo.completed ? 'completed' : ''}
                  key={todo.id}
                >
                  <span
                    className={`difficulty-pill difficulty-${todo.difficulty.toLowerCase()}`}
                  >
                    {todo.difficulty}
                  </span>
                  <div>
                    <strong>{todo.subject}</strong>
                    <p>{todo.description}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyChart label="No tasks in your queue." />
          )}
        </ChartCard>

        <ChartCard
          title="Best subject"
          detail="The subject getting the most focused minutes."
        >
          <article className="insight-summary">
            <p className="eyebrow">Top subject</p>
            <h2>{stats.bestSubject.label}</h2>
            <span>
              {formatMinutes(stats.bestSubject.totalMinutes)} focused this week.
            </span>
          </article>
        </ChartCard>

        <ChartCard
          title="Best focus window"
          detail="When your strongest sessions usually start."
        >
          <article className="insight-summary">
            <p className="eyebrow">Best time</p>
            <h2>{stats.bestFocusTime.label}</h2>
            <span>
              {formatMinutes(stats.bestFocusTime.totalMinutes)} focused in this
              time window.
            </span>
          </article>
        </ChartCard>

        <ChartCard
          title="Completion split"
          detail="Completed sessions versus stopped sessions."
        >
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

        <ChartCard
          title="Distractions by day"
          detail="Daily interruption patterns across the week."
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distractionsByDay}>
              <XAxis dataKey="day" axisLine={false} tick={axisTick} tickLine={false} />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tick={axisTick}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={tooltipCursor}
                labelStyle={tooltipLabelStyle}
              />
              <Bar
                dataKey="distractions"
                radius={[8, 8, 0, 0]}
                fill="#22d3ee"
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
