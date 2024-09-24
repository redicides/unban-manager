import EventListener from '@/managers/events/EventListener';
import { Events, Guild } from 'discord.js';
import { prisma } from '@/index';
import Logger from '@/utils/logger';

export default class GuildCreate extends EventListener {
  constructor() {
    super(Events.GuildCreate);
  }

  async execute(guild: Guild) {
    await prisma.guild.upsert({
      where: { id: guild.id },
      create: { id: guild.id },
      update: {}
    });

    Logger.info(`Confirmed database guild entry for ${guild.name} (${guild.id}).`);
  }
}
