import { pool } from '../config/mysql';

export const findCanalByPhone = async (phone) => {
  const [rows] = await pool.query(
    'SELECT * FROM canales WHERE numero_telefonico = ? LIMIT 1',
    [phone]
  );
  return rows[0] || null;
};
