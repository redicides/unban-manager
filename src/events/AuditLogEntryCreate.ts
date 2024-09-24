import { AuditLogEvent, Colors, EmbedBuilder, Events, Guild, GuildAuditLogsEntry, GuildMember, User } from 'discord.js';
import { Reban, Guild as DatabaseGuild } from '@prisma/client';

import { prisma } from '@/index';
import { userMentionWithId } from '@/utils';

import EventListener from '@/managers/events/EventListener';

export default class AuditLogEntryCreate extends EventListener {
  constructor() {
    super(Events.GuildAuditLogEntryCreate);
  }

  async execute(auditLog: GuildAuditLogsEntry, guild: Guild) {
    const { target, executorId } = auditLog;

    if (auditLog.action !== AuditLogEvent.MemberBanRemove) return;

    let config = await prisma.guild.findUnique({
      where: { id: guild.id }
    });

    if (!config) {
      config = await prisma.guild.create({
        data: { id: guild.id }
      });
    }

    if (!executorId || executorId === this.client.user!.id) return;
    if (!(target instanceof User)) return;

    const executor = await guild.members.fetch(executorId).catch(() => null);

    if (!executor) {
      return AuditLogEntryCreate._handleUnknownExecutor({ config, guild, target });
    }

    const managerRoles = JSON.parse(config.manager_roles) as string[];

    if (!executor.roles.cache.some(role => managerRoles.includes(role.id))) {
      return AuditLogEntryCreate._handleReban({ config, guild, target, executor });
    }

    return AuditLogEntryCreate._handleLog({ config, guild, target, executor });
  }

  static async _handleUnknownExecutor(data: { config: DatabaseGuild; guild: Guild; target: User }) {
    const { config, guild, target } = data;

    if (!config.logging_toggled || !config.logging_channel_id) return;

    const channel = await guild.channels.fetch(config.logging_channel_id).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const content = `${userMentionWithId(
      target.id
    )} was unbanned by an unknown executor. Because of this, I could not validate if the executor was a manager.Please review the unban manually.`;

    return channel.send({ content }).catch(() => {});
  }

  static async _handleReban(data: { config: DatabaseGuild; guild: Guild; target: User; executor: GuildMember }) {
    const { config, guild, target, executor } = data;

    const reason = `Automatically re-banned: Executor @${executor.user.username} (${executor.user.id}) is not a manager.`;

    await guild.bans.create(target.id, { reason }).catch(() => {
      return AuditLogEntryCreate._handleFailedReban({ config, guild, target, executor });
    });

    const reban = await prisma.reban.create({
      data: {
        guild_id: guild.id,
        target_id: target.id,
        executor_id: executor.id,
        reason: reason,
        created_at: Date.now()
      }
    });

    return AuditLogEntryCreate._handleRebanLog({ config, guild, executor, reban });
  }

  static async _handleRebanLog(data: { config: DatabaseGuild; guild: Guild; executor: GuildMember; reban: Reban }) {
    const { config, guild, executor, reban } = data;

    if (!config.logging_toggled || !config.logging_channel_id) return;

    const channel = await guild.channels.fetch(config.logging_channel_id).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Re-ban #${reban.id}`, iconURL: executor.displayAvatarURL() })
      .setColor(Colors.NotQuiteBlack)
      .setFields([
        {
          name: 'Executor',
          value: userMentionWithId(reban.executor_id)
        },
        {
          name: 'Target',
          value: userMentionWithId(reban.target_id)
        },
        {
          name: 'Reason',
          value: reban.reason
        }
      ])
      .setTimestamp(Number(reban.created_at));

    return channel.send({ embeds: [embed] }).catch(() => {});
  }

  static async _handleLog(data: { config: DatabaseGuild; guild: Guild; target: User; executor: GuildMember }) {
    const { config, guild, target, executor } = data;

    if (!config.logging_toggled || !config.logging_channel_id) return;

    const channel = await guild.channels.fetch(config.logging_channel_id).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const content = `${userMentionWithId(target.id)} was unbanned by ${userMentionWithId(
      executor.id
    )}. The unban was reviewed and the executor passed all checks.`;

    return channel.send({ content }).catch(() => {});
  }

  static async _handleFailedReban(data: { config: DatabaseGuild; guild: Guild; target: User; executor: GuildMember }) {
    const { config, guild, target, executor } = data;

    if (!config.logging_toggled || !config.logging_channel_id) return;

    const channel = await guild.channels.fetch(config.logging_channel_id).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const content = `${userMentionWithId(target.id)} was unbanned by ${userMentionWithId(
      executor.id
    )} but I failed to re-ban them. Please review the unban manually, and ensure I have the \`Ban Members\` permission.`;

    return channel.send({ content }).catch(() => {});
  }
}
