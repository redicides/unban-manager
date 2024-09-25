import {
  Colors,
  CommandInteraction,
  Events,
  Interaction,
  InteractionReplyOptions,
  InteractionResponse,
  InteractionType,
  Message
} from 'discord.js';

import CommandManager from '@/managers/commands/CommandManager';
import EventListener from '@/managers/events/EventListener';
import Logger from '@/utils/logger';

export default class InteractionCreate extends EventListener {
  public constructor() {
    super(Events.InteractionCreate);
  }

  async execute(interaction: Interaction) {
    switch (interaction.type) {
      case InteractionType.ApplicationCommand:
        return InteractionCreate.handleApplicationCommand(interaction);
    }
  }

  private static async handleApplicationCommand(interaction: CommandInteraction) {
    const command = CommandManager._getCommand(interaction.commandName);

    let content: string;

    if (!command) {
      Logger.error(
        `User ${interaction.user.username} (${interaction.user.id}) tried to run the command "${interaction.commandName}" but it could not be found.`
      );
      content = `I cannot execute the command \`${interaction.commandName}\` as it does not exist.\nIf you believe this is a mistake please contact a bot owner.`;
      return InteractionCreate._handleReply(interaction, {
        content
      });
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      if (typeof error !== 'string') {
        return InteractionCreate._handleError(interaction, error);
      }

      return InteractionCreate._handleErrorReply(interaction, {
        embeds: [{ description: error, color: Colors.Red }]
      });
    }
  }

  static _handleError(interaction: CommandInteraction, error: any) {
    Logger.error(`Error executing command "${interaction.commandName}".`, error);

    let content = `An error occurred while executing this command...`;

    return InteractionCreate._handleReply(interaction, {
      content
    });
  }

  static async _handleErrorReply(interaction: CommandInteraction, options: Omit<InteractionReplyOptions, 'ephemeral'>) {
    const reply = await InteractionCreate._handleReply(interaction, options);

    setTimeout(() => {
      if (reply) {
        interaction.deleteReply().catch(() => {});
      }
    }, 7500);
  }

  static async _handleReply(
    interaction: CommandInteraction,
    options: Omit<InteractionReplyOptions, 'ephemeral'>
  ): Promise<InteractionResponse | Message | null> {
    return !interaction.deferred && !interaction.replied
      ? await interaction.reply({ ...options, ephemeral: true }).catch(() => null)
      : await interaction.editReply(options).catch(() => null);
  }
}
