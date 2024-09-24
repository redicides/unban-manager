import { Collection, CommandInteraction} from 'discord.js';

import path from 'path';
import fs from 'fs';

import { pluralize } from '@/utils';
import { client } from '@/index';

import Command from './Command';
import Logger, { AnsiColor } from '@/utils/logger';

// Utility class for managing commands.
export default class CommandManager {
  public static readonly global_commands = new Collection<string, Command<CommandInteraction>>();

  static async cache() {
    const directory = path.resolve('src/commands');

    if (!fs.existsSync(directory)) {
      Logger.info(`Skipping command caching: commands directory not found.`);
      return;
    }

    let commandCount = 0;

    const files = fs.readdirSync(directory);

    try {
      for (const file of files) {
        const commandModule = require(`../../commands/${file.slice(0, -3)}`);
        const commandClass = commandModule.default;
        const command = new commandClass();

        if (!(command instanceof Command)) {
          Logger.warn(`Skipping command caching: ${file} is not an instance of Command.`);
          continue;
        }

        let logMessage: string;
        let level: string;

        CommandManager.global_commands.set(command.data.name, command);

        logMessage = `Cached command "${command.data.name}"`;
        level = 'APPLICATION';

        Logger.log(level, logMessage, {
          color: AnsiColor.Purple
        });

        commandCount++;
      }
    } catch (error) {
      Logger.error(`Error when caching commands:`, error);
    } finally {
      Logger.info(`Cached ${commandCount} ${pluralize(commandCount, 'command')}.`);
    }
  }

  static async publish() {
    Logger.info('Publishing commands...');

    const logMessage = (commandCount: number): string =>
      `Published ${commandCount} ${pluralize(commandCount, 'command')}.`;

    const globalCommands = CommandManager.global_commands.map(command => command.data);

    if (!globalCommands.length) {
      Logger.warn('No global commands to publish.');
      return;
    }

    const publishedCommands = await client.application?.commands.set(globalCommands).catch(() => null);

    if (!publishedCommands) {
      throw new Error('Failed to publish global commands.');
    }

    Logger.log('GLOBAL', logMessage(publishedCommands.size), {
      color: AnsiColor.Purple
    });
  }

  static _getCommand(commandName: string): Command<CommandInteraction> | null {
    return CommandManager.global_commands.get(commandName) ?? null;
  }
}
