import { ClientEvents, Events } from 'discord.js';

import { client } from '@/index';

// The base class for all event listeners.
export default abstract class EventListener {
  // The client instance this event listener is attached to.

  public client = client;

  /**
   * @param event The event to listen for
   * @param options The options for the event listener.
   * @param options.once Whether the event should only be listened for once.
   * @protected
   */
  protected constructor(
    public readonly event: Extract<Events, keyof ClientEvents>,
    public readonly options?: { once: boolean }
  ) {}

  /**
   * Handles the event.
   * @param args The arguments to pass to the event listener.
   */
  abstract execute(...args: unknown[]): Promise<unknown> | unknown;
}
