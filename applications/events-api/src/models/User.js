import pool from '../config/database.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

class User {
  /**
   * Create a new user
   */
  static async create({ email, password, firstName, lastName, role = 'user' }) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, role, is_active, email_verified, created_at
    `;

    const result = await pool.query(query, [
      email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role
    ]);

    return result.rows[0];
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const query = `
      SELECT id, email, password_hash, first_name, last_name, role, 
             is_active, email_verified, last_login_at, failed_login_attempts, 
             locked_until, created_at, updated_at
      FROM users
      WHERE email = $1
    `;

    const result = await pool.query(query, [email.toLowerCase()]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const query = `
      SELECT id, email, first_name, last_name, role, is_active, 
             email_verified, last_login_at, created_at, updated_at
      FROM users
      WHERE id = $1 AND is_active = true
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Check if account is locked
   */
  static isLocked(user) {
    if (!user.locked_until) return false;
    return new Date(user.locked_until) > new Date();
  }

  /**
   * Record failed login attempt
   */
  static async recordFailedLogin(userId) {
    const query = `
      UPDATE users
      SET failed_login_attempts = failed_login_attempts + 1,
          locked_until = CASE
            WHEN failed_login_attempts + 1 >= $1
            THEN NOW() + INTERVAL '${LOCK_TIME / 1000} seconds'
            ELSE locked_until
          END
      WHERE id = $2
      RETURNING failed_login_attempts, locked_until
    `;

    const result = await pool.query(query, [MAX_FAILED_ATTEMPTS, userId]);
    return result.rows[0];
  }

  /**
   * Record successful login
   */
  static async recordSuccessfulLogin(userId) {
    const query = `
      UPDATE users
      SET last_login_at = NOW(),
          failed_login_attempts = 0,
          locked_until = NULL
      WHERE id = $1
    `;

    await pool.query(query, [userId]);
  }

  /**
   * Update user profile
   */
  static async update(userId, updates) {
    const allowedFields = ['first_name', 'last_name', 'email'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const setClause = fields.map((field, idx) => `${field} = $${idx + 2}`).join(', ');
    const values = fields.map(field => updates[field]);

    const query = `
      UPDATE users
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING id, email, first_name, last_name, role, is_active, email_verified, updated_at
    `;

    const result = await pool.query(query, [userId, ...values]);
    return result.rows[0];
  }

  /**
   * Change password
   */
  static async changePassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const query = `
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
    `;

    await pool.query(query, [passwordHash, userId]);
  }

  /**
   * Deactivate user account
   */
  static async deactivate(userId) {
    const query = `
      UPDATE users
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
    `;

    await pool.query(query, [userId]);
  }

  /**
   * Get all users (admin only)
   */
  static async findAll(filters = {}) {
    let query = `
      SELECT id, email, first_name, last_name, role, is_active, 
             email_verified, last_login_at, created_at
      FROM users
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    if (filters.role) {
      query += ` AND role = $${paramCount}`;
      values.push(filters.role);
      paramCount++;
    }

    if (filters.isActive !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      values.push(filters.isActive);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }
}

export default User;
