const user = requireRole('admin');
if (!user) {
  throw new Error('未授权，正在跳转登录页');
}

document.getElementById('adminName').textContent = user.username;
document.getElementById('logoutBtn').addEventListener('click', () => logout());

const tbody = document.getElementById('studentBody');
const empty = document.getElementById('empty');
const searchInput = document.getElementById('searchInput');
const modal = document.getElementById('modal');
const form = document.getElementById('studentForm');
const modalTitle = document.getElementById('modalTitle');
const msg = document.getElementById('pageMsg');

let editingId = null;

async function loadStudents(q = '') {
  hideMsg(msg);
  const query = q ? `?q=${encodeURIComponent(q)}` : '';
  const { ok, data } = await api(`/api/students${query}`);
  if (!ok || !data.success) {
    showMsg(msg, data.message || '加载失败');
    return;
  }
  renderTable(data.data || []);
}

function renderTable(rows) {
  tbody.innerHTML = '';
  if (!rows.length) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(row.student_no)}</td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.gender || '-')}</td>
      <td>${row.age ?? '-'}</td>
      <td>${escapeHtml(row.class_name || '-')}</td>
      <td>${escapeHtml(row.major || '-')}</td>
      <td>
        <div class="actions">
          <button class="btn btn-secondary" data-edit="${row.id}">编辑</button>
          <button class="btn btn-danger" data-del="${row.id}">删除</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

tbody.addEventListener('click', async (e) => {
  const editId = e.target.getAttribute('data-edit');
  const delId = e.target.getAttribute('data-del');

  if (editId) {
    const { ok, data } = await api(`/api/students/${editId}`);
    if (!ok || !data.success) {
      showMsg(msg, data.message || '获取详情失败');
      return;
    }
    openModal(data.data);
  }

  if (delId) {
    if (!confirm('确定删除该学生信息吗？')) return;
    const { ok, data } = await api(`/api/students/${delId}`, { method: 'DELETE' });
    if (!ok || !data.success) {
      showMsg(msg, data.message || '删除失败');
      return;
    }
    showMsg(msg, '删除成功', 'success');
    loadStudents(searchInput.value.trim());
  }
});

function openModal(student = null) {
  editingId = student ? student.id : null;
  modalTitle.textContent = student ? '编辑学生信息' : '新增学生信息';
  form.reset();
  document.getElementById('passwordHint').style.display = student ? 'block' : 'none';
  document.getElementById('password').required = !student;
  document.getElementById('password').placeholder = student
    ? '留空则不修改密码'
    : '默认可填 123456';

  if (student) {
    document.getElementById('student_no').value = student.student_no || '';
    document.getElementById('name').value = student.name || '';
    document.getElementById('gender').value = student.gender || '';
    document.getElementById('age').value = student.age ?? '';
    document.getElementById('class_name').value = student.class_name || '';
    document.getElementById('major').value = student.major || '';
  }

  modal.classList.add('show');
}

function closeModal() {
  modal.classList.remove('show');
  editingId = null;
}

document.getElementById('addBtn').addEventListener('click', () => openModal());
document.getElementById('cancelBtn').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

document.getElementById('searchBtn').addEventListener('click', () => {
  loadStudents(searchInput.value.trim());
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    loadStudents(searchInput.value.trim());
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    student_no: document.getElementById('student_no').value.trim(),
    name: document.getElementById('name').value.trim(),
    gender: document.getElementById('gender').value,
    age: document.getElementById('age').value,
    class_name: document.getElementById('class_name').value.trim(),
    major: document.getElementById('major').value.trim(),
  };

  const password = document.getElementById('password').value;
  if (password) payload.password = password;
  if (!editingId && !password) payload.password = '123456';

  const path = editingId ? `/api/students/${editingId}` : '/api/students';
  const method = editingId ? 'PUT' : 'POST';

  const { ok, data } = await api(path, {
    method,
    body: JSON.stringify(payload),
  });

  if (!ok || !data.success) {
    showMsg(msg, data.message || '保存失败');
    return;
  }

  closeModal();
  showMsg(msg, data.message || '保存成功', 'success');
  loadStudents(searchInput.value.trim());
});

loadStudents();
