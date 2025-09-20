const STORAGE_KEY = "tm_tasks_v1";
let tasks = [];

const tasksEl = document.getElementById("tasks");
const btnNew = document.getElementById("btnNew");
const modal = document.getElementById("modal");
const taskForm = document.getElementById("taskForm");
const taskIdInput = document.getElementById("taskId");
const titleInput = document.getElementById("title");
const descInput = document.getElementById("desc");
const dueInput = document.getElementById("due");
const btnCancel = document.getElementById("cancel");
const quickTitle = document.getElementById("quickTitle");
const quickAdd = document.getElementById("quickAdd");
const searchInput = document.getElementById("search");
const filterSelect = document.getElementById("filter");
const sortSelect = document.getElementById("sort");
const clearCompletedBtn = document.getElementById("clearCompleted");
const counts = document.getElementById("counts");
const progressPercent = document.getElementById("progressPercent");
const progressFill = document.getElementById("progressFill");
const summary = document.getElementById("summary");

load();
bind();
render();

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function bind() {
  btnNew.addEventListener("click", () => openModal());
  btnCancel.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  taskForm.addEventListener("submit", onSave);
  quickAdd.addEventListener("click", () => {
    if (quickTitle.value.trim()) {
      addTask({ title: quickTitle.value.trim() });
      quickTitle.value = "";
      render();
    }
  });
  searchInput.addEventListener("input", render);
  filterSelect.addEventListener("change", render);
  sortSelect.addEventListener("change", render);
  clearCompletedBtn.addEventListener("click", () => {
    tasks = tasks.filter((t) => !t.completed);
    save();
    render();
  });

  document.querySelectorAll("[data-filter]").forEach((b) =>
    b.addEventListener("click", (e) => {
      filterSelect.value = e.target.dataset.filter;
      render();
    })
  );
}

function openModal(task) {
  if (task) {
    document.getElementById("modalTitle").textContent = "Edit Task";
    taskIdInput.value = task.id;
    titleInput.value = task.title;
    descInput.value = task.desc || "";
    dueInput.value = task.due || "";
  } else {
    document.getElementById("modalTitle").textContent = "New Task";
    taskIdInput.value = "";
    taskForm.reset();
  }
  modal.style.display = "flex";
  titleInput.focus();
}
function closeModal() {
  modal.style.display = "none";
}

function onSave(e) {
  e.preventDefault();
  const id = taskIdInput.value;
  const payload = {
    title: titleInput.value.trim(),
    desc: descInput.value.trim(),
    due: dueInput.value || null,
  };
  if (!payload.title) return alert("Title required");
  if (id) {
    const i = tasks.findIndex((t) => t.id === id);
    if (i > -1) {
      tasks[i] = {
        ...tasks[i],
        ...payload,
        updatedAt: new Date().toISOString(),
      };
    }
  } else {
    addTask(payload);
  }
  save();
  closeModal();
  render();
}

function addTask({ title, desc = "", due = null }) {
  const t = {
    id: uid(),
    title,
    desc,
    due,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  tasks.unshift(t);
  save();
}

function editTask(id) {
  const t = tasks.find((x) => x.id === id);
  if (t) openModal(t);
}
function toggleComplete(id) {
  const t = tasks.find((x) => x.id === id);
  if (t) {
    t.completed = !t.completed;
    t.updatedAt = new Date().toISOString();
    save();
    render();
  }
}
function delTask(id) {
  if (confirm("Delete this task?")) {
    tasks = tasks.filter((t) => t.id !== id);
    save();
    render();
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  } catch (e) {
    tasks = [];
  }
}

function render() {
  const q = searchInput.value.trim().toLowerCase();
  let list = tasks.slice();
  const filter = filterSelect.value;
  if (filter === "active") list = list.filter((t) => !t.completed);
  if (filter === "completed") list = list.filter((t) => t.completed);
  if (q)
    list = list.filter((t) =>
      (t.title + " " + (t.desc || "")).toLowerCase().includes(q)
    );

  const sort = sortSelect.value;
  if (sort === "created_desc")
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (sort === "created_asc")
    list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (sort === "due_asc")
    list.sort((a, b) =>
      (a.due || "9999-12-31") > (b.due || "9999-12-31") ? 1 : -1
    );
  if (sort === "due_desc")
    list.sort((a, b) =>
      (a.due || "0000-01-01") < (b.due || "0000-01-01") ? 1 : -1
    );

  tasksEl.innerHTML = "";
  if (list.length === 0) {
    tasksEl.innerHTML =
      '<div style="color:var(--muted);padding:18px;border-radius:8px">No tasks to show</div>';
  } else {
    list.forEach((t) => {
      const item = document.createElement("div");
      item.className = "task" + (t.completed ? " completed" : "");
      const left = document.createElement("div");
      left.className = "left";
      const cb = document.createElement("div");
      cb.className = "checkbox" + (t.completed ? " checked" : "");
      cb.setAttribute("role", "button");
      cb.setAttribute("aria-pressed", t.completed);
      cb.addEventListener("click", () => toggleComplete(t.id));
      cb.innerHTML = t.completed ? "✓" : "";
      left.appendChild(cb);

      const body = document.createElement("div");
      const title = document.createElement("div");
      title.className = "title";
      title.textContent = t.title;
      const meta = document.createElement("div");
      meta.className = "meta";
      const pieces = [];
      if (t.due) pieces.push("Due " + new Date(t.due).toLocaleDateString());
      const created = new Date(t.createdAt).toLocaleDateString();
      pieces.push("Created " + created);
      if (t.desc) pieces.push(t.desc);
      meta.textContent = pieces.join(" • ");
      body.appendChild(title);
      body.appendChild(meta);

      left.appendChild(body);
      item.appendChild(left);

      const actions = document.createElement("div");
      actions.className = "actions";
      const btnEdit = document.createElement("button");
      btnEdit.className = "btn small";
      btnEdit.textContent = "Edit";
      btnEdit.addEventListener("click", () => editTask(t.id));
      const btnDel = document.createElement("button");
      btnDel.className = "btn small";
      btnDel.textContent = "Delete";
      btnDel.addEventListener("click", () => delTask(t.id));
      actions.appendChild(btnEdit);
      actions.appendChild(btnDel);
      item.appendChild(actions);

      tasksEl.appendChild(item);
    });
  }

  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  counts.textContent = `${done} / ${total} completed`;
  const pct = total ? Math.round((done / total) * 100) : 0;
  progressPercent.textContent = pct + "%";
  progressFill.style.width = pct + "%";
  summary.textContent = total
    ? `${total} tasks • ${done} completed • ${total - done} remaining`
    : "No tasks yet";
}
