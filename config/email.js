/**
 * 邮件配置文件
 * 
 * 使用说明：
 * 1. 如需启用真实邮件发送，请填写以下配置
 * 2. 修改 server/notification.js 中的 transporter 配置
 * 3. 取消 sendEmailNotification 函数中的注释
 */

module.exports = {
  // SMTP 服务器配置
  smtp: {
    // 常见邮箱服务商配置示例：
    
    // QQ 邮箱
    // host: 'smtp.qq.com',
    // port: 587,
    // secure: false,
    // auth: {
    //   user: 'your-email@qq.com',
    //   pass: 'your-authorization-code' // 授权码，不是密码
    // }
    
    // 163 邮箱
    // host: 'smtp.163.com',
    // port: 465,
    // secure: true,
    // auth: {
    //   user: 'your-email@163.com',
    //   pass: 'your-authorization-code'
    // }
    
    // Gmail
    // host: 'smtp.gmail.com',
    // port: 587,
    // secure: false,
    // auth: {
    //   user: 'your-email@gmail.com',
    //   pass: 'your-app-password'
    // }
    
    // 企业邮箱
    // host: 'smtp.exmail.qq.com',
    // port: 465,
    // secure: true,
    // auth: {
    //   user: 'your-email@company.com',
    //   pass: 'your-password'
    // }
  },
  
  // 发件人信息
  from: {
    name: '活着么',
    email: 'noreply@huozheme.com'
  },
  
  // 邮件模板配置
  templates: {
    checkin: {
      subject: '{{username}} 今日签到通知',
      colors: {
        primary: '#667eea',
        secondary: '#764ba2'
      }
    },
    inactive: {
      subject: '⚠️ {{username}} 超过 24 小时未签到',
      colors: {
        primary: '#f093fb',
        secondary: '#f5576c'
      }
    }
  }
};
