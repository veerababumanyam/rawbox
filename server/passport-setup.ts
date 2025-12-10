import dotenv from 'dotenv';
dotenv.config();

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from './db';

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = result.rows[0];
    done(null, user);
  } catch (err) {
    done(err);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_REDIRECT_URI!,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const result = await pool.query('SELECT * FROM users WHERE google_id = $1', [profile.id]);
        if (result.rows.length > 0) {
          return done(null, result.rows[0]);
        } else {
          const newUserResult = await pool.query(
            'INSERT INTO users (email, google_id) VALUES ($1, $2) RETURNING *',
            [profile.emails![0].value, profile.id]
          );
          return done(null, newUserResult.rows[0]);
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);
