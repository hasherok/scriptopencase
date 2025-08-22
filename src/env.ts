import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(10),
  PORT: z.coerce.number().default(3000),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_USERNAME: z.string().min(3),
  ADMIN_PASSWORD: z.string().min(6)
});

export const env = EnvSchema.parse(process.env);