import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function TaskBoard() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    const { data, error } = await supabase.from('Tasks').select('*')
    if (!error) setTasks(data)
  }

  async function addTask() {
    const { error } = await supabase.from("Tasks").insert({
      title,
      status: "TODO",
      user_id: crypto.randomUUID(),
      due_date: new Date().toISOString(),
      priority: "NORMAL"
    });

    if (error) {
      console.error("Insert error:", error);
      return;
    }

    setTitle('')
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

      <button onClick={addTask}>Add Task</button>

      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            <strong>{t.title}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}