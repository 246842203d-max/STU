const form = document.getElementById('registerForm');
const msg = document.getElementById('msg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMsg(msg);

  const payload = {
    student_no: document.getElementById('student_no').value.trim(),
    name: document.getElementById('name').value.trim(),
    gender: document.getElementById('gender').value,
    age: document.getElementById('age').value,
    class_name: document.getElementById('class_name').value.trim(),
    major: document.getElementById('major').value.trim(),
    password: document.getElementById('password').value,
  };

  const confirm = document.getElementById('confirm').value;
  if (payload.password !== confirm) {
    showMsg(msg, '两次输入的密码不一致');
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = '注册中...';

  try {
    const { ok, data } = await api('/api/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!ok || !data.success) {
      showMsg(msg, data.message || '注册失败');
      return;
    }

    saveSession(data.token, data.user);
    showMsg(msg, '注册成功，正在进入个人信息页...', 'success');
    setTimeout(() => {
      location.href = 'student.html';
    }, 500);
  } catch (err) {
    showMsg(msg, err.message || '网络错误');
  } finally {
    btn.disabled = false;
    btn.textContent = '注册';
  }
});
