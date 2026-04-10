import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

const COLUMNS = ["TODO", "IN_PROGRESS", "UNDER_REVIEW", "DONE"];

export default function TaskBoard() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [draggedTask, setDraggedTask] = useState(null);
  const [editingDate, setEditingDate] = useState(null);
  const [tempDate, setTempDate] = useState("");

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

  async function updateTaskStatus(taskId, newStatus) {
  console.log("Attempting update:", { taskId, newStatus });

  const { data, error } = await supabase
    .from("Tasks")
    .update({ status: newStatus })
    .eq("id", taskId)
    .select();

  console.log("Supabase response:", { data, error });
  }

  async function deleteTask(taskId) {
  const { error } = await supabase
    .from("Tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    console.error("Delete error:", error);
    return;
  }

  // Update UI
  setTasks(prev => prev.filter(t => t.id !== taskId));
  } 

  async function updateDueDate(taskId, newDate) {
    const { error } = await supabase
      .from("Tasks")
      .update({ due_date: newDate })
      .eq("id", taskId);

    if (!error) {
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId ? { ...t, due_date: newDate } : t
        )
      );
    }
    setEditingDate(null);
  }

  function handleDragStart(task) {
    setDraggedTask(task);
  }

  function handleDrop(column) {
    if (!draggedTask) return;

    const taskId = Number(draggedTask.id);
    updateTaskStatus(taskId, column);

    // Update UI immediately
    setTasks((prev) =>
      prev.map((t) =>
        t.id === draggedTask.id ? { ...t, status: column } : t
      )
    );

    // Update Supabase
    updateTaskStatus(draggedTask.id, column);

    setDraggedTask(null);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Task Board</h1>

      <div className="add-task">
        <input
          placeholder="Add a new task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button onClick={addTask}>Add</button>
      </div>


      <div className="board">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col);

          return (
            <div
              key={col}
              className="column"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col)}
            >
              <div className="column-header">
                <span className="column-title">{col.replace("_", " ")}</span>
                <span className="column-count">{columnTasks.length}</span>
              </div>

              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  className="task-card"
                  draggable
                  onDragStart={() => handleDragStart(task)}
                >
                  <div className="task-card-header">
                    <div className="task-title">{task.title}</div>
                
                  <button
                    className="delete-btn"
                    onClick={() => deleteTask(task.id)}>
                    ✕
                  </button></div>

                  


                  <div className="task-meta">
                    <span className={`priority-badge priority-${task.priority}`}>
                      {task.priority}
                    </span>

                    <div className="task-date">
                      <span>{task.due_date}</span> 
                    <button
                      className="date-btn"
                      onClick={() => {
                      setEditingDate(task);
                      setTempDate(task.due_date.split("T")[0]);
                      }}>
                      📅
                    </button></div>
                    
                  </div>
                </div>
              ))}
            </div>
          );
        })}
        </div>
        {editingDate && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Change Due Date</h3>

              <input
                type="date"
                value={tempDate}
                onChange={(e) =>
                  setTempDate(e.target.value)}
              />

              <button onClick={() => updateDueDate(editingDate.id, tempDate)}>
                Save
              </button>

              <button onClick={() => setEditingDate(null)}>Cancel</button>
                  
            </div>
          </div>
        )}  
    </div> 
  )
}
