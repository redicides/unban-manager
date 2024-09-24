import { GatewayIntentBits, GuildMember, Options, Partials, Sweepers } from 'discord.js';

/**
 * This file contains all the constants used throughout the bot.
 */

// ————————————————————————————————————————————————————————————————————————————————
// Client configuration
// ————————————————————————————————————————————————————————————————————————————————

/**
 * The gateway intent bits for the client.
 */

export const CLIENT_INTENTS = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildModeration
];

/**
 * The partials for the client.
 */

export const CLIENT_PARTIALS = [Partials.User, Partials.GuildMember];

/**
 * The cache options for the client.
 */

export const CLIENT_CACHE_OPTIONS = Options.cacheWithLimits({
  ...Options.DefaultMakeCacheSettings,
  GuildMessageManager: 0, // Channel messages
  BaseGuildEmojiManager: 0, // Guild emojis
  StageInstanceManager: 0, // Guild stage instances
  ThreadManager: 0, // Channel threads
  AutoModerationRuleManager: 0, // Auto-moderation rules
  DMMessageManager: 0, // DM messages
  GuildForumThreadManager: 0,
  GuildInviteManager: 0, // Guild invites
  PresenceManager: 0, // Guild presences
  GuildScheduledEventManager: 0, // Guild scheduled events
  ThreadMemberManager: 0, // Thread members
  GuildBanManager: 100 // Guild bans
});

/**
 * The sweeper options for the client.
 *
 * Guild members and bans are swept every 10 minutes.
 * Bans must be older than 30 minutes to get swept, while members must be older than 10 minutes.
 */

export const CLIENT_SWEEPER_OPTIONS = {
  ...Options.DefaultSweeperSettings,
  guildMembers: {
    interval: 600,
    filter: Sweepers.filterByLifetime({
      lifetime: 600,
      excludeFromSweep: (member: GuildMember) => member.id !== process.env.BOT_ID!
    })
  },
  bans: {
    interval: 600,
    filter: Sweepers.filterByLifetime({
      lifetime: 1800
    })
  }
};
