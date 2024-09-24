import Command, { CommandCategory } from '@/managers/commands/Command';
import { ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';

export default class Ping extends Command<ChatInputCommandInteraction<'cached'>> {
  constructor() {
    super({
      category: CommandCategory.General,
      usage: [],
      data: {
        name: 'ping',
        description: 'Get the websocket heartbeat and roundtrip latency,',
        type: ApplicationCommandType.ChatInput
      }
    });
  }

  async execute(interaction: ChatInputCommandInteraction<'cached'>) {
    const start = performance.now();
    await interaction.deferReply({ ephemeral: true });
    const end = performance.now();

    return interaction.editReply(
      `Pong! Roundtrip took: ${Math.round(end - start)}ms. Heartbeat: ${this.client.ws.ping}ms.`
    );
  }
}
