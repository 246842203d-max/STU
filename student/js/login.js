const form = document.getElementById('loginForm');
const msg = document.getElementById('msg');
const accountLabel = document.getElementById('accountLabel');
const accountInput = document.getElementById('account');
const tabs = document.querySelectorAll('.tab');

let role = 'admin';

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    role = tab.dataset.role;
    if (role === 'admin') {
      accountLabel.textContent = '用户名';
      accountInput.placeholder = '请输入管理员用户名';
      accountInput.value = accountInput.value || 'admin';
    } else {
      accountLabel.textContent = '学号';
      accountInput.placeholder = '请输入学号';
      if (accountInput.value === 'admin') accountInput.value = '';
    }
    hideMsg(msg);
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMsg(msg);

  const account = accountInput.value.trim();
  const password = document.getElementById('password').value;

  if (!account || !password) {
    showMsg(msg, '请填写完整登录信息');
    return;
  }

  const payload =
    role === 'admin'
      ? { role, username: account, password }
      : { role, student_no: account, password };

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = '登录中...';

  try {
    const { ok, data } = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!ok || !data.success) {
      showMsg(msg, data.message || '登录失败');
      return;
    }

    saveSession(data.token, data.user);
    showMsg(msg, '登录成功，正在跳转...', 'success');
    setTimeout(() => {
      location.href = data.user.role === 'admin' ? 'admin.html' : 'student.html';
    }, 400);
  } catch (err) {
    showMsg(msg, err.message || '网络错误');
  } finally {
    btn.disabled = false;
    btn.textContent = '登录';
  }
});

(async function bootstrap() {
  try {
    await api('/api/init', { method: 'POST' });
  } catch {
    // 初始化失败不阻断登录页展示
  }

  const user = getUser();
  const token = getToken();
  if (token && user) {
    location.href = user.role === 'admin' ? 'admin.html' : 'student.html';
  }
})();
