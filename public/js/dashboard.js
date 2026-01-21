// API 基础地址
const API_BASE = window.location.origin;

// 当前选中的状态
let selectedStatus = '';

// 显示提示信息
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

// 获取认证头
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// 检查登录状态
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
    return false;
  }
  return true;
}

// 退出登录
function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

// 显示签到区域
function showCheckinSection() {
  document.getElementById('checkinSection').style.display = 'block';
  document.getElementById('contactsSection').style.display = 'none';
  document.getElementById('statsSection').style.display = 'none';
  loadCheckinStats();
}

// 显示联系人区域
function showContactsSection() {
  document.getElementById('checkinSection').style.display = 'none';
  document.getElementById('contactsSection').style.display = 'block';
  document.getElementById('statsSection').style.display = 'none';
  loadContacts();
}

// 显示统计区域
function showStatsSection() {
  document.getElementById('checkinSection').style.display = 'none';
  document.getElementById('contactsSection').style.display = 'none';
  document.getElementById('statsSection').style.display = 'block';
  loadStats();
}

// 选择状态
function selectStatus(button) {
  // 移除所有按钮的 active 类
  document.querySelectorAll('.status-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // 添加 active 类到当前按钮
  button.classList.add('active');
  selectedStatus = button.dataset.status;
}

// 处理签到
async function handleCheckin() {
  if (!selectedStatus) {
    showToast('请选择你的状态', 'error');
    return;
  }

  const message = document.getElementById('checkinMessage').value;

  try {
    const response = await fetch(`${API_BASE}/api/checkin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: selectedStatus, message })
    });

    const data = await response.json();

    if (data.success) {
      showToast('签到成功！已通知你的联系人', 'success');
      selectedStatus = '';
      document.getElementById('checkinMessage').value = '';
      document.querySelectorAll('.status-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // 重新加载签到统计
      loadCheckinStats();
    } else {
      showToast(data.error || '签到失败', 'error');
    }
  } catch (error) {
    console.error('签到错误:', error);
    showToast('网络错误，请稍后重试', 'error');
  }
}

// 加载签到统计
async function loadCheckinStats() {
  try {
    const response = await fetch(`${API_BASE}/api/checkin/stats`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (data.success) {
      const stats = data.stats;
      
      // 显示今日签到状态
      const statusDiv = document.getElementById('checkinStatus');
      const formDiv = document.getElementById('checkinForm');
      
      if (stats.hasCheckedInToday) {
        const checkin = stats.todayCheckin;
        const statusEmoji = {
          '很好': '😊',
          '还行': '😌',
          '有点累': '😔',
          '需要联系': '🆘'
        };
        
        statusDiv.innerHTML = `
          <h3>${statusEmoji[checkin.status]} 今日已签到</h3>
          <p>状态：${checkin.status}</p>
          ${checkin.message ? `<p>留言：${checkin.message}</p>` : ''}
          <p>连续签到：${stats.consecutiveDays} 天</p>
        `;
        statusDiv.style.display = 'block';
        formDiv.style.display = 'none';
      } else {
        statusDiv.style.display = 'none';
        formDiv.style.display = 'block';
      }
      
      // 显示最近签到记录
      const recentDiv = document.getElementById('recentCheckins');
      if (stats.recentCheckins.length === 0) {
        recentDiv.innerHTML = '<p style="text-align: center; color: #999;">暂无签到记录</p>';
      } else {
        recentDiv.innerHTML = stats.recentCheckins.map(checkin => {
          const statusEmoji = {
            '很好': '😊',
            '还行': '😌',
            '有点累': '😔',
            '需要联系': '🆘'
          };
          
          return `
            <div class="checkin-item">
              <div>
                <div class="date">${checkin.checkin_date}</div>
                <div class="status">
                  <span>${statusEmoji[checkin.status]}</span>
                  <span>${checkin.status}</span>
                </div>
                ${checkin.message ? `<div class="message">${checkin.message}</div>` : ''}
              </div>
            </div>
          `;
        }).join('');
      }
    }
  } catch (error) {
    console.error('加载签到统计错误:', error);
  }
}

// 添加联系人
async function handleAddContact(event) {
  event.preventDefault();
  
  const contactName = document.getElementById('contactName').value;
  const contactEmail = document.getElementById('contactEmail').value;
  const contactPhone = document.getElementById('contactPhone').value;

  if (!contactEmail && !contactPhone) {
    showToast('邮箱或手机号至少填写一项', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/contacts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ contactName, contactEmail, contactPhone })
    });

    const data = await response.json();

    if (data.success) {
      showToast('联系人添加成功', 'success');
      document.getElementById('contactName').value = '';
      document.getElementById('contactEmail').value = '';
      document.getElementById('contactPhone').value = '';
      loadContacts();
    } else {
      showToast(data.error || '添加失败', 'error');
    }
  } catch (error) {
    console.error('添加联系人错误:', error);
    showToast('网络错误，请稍后重试', 'error');
  }
}

// 加载联系人列表
async function loadContacts() {
  try {
    const response = await fetch(`${API_BASE}/api/contacts`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (data.success) {
      const listDiv = document.getElementById('contactsList');
      
      if (data.contacts.length === 0) {
        listDiv.innerHTML = '<p style="text-align: center; color: #999; margin-top: 2rem;">暂无联系人</p>';
      } else {
        listDiv.innerHTML = data.contacts.map(contact => `
          <div class="contact-item">
            <div class="contact-info">
              <h4>${contact.contact_name}</h4>
              ${contact.contact_email ? `<p>📧 ${contact.contact_email}</p>` : ''}
              ${contact.contact_phone ? `<p>📱 ${contact.contact_phone}</p>` : ''}
            </div>
            <div class="contact-actions">
              <button class="btn-small btn-danger" onclick="deleteContact(${contact.id})">删除</button>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (error) {
    console.error('加载联系人错误:', error);
  }
}

// 删除联系人
async function deleteContact(contactId) {
  if (!confirm('确定要删除这个联系人吗？')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/contacts/${contactId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (data.success) {
      showToast('联系人已删除', 'success');
      loadContacts();
    } else {
      showToast(data.error || '删除失败', 'error');
    }
  } catch (error) {
    console.error('删除联系人错误:', error);
    showToast('网络错误，请稍后重试', 'error');
  }
}

// 加载统计数据
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/api/checkin/stats`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (data.success) {
      const stats = data.stats;
      
      // 更新统计数字
      document.getElementById('consecutiveDays').textContent = stats.consecutiveDays;
      document.getElementById('totalCheckins').textContent = stats.totalCheckins;
      
      // 绘制图表
      drawChart(stats.recentCheckins);
    }
  } catch (error) {
    console.error('加载统计数据错误:', error);
  }
}

// 绘制签到趋势图
function drawChart(checkins) {
  const canvas = document.getElementById('checkinChart');
  const ctx = canvas.getContext('2d');
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (checkins.length === 0) {
    ctx.fillStyle = '#999';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('暂无数据', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  // 准备数据
  const statusValues = {
    '很好': 4,
    '还行': 3,
    '有点累': 2,
    '需要联系': 1
  };
  
  const data = checkins.reverse().map(c => ({
    date: c.checkin_date.substring(5),
    value: statusValues[c.status] || 0
  }));
  
  // 绘制参数
  const padding = 40;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;
  const pointSpacing = chartWidth / (data.length - 1 || 1);
  
  // 绘制坐标轴
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();
  
  // 绘制折线
  ctx.strokeStyle = '#667eea';
  ctx.lineWidth = 3;
  ctx.beginPath();
  
  data.forEach((point, index) => {
    const x = padding + index * pointSpacing;
    const y = canvas.height - padding - (point.value / 4) * chartHeight;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
  
  // 绘制数据点
  data.forEach((point, index) => {
    const x = padding + index * pointSpacing;
    const y = canvas.height - padding - (point.value / 4) * chartHeight;
    
    ctx.fillStyle = '#667eea';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制日期标签
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(point.date, x, canvas.height - padding + 20);
  });
}

// 页面加载时初始化
if (checkAuth()) {
  showCheckinSection();
}
