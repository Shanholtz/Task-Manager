import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function TaskBoard() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    const { data, error } = await supabase.from('Task').select('*')
    if (!error) setTasks(data)
  }

  async function addTask() {
    await supabase.from('Task').insert({ title, description })
    setTitle('')
    setDescription('')
    loadTasks()
  }

  return (
    <div>
      <h1>Task Board</h1>

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button onClick={addTask}>Add Task</button>

      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            <strong>{t.title}</strong>: {t.description}
          </li>
        ))}
      </ul>
    </div>
  )
}
