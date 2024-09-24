import { z } from 'zod';

/**
 * Discord snowflake ID schema
 */
const zSnowflake = z.string().regex(/^\d{17,19}$/gm);

// ————————————————————————————————————————————————————————————————————————————————
// Global Configuration
// ————————————————————————————————————————————————————————————————————————————————

export const configSchema = z.object({
  owners: z.array(zSnowflake).default([])
});

export type GlobalConfig = z.infer<typeof configSchema>;
