import pool from '../config/database.ts';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import type { RegisterInput } from '../validations/user.validation.ts';
import type { LoginInput } from '../validations/auth.validation.ts';

export const createUser = async ({ name, email, password, role }: RegisterInput) => {
    const id = nanoid(16);
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
        text: 'INSERT INTO users (id, name, email, password, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        values: [id, name, email, hashedPassword, role, createdAt, updatedAt]
    }

    const result = await pool.query(query);
    return result.rows[0];
};

export const verifyNewEmail = async (email: string) => {
    const query = {
        text: 'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
        values: [email]
    }

    const result = await pool.query(query);
    return result.rows.length > 0;
};

export const getUserById = async (id: string) => {
    const query = {
        text: 'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1',
        values: [id]
    }

    const result = await pool.query(query);
    return result.rows[0];
};

export const verifyUserCredential = async ({ email, password }: LoginInput) => {
    const query = {
        text: 'SELECT id, password FROM users WHERE email = $1',
        values: [email],
    };

    const result = await pool.query(query);
    if (!result.rows.length) {
        return null;
    }

    const { id, password: hashedPassword } = result.rows[0];
    const isPasswordMatch = await bcrypt.compare(password, hashedPassword);

    if (!isPasswordMatch) {
        return null;
    }
    return id;
};

export const getProfile = async (userId: string) => {
    const query = {
        text: 'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1',
        values: [userId],
    };

    const result = await pool.query(query);
    return result.rows[0];
};