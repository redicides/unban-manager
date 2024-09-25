import { AuditLogEvent, Colors, EmbedBuilder, Events, Guild, GuildAuditLogsEntry, GuildMember, User } from 'discord.js';
import { Reban, Guild as DatabaseGuild } from '@prisma/client';

import { prisma, client } from '@/index';
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

    const offender = await guild.members.fetch(executorId).catch(() => null);

    if (!offender) {
      return AuditLogEntryCreate.handleUnknownOffender({ config, guild, target });
    }

    const managerRoles = JSON.parse(config.manager_roles) as string[];

    if (!offender.roles.cache.some(role => managerRoles.includes(role.id))) {
      return AuditLogEntryCreate.handleReban({ config, guild, target, offender });
    }

    return AuditLogEntryCreate.log({ config, guild, target, offender });
  }

  static async handleUnknownOffender(data: { config: DatabaseGuild; guild: Guild; target: User }) {
    const { config, guild, target } = data;

    if (!config.logging_toggled || !config.logging_channel_id) return;

    const channel = await guild.channels.fetch(config.logging_channel_id).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const content = `${userMentionWithId(
      target.id
    )} was unbanned by an unknown executor. Because of this, I could not validate they were a manager. Please review the unban manually.`;

    return channel.send({ content }).catch(() => {});
  }

  static async handleReban(data: { config: DatabaseGuild; guild: Guild; target: User; offender: GuildMember }) {
    const { config, guild, target, offender } = data;

    const reason = `Automatically re-banned: offender @${offender.user.username} (${offender.user.id}) is not recognized as a manager.`;

    await guild.members.ban(target.id, { reason: reason }).catch(() => {
      return AuditLogEntryCreate._handleFailedReban({ config, guild, target, offender });
    });

    const reban = await prisma.reban.create({
      data: {
        guild_id: guild.id,
        target_id: target.id,
        offender_id: offender.id,
        reason: reason,
        created_at: Date.now()
      }
    });

    return AuditLogEntryCreate._handleRebanLog({ config, guild, offender, reban });
  }

  static async log(data: { config: DatabaseGuild; guild: Guild; target: User; offender: GuildMember }) {
    const { config, guild, target, offender } = data;

    if (!config.logging_toggled || !config.logging_channel_id) return;

    const channel = await guild.channels.fetch(config.logging_channel_id).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const content = `${userMentionWithId(target.id)} was unbanned by ${userMentionWithId(
      offender.id
    )}. The unban was reviewed and the executor passed all checks.`;

    return channel.send({ content }).catch(() => {});
  }

  static async _handleRebanLog(data: { config: DatabaseGuild; guild: Guild; offender: GuildMember; reban: Reban }) {
    const { config, guild, offender, reban } = data;

    if (!config.logging_toggled || !config.logging_channel_id) return;

    const channel = await guild.channels.fetch(config.logging_channel_id).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Re-ban #${reban.id}`, iconURL: offender.displayAvatarURL() })
      .setColor(Colors.NotQuiteBlack)
      .setFields([
        {
          name: 'Offender',
          value: userMentionWithId(reban.offender_id)
        },
        {
          name: 'Target',
          value: userMentionWithId(reban.target_id)
        },
        {
          name: 'Reason',
          value: `Automatically re-banned: offender is not recognized as a manager.`
        }
      ])
      .setTimestamp(Number(reban.created_at));

    return channel.send({ embeds: [embed] }).catch(() => {});
  }

  static async _handleFailedReban(data: { config: DatabaseGuild; guild: Guild; target: User; offender: GuildMember }) {
    const { config, guild, target, offender } = data;

    if (!config.logging_toggled || !config.logging_channel_id) return;

    const channel = await guild.channels.fetch(config.logging_channel_id).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const content = `${userMentionWithId(target.id)} was unbanned by ${userMentionWithId(
      offender.id
    )} but I failed to re-ban them. Please review the unban manually, and ensure I have the \`Ban Members\` permission.`;

    return channel.send({ content }).catch(() => {});
  }
}
