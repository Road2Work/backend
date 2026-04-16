import { nanoid } from 'nanoid';
import pool from '../config/database.ts';
import type { RefreshTokenInput } from '../validations/auth.validation.ts';

export const addRefreshToken = async ({ userId, refreshToken }: RefreshTokenInput) => {
    const id = nanoid(12);
    const query = {
        text: 'INSERT INTO authentications (id, user_id, refresh_token) VALUES ($1, $2, $3)',
        values: [id, userId, refreshToken]
    }

    await pool.query(query);
};

export const deleteRefreshToken = async ({ refreshToken }: { refreshToken: string }) => {
    const query = {
        text: 'DELETE FROM authentications WHERE refresh_token = $1',
        values: [refreshToken]
    }

    await pool.query(query);
};

export const verifyAndRefreshToken = async ({ refreshToken }: { refreshToken: string }) => {
    const query = {
        text: `UPDATE authentications
        SET updated_at = CURRENT_TIMESTAMP
        WHERE refresh_token = $1
        RETURNING id, user_id, refresh_token`,
        values: [refreshToken]
    }

    const result = await pool.query(query);

    if (!result.rows.length) {
        return null;
    }

    return result.rows[0];
};