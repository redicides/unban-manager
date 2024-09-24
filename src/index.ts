import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

import { UnbanManagerClient } from '@utils/client';
import { sleep } from '@/utils';

import Logger, { AnsiColor } from '@utils/logger';
import CommandManager from '@managers/commands/CommandManager';
import EventListenerManager from '@managers/events/EventListenerManager';
import ConfigManager from '@managers/config/ConfigManager';

/**
 * The main client instance for unban manager.
 * Exported for ease of use.
 */

export const client = new UnbanManagerClient();

/**
 * The main database client for unban manager.
 */

export const prisma = new PrismaClient();

async function main() {
  if (!process.env.BOT_TOKEN) {
    throw new Error('The environment variable BOT_TOKEN is not defined.');
  }

  if (!process.env.BOT_ID) {
    throw new Error('The environment variable BOT_ID is not defined.');
  }

  // Cache global configuration

  await ConfigManager.cacheGlobalConfig();

  // Cache commands

  await CommandManager.cache();

  // Mount event listeners

  await EventListenerManager.mount();

  // Connect to the database

  await prisma
    .$connect()
    .catch(error => {
      Logger.error('Failed to connect to the database.', error);
      process.exit(1);
    })
    .then(() => {
      Logger.log('PRISMA', 'Successfully connected to the database.', { color: AnsiColor.Green, full: true });
    });

  // Login to Discord

  await client.login(process.env.BOT_TOKEN);

  // Wait 2 seconds to ensure the bot is ready

  Logger.warn('Waiting 2 seconds to ensure the client is ready before publishing commands...');
  await sleep(2000);

  // Publish commands

  await CommandManager.publish();
}

main().catch(error => {
  Logger.error(`An error occurred while starting the bot...`, error);
});

process.on('unhandledRejection', error => {
  Logger.error(`An unhandled rejection occurred...`, error);
});

process.on('uncaughtException', error => {
  Logger.error(`An uncaught exception occurred...`, error);
});
