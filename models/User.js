const { pool } = require("../config/db");

const User = {
  //also async/await is used so express will not wait for this function to complete before moving on to the next middleware or route
  //used when login, we need to find the user by email to compare the password
  async findByEmail(email) {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    return rows[0] || null;
  //cause we dont need to return the whole array of users
  },

  // used when get profile, we need to find the user by id to return the profile info
  async findById(id) {
    const [rows] = await pool.query(
      "SELECT id, name, email, created_at FROM users WHERE id = ?",
      [id]
    ); 
    return rows[0] || null;
  },

  // create a new user
  async create({ name, email, hashedPassword }) {
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );
    return { id: result.insertId, name, email };
  },

  // check if email already exists
  async emailExists(email) {
    const [rows] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    return rows.length > 0;
  },
};

module.exports = User;