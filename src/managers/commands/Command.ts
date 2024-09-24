import { ApplicationCommandData, CommandInteraction, PermissionFlagsBits } from 'discord.js';

import { client } from '@/index';

// The base class for all commands.
export default abstract class Command<T extends CommandInteraction> {
  /**
   * The client that owns this command.
   */

  public client = client;

  /**
   * The category of the command.
   */

  public readonly category: CommandCategory | null;

  /**
   * Usage example for the command.
   */

  public readonly usage: string | string[] | null;

  /**
   * The (application command) data for the command.
   */

  public readonly data: ApplicationCommandData;

  /**
   * @param options.usage The usage examples for the command.
   * @param options.category The category of the command.
   * @param options.data The (application command) data for the command.
   * @protected
   */
  protected constructor(options: CommandOptions) {
    this.category = options.category ?? null;
    this.data = {
      ...options.data,
      defaultMemberPermissions: (options.data.defaultMemberPermissions ??= PermissionFlagsBits.SendMessages),
      dmPermission: false
    };
    this.usage = options.usage ?? null;
  }

  /**
   * Handles the command interaction. Mentions are disabled by default.
   * @param interaction The interaction to handle.
   */
  abstract execute(interaction: T): unknown;
}

interface CommandOptions {
  category?: CommandCategory;
  usage?: string | string[];
  data: ApplicationCommandData;
}

export enum CommandCategory {
  Management = 'Management',
  General = 'General'
}
