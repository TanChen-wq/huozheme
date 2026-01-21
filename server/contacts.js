const { dbGet, dbAll, dbRun } = require('./database');

/**
 * 添加联系人
 */
const addContact = async (userId, contactEmail, contactPhone, contactName) => {
  try {
    // 检查是否已存在
    const existing = await dbGet(
      'SELECT id FROM contacts WHERE user_id = ? AND (contact_email = ? OR contact_phone = ?)',
      [userId, contactEmail, contactPhone]
    );

    if (existing) {
      throw new Error('该联系人已存在');
    }

    const result = await dbRun(
      'INSERT INTO contacts (user_id, contact_email, contact_phone, contact_name) VALUES (?, ?, ?, ?)',
      [userId, contactEmail, contactPhone, contactName]
    );

    return { id: result.id, contactEmail, contactPhone, contactName };
  } catch (error) {
    throw error;
  }
};

/**
 * 获取用户的所有联系人
 */
const getContacts = async (userId) => {
  try {
    const contacts = await dbAll(
      'SELECT * FROM contacts WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return contacts;
  } catch (error) {
    throw error;
  }
};

/**
 * 删除联系人
 */
const deleteContact = async (userId, contactId) => {
  try {
    const result = await dbRun(
      'DELETE FROM contacts WHERE id = ? AND user_id = ?',
      [contactId, userId]
    );

    if (result.changes === 0) {
      throw new Error('联系人不存在或无权删除');
    }

    return { success: true };
  } catch (error) {
    throw error;
  }
};

/**
 * 更新联系人信息
 */
const updateContact = async (userId, contactId, contactEmail, contactPhone, contactName) => {
  try {
    const result = await dbRun(
      'UPDATE contacts SET contact_email = ?, contact_phone = ?, contact_name = ? WHERE id = ? AND user_id = ?',
      [contactEmail, contactPhone, contactName, contactId, userId]
    );

    if (result.changes === 0) {
      throw new Error('联系人不存在或无权修改');
    }

    return { success: true };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  addContact,
  getContacts,
  deleteContact,
  updateContact
};
