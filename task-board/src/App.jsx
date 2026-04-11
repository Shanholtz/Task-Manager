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
  const [editingPriority, setEditingPriority] = useState(null);

  useEffect(() => {
  async function initAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      await supabase.auth.signInAnonymously();
    }
  }

  initAuth();
}, []);

  useEffect(() => {
    async function loadTasks() {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("Tasks")
        .select("*")
        .eq("user_id", user.id);

      if (!error) setTasks(data);
    }

      loadTasks();
    }, []);

  async function addTask() {
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date().toISOString().split("T")[0];

    if (!user) {
      console.error("No user session found");
      return;
    }

    const { data, error } = await supabase
      .from("Tasks")
      .insert({
        title,
        status: "TODO",
        priority: "NORMAL",
        due_date: today,
        user_id: user.id
      })
      .select();

    if (!error) {
      setTasks(prev => [...prev, data[0]]);
      setTitle("");
    }

    setTitle('')
  }

  async function updateTaskStatus(taskId, newStatus) {

    const { data, error } = await supabase
      .from("Tasks")
      .update({ status: newStatus })
      .eq("id", taskId)
      .select();
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

  async function updatePriority(taskId, newPriority) {
    const { error } = await supabase
      .from("Tasks")
      .update({ priority: newPriority })
      .eq("id", taskId);

    if (!error) {
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId ? { ...t, priority: newPriority } : t
        )
      );
    }

    setEditingPriority(null);
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
                    <span
                      className={`priority-badge priority-${task.priority}`}
                      onClick={() => setEditingPriority(task.id)}
                      style={{ cursor: "pointer" }}
                    >
                      {task.priority}
                    </span>

                    {editingPriority === task.id && (
                      <div className="priority-dropdown">
                        {["LOW", "NORMAL", "HIGH"].map((p) => (
                          <div
                            key={p}
                            className="priority-option"
                            onClick={() => updatePriority(task.id, p)}
                          >
                            {p}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="task-date">
                      <span>{task.due_date
                            ? new Date(task.due_date + "T00:00:00").toLocaleDateString()
                             : "No date"}</span>
                    
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
