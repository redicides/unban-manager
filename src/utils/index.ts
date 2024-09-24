import { GuildBasedChannel, Role, Snowflake, ThreadChannel } from 'discord.js';

import fs from 'fs';
import YAML from 'yaml';

/**
 * Pluralizes a word based on the given count
 *
 * @param count - The count used to determine the plural form
 * @param singular - The singular form of the word
 * @param plural - The plural form of the word, defaults to `{singular}s`
 * @returns The pluralized word
 */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

/**
 * Wait a certain amount of time before proceeding with the next step
 *
 * @param ms The amount of time to wait in milliseconds
 * @returns A promise that resolves after the specified time has elapsed
 */

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Reads a YAML file from the given path and returns the parsed content.
 *
 * @param path - The path to the YAML file.
 * @template T - The type of the parsed content.
 * @returns {T} The parsed content of the YAML file.
 */
export function readYamlFile<T>(path: string): T {
  const raw = fs.readFileSync(path, 'utf-8');
  return YAML.parse(raw);
}

export function userMentionWithId(id: Snowflake): `<@${Snowflake}> (\`${Snowflake}\`)` {
  return `<@${id}> (\`${id}\`)`;
}

export function channelMentionWithName(channel: GuildBasedChannel | ThreadChannel): `<#${Snowflake}> (\`#${string}\`)` {
  return `<#${channel.id}> (\`#${channel.name}\`)`;
}

export function roleMentionWithName(role: Role): `<@&${Snowflake}> (\`@${string}\`)` {
  return `<@&${role.id}> (\`@${role.name}\`)`;
}
