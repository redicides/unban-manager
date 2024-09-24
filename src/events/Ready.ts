import { Events } from 'discord.js';

import EventListener from '@/managers/events/EventListener';
import Logger, { AnsiColor } from '@/utils/logger';

export default class Ready extends EventListener {
  constructor() {
    super(Events.ClientReady);
  }

  async execute() {
    return Logger.log(`READY`, `Successfully logged in as ${this.client.user!.tag}.`, {
      color: AnsiColor.Green,
      full: true
    });
  }
}
