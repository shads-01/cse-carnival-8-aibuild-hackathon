import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from workspace root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().default('default_jwt_secret_key_12345'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  SUPABASE_ANON_KEY: z.string().optional()
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Environment configuration validation failed.');
}

export const config = {
  port: parsedEnv.data.PORT,
  env: parsedEnv.data.NODE_ENV,
  clientUrl: parsedEnv.data.CLIENT_URL,
  jwtSecret: parsedEnv.data.JWT_SECRET,
  supabase: {
    url: parsedEnv.data.SUPABASE_URL,
    serviceRoleKey: parsedEnv.data.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: parsedEnv.data.SUPABASE_ANON_KEY
  }
};
