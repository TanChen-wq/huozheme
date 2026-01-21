const nodemailer = require('nodemailer');
const { dbRun, dbAll } = require('./database');
const { getContacts } = require('./contacts');

// 配置邮件发送器（示例配置，需要根据实际情况修改）
const transporter = nodemailer.createTransport({
  host: 'smtp.example.com', // SMTP 服务器地址
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@example.com', // 发件人邮箱
    pass: 'your-password' // 邮箱密码或授权码
  }
});

/**
 * 发送邮件通知
 */
const sendEmailNotification = async (to, subject, html) => {
  try {
    // 在演示模式下，只记录日志而不实际发送
    console.log('=== 邮件通知 ===');
    console.log('收件人:', to);
    console.log('主题:', subject);
    console.log('内容:', html);
    console.log('================');

    // 如果需要实际发送邮件，取消下面的注释
    /*
    const info = await transporter.sendMail({
      from: '"活着么" <your-email@example.com>',
      to: to,
      subject: subject,
      html: html
    });
    return info;
    */

    return { success: true, mode: 'demo' };
  } catch (error) {
    console.error('邮件发送失败:', error);
    throw error;
  }
};

/**
 * 发送短信通知（模拟）
 */
const sendSMSNotification = async (phone, message) => {
  try {
    // 模拟短信发送
    console.log('=== 短信通知 ===');
    console.log('手机号:', phone);
    console.log('内容:', message);
    console.log('================');

    return { success: true, mode: 'demo' };
  } catch (error) {
    console.error('短信发送失败:', error);
    throw error;
  }
};

/**
 * 生成签到通知内容
 */
const generateCheckinNotification = (username, status, message) => {
  const statusEmoji = {
    '很好': '😊',
    '还行': '😌',
    '有点累': '😔',
    '需要联系': '🆘'
  };

  const emoji = statusEmoji[status] || '✅';
  const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

  return {
    subject: `${username} 今日签到通知`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 8px;">
          <h2 style="color: #667eea; text-align: center;">${emoji} ${username} 今日签到</h2>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            <strong>状态：</strong>${status}<br>
            <strong>时间：</strong>${time}<br>
            ${message ? `<strong>留言：</strong>${message}<br>` : ''}
          </p>
          <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
            这是来自《活着么》的自动通知
          </p>
        </div>
      </div>
    `,
    text: `${username} 于 ${time} 签到，状态：${status}${message ? `，留言：${message}` : ''}`
  };
};

/**
 * 生成未签到提醒内容
 */
const generateInactiveNotification = (username) => {
  return {
    subject: `⚠️ ${username} 超过 24 小时未签到`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 8px;">
          <h2 style="color: #f5576c; text-align: center;">⚠️ 未签到提醒</h2>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            您关注的用户 <strong>${username}</strong> 已经超过 24 小时未签到。<br>
            如有需要，请及时联系确认安全。
          </p>
          <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
            这是来自《活着么》的自动提醒
          </p>
        </div>
      </div>
    `,
    text: `${username} 已经超过 24 小时未签到，请及时联系确认安全。`
  };
};

/**
 * 通知联系人用户已签到
 */
const notifyContactsCheckin = async (userId, username, status, message) => {
  try {
    const contacts = await getContacts(userId);
    const notification = generateCheckinNotification(username, status, message);

    for (const contact of contacts) {
      // 发送邮件
      if (contact.contact_email) {
        await sendEmailNotification(
          contact.contact_email,
          notification.subject,
          notification.html
        );
      }

      // 发送短信
      if (contact.contact_phone) {
        await sendSMSNotification(
          contact.contact_phone,
          notification.text
        );
      }

      // 记录通知
      await dbRun(
        'INSERT INTO notifications (user_id, contact_id, type, content) VALUES (?, ?, ?, ?)',
        [userId, contact.id, 'checkin', notification.text]
      );
    }

    return { success: true, count: contacts.length };
  } catch (error) {
    console.error('通知发送失败:', error);
    throw error;
  }
};

/**
 * 通知联系人用户未签到
 */
const notifyContactsInactive = async (userId, username) => {
  try {
    const contacts = await getContacts(userId);
    const notification = generateInactiveNotification(username);

    for (const contact of contacts) {
      // 发送邮件
      if (contact.contact_email) {
        await sendEmailNotification(
          contact.contact_email,
          notification.subject,
          notification.html
        );
      }

      // 发送短信
      if (contact.contact_phone) {
        await sendSMSNotification(
          contact.contact_phone,
          notification.text
        );
      }

      // 记录通知
      await dbRun(
        'INSERT INTO notifications (user_id, contact_id, type, content) VALUES (?, ?, ?, ?)',
        [userId, contact.id, 'inactive', notification.text]
      );
    }

    return { success: true, count: contacts.length };
  } catch (error) {
    console.error('通知发送失败:', error);
    throw error;
  }
};

/**
 * 获取通知历史
 */
const getNotificationHistory = async (userId, limit = 20) => {
  try {
    const notifications = await dbAll(
      `SELECT n.*, c.contact_name, c.contact_email 
       FROM notifications n
       LEFT JOIN contacts c ON n.contact_id = c.id
       WHERE n.user_id = ?
       ORDER BY n.sent_at DESC
       LIMIT ?`,
      [userId, limit]
    );
    return notifications;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  sendEmailNotification,
  sendSMSNotification,
  notifyContactsCheckin,
  notifyContactsInactive,
  getNotificationHistory
};
