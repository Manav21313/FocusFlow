export const todoDifficultyOptions = ['Hard', 'Medium', 'Easy']

const difficultyRank = {
  Hard: 0,
  Medium: 1,
  Easy: 2,
}

const cleanText = (value) => String(value || '').trim()

export const normalizeTodo = (todo, index = 0) => {
  if (!todo || typeof todo !== 'object') return null

  const description = cleanText(todo.description || todo.label || todo.task)
  if (!description) return null

  const difficulty = todoDifficultyOptions.includes(todo.difficulty)
    ? todo.difficulty
    : 'Medium'
  const subject = cleanText(todo.subject) || 'General Study'
  const id = cleanText(todo.id) || `todo-${index}`

  return {
    id,
    difficulty,
    subject,
    description,
    completed: Boolean(todo.completed),
  }
}

export const normalizeTodos = (todos) =>
  Array.isArray(todos)
    ? todos.map((todo, index) => normalizeTodo(todo, index)).filter(Boolean)
    : []

export const getTodoDifficultyRank = (todo) =>
  difficultyRank[todo.difficulty] ?? difficultyRank.Medium

export const sortTodos = (todos) =>
  normalizeTodos(todos).sort((a, b) => {
    const difficultyDifference = getTodoDifficultyRank(a) - getTodoDifficultyRank(b)
    if (difficultyDifference !== 0) return difficultyDifference

    const subjectDifference = a.subject.localeCompare(b.subject)
    if (subjectDifference !== 0) return subjectDifference

    const descriptionDifference = a.description.localeCompare(b.description)
    if (descriptionDifference !== 0) return descriptionDifference

    return Number(a.completed) - Number(b.completed)
  })

export const getTodoSummary = (todo) =>
  `${todo.difficulty} / ${todo.subject} / ${todo.description}`
