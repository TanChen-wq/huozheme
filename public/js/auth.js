// API 基础地址
const API_BASE = window.location.origin;

// 显示提示信息
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

// 显示登录表单
function showLoginForm() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
}

// 显示注册表单
function showRegisterForm() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
}

// 处理登录
async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      // 保存 token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      showToast('登录成功！', 'success');
      
      // 跳转到仪表盘
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } else {
      showToast(data.error || '登录失败', 'error');
    }
  } catch (error) {
    console.error('登录错误:', error);
    showToast('网络错误，请稍后重试', 'error');
  }
}

// 处理注册
async function handleRegister(event) {
  event.preventDefault();
  
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const phone = document.getElementById('registerPhone').value;
  const password = document.getElementById('registerPassword').value;
  const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

  // 验证密码
  if (password !== passwordConfirm) {
    showToast('两次输入的密码不一致', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('密码长度至少为 6 位', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, phone, password })
    });

    const data = await response.json();

    if (data.success) {
      showToast('注册成功！请登录', 'success');
      
      // 切换到登录表单
      setTimeout(() => {
        showLoginForm();
        document.getElementById('loginEmail').value = email;
      }, 1500);
    } else {
      showToast(data.error || '注册失败', 'error');
    }
  } catch (error) {
    console.error('注册错误:', error);
    showToast('网络错误，请稍后重试', 'error');
  }
}

// 检查登录状态
function checkAuth() {
  const token = localStorage.getItem('token');
  if (token && window.location.pathname === '/') {
    window.location.href = '/dashboard';
  }
}

// 页面加载时检查登录状态
checkAuth();
