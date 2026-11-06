const user = requireRole('student');
if (!user) {
  throw new Error('未授权，正在跳转登录页');
}

document.getElementById('welcomeName').textContent = user.name || user.student_no;
document.getElementById('logoutBtn').addEventListener('click', () => logout());

const msg = document.getElementById('pageMsg');

async function loadProfile() {
  const { ok, data } = await api('/api/me');
  if (!ok || !data.success) {
    showMsg(msg, data.message || '加载个人信息失败');
    return;
  }

  const s = data.user;
  document.getElementById('welcomeName').textContent = s.name || s.student_no;
  document.getElementById('v_student_no').textContent = s.student_no || '-';
  document.getElementById('v_name').textContent = s.name || '-';
  document.getElementById('v_gender').textContent = s.gender || '-';
  document.getElementById('v_age').textContent = s.age ?? '-';
  document.getElementById('v_class').textContent = s.class_name || '-';
  document.getElementById('v_major').textContent = s.major || '-';
}

loadProfile();
