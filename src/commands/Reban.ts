import {
  Guild,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  EmbedField,
  GuildMember,
  PermissionFlagsBits,
  time,
  User
} from 'discord.js';
import { Guild as DatabaseGuild, Reban as RebanType } from '@prisma/client';

import { client, prisma } from '..';
import { userMentionWithId } from '@/utils';

import Command, { CommandCategory } from '@/managers/commands/Command';
import ConfigManager from '@/managers/config/ConfigManager';

export default class Reban extends Command<ChatInputCommandInteraction<'cached'>> {
  constructor() {
    super({
      category: CommandCategory.Management,
      usage: ['search <user>', 'view <id>', 'delete <id> <reason>', 'wipe <user> <reason>'],
      data: {
        name: 'reban',
        description: 'Re-ban related commands.',
        defaultMemberPermissions: PermissionFlagsBits.BanMembers,
        options: [
          {
            name: Subcommand.Search,
            description: 'Search all re-bans for a user.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'user',
                description: 'The user to search for.',
                type: ApplicationCommandOptionType.User,
                required: true
              },
              {
                name: 'page',
                description: 'The page of results to view.',
                type: ApplicationCommandOptionType.Number,
                required: false
              }
            ]
          },
          {
            name: Subcommand.View,
            description: 'View in depth information about a re-ban.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'id',
                description: 'The ID of the re-ban to view.',
                type: ApplicationCommandOptionType.Number,
                required: true
              }
            ]
          },
          {
            name: Subcommand.Delete,
            description: "Remove a re-ban from a user's record",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'id',
                description: 'The ID of the re-ban to delete.',
                type: ApplicationCommandOptionType.Number,
                required: true
              },
              {
                name: 'reason',
                description: 'The reason for deleting the re-ban.',
                type: ApplicationCommandOptionType.String,
                required: true,
                max_length: 1024
              }
            ]
          },
          {
            name: Subcommand.Wipe,
            description: 'Wipe all re-bans for a user.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'user',
                description: 'The user to wipe re-bans for.',
                type: ApplicationCommandOptionType.User,
                required: true
              },
              {
                name: 'reason',
                description: 'The reason for wiping the re-bans.',
                type: ApplicationCommandOptionType.String,
                required: true,
                max_length: 1024
              }
            ]
          }
        ]
      }
    });
  }

  async execute(interaction: ChatInputCommandInteraction<'cached'>) {
    const subcommand = interaction.options.getSubcommand(true);

    if (subcommand === Subcommand.Delete || subcommand === Subcommand.Wipe) {
      if (!ConfigManager.global_config.owners.includes(interaction.user.id)) {
        throw 'You cannot use this command as you are not recognized as an owner.';
      }
    }

    switch (subcommand) {
      case Subcommand.Search:
        return Reban.search(interaction);
      case Subcommand.View:
        return Reban.view(interaction);
      case Subcommand.Delete:
        return Reban.delete(interaction);
      case Subcommand.Wipe:
        return Reban.wipe(interaction);
    }
  }

  static async search(interaction: ChatInputCommandInteraction<'cached'>) {
    const target = interaction.options.getUser('user', true);
    let page = interaction.options.getNumber('page') ?? 1;

    await interaction.deferReply({
      ephemeral: false
    });

    const count = await prisma.reban.count({
      where: {
        guild_id: interaction.guildId,
        target_id: target.id
      }
    });

    let embed = new EmbedBuilder()
      .setAuthor({ name: `Re-bans for @${target.username}`, iconURL: target.displayAvatarURL() })
      .setColor(Colors.NotQuiteBlack)
      .setDescription(`No results found.`)
      .setFooter({ text: `User ID: ${target.id}` });

    if (count === 0) {
      return interaction.editReply({ embeds: [embed] });
    }

    const pages = Math.ceil(count / 7);
    if (page > pages) page = pages;

    const rebans = await prisma.reban.findMany({
      where: {
        guild_id: interaction.guildId,
        target_id: target.id
      },
      orderBy: {
        id: 'desc'
      },
      take: REBANS_PER_PAGE,
      skip: REBANS_PER_PAGE * (page - 1)
    });

    embed = new EmbedBuilder()
      .setAuthor({ name: `Re-bans for @${target.username}`, iconURL: target.displayAvatarURL() })
      .setColor(Colors.NotQuiteBlack)
      .setDescription(`Page \`${page}\`/\`${pages}\`\nTotal re-bans: \`${count}\``)
      .setFields(Reban._getEmbedFields(rebans))
      .setFooter({ text: `User ID: ${target.id}` });

    return interaction.editReply({ embeds: [embed] });
  }

  static async view(interaction: ChatInputCommandInteraction<'cached'>) {
    const id = interaction.options.getNumber('id', true);

    await interaction.deferReply({
      ephemeral: false
    });

    const reban = await prisma.reban.findUnique({
      where: { id: id, guild_id: interaction.guildId }
    });

    if (!reban) {
      throw 'A re-ban with that ID does not exist.';
    }

    const target = await client.users.fetch(reban.target_id).catch(() => null);
    const executor = await client.users.fetch(reban.executor_id).catch(() => null);

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Re-ban #${reban.id}`, iconURL: executor?.displayAvatarURL() })
      .setColor(Colors.NotQuiteBlack)
      .setFields([
        {
          name: 'Executor',
          value: executor ? userMentionWithId(executor.id) : 'Not Found'
        },
        {
          name: 'Target',
          value: target ? userMentionWithId(target.id) : 'Not Found'
        },
        {
          name: 'Reason',
          value: reban.reason
        }
      ])
      .setTimestamp(Number(reban.created_at));

    return interaction.editReply({ embeds: [embed] });
  }

  static async delete(interaction: ChatInputCommandInteraction<'cached'>) {
    const id = interaction.options.getNumber('id', true);
    const reason = interaction.options.getString('reason', true);

    await interaction.deferReply({
      ephemeral: false
    });

    const reban = await prisma.reban.findUnique({
      where: { id: id, guild_id: interaction.guildId },
      include: { guild: true }
    });

    if (!reban) {
      throw 'A re-ban with that ID does not exist.';
    }

    await prisma.reban.delete({
      where: { id: id, guild_id: interaction.guildId }
    });

    const result = await Reban._logDeletion({
      config: reban.guild,
      guild: interaction.guild,
      executor: interaction.member,
      reban,
      reason
    });

    return interaction.editReply({
      content: `Re-ban with ID **#${id}** for ${userMentionWithId(reban.target_id)} has been deleted.\n${
        result ? 'Successfully logged the deletion.' : 'Failed to log the deletion.'
      }`
    });
  }

  static async wipe(interaction: ChatInputCommandInteraction<'cached'>) {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);

    let config = await prisma.guild.findUnique({
      where: { id: interaction.guildId }
    });

    if (!config) {
      config = await prisma.guild.create({
        data: { id: interaction.guildId }
      });
    }

    await interaction.deferReply({
      ephemeral: false
    });

    const { count } = await prisma.reban.deleteMany({
      where: {
        guild_id: interaction.guildId,
        target_id: target.id
      }
    });

    if (count === 0) {
      return interaction.editReply({
        content: `No re-bans to be wiped for ${userMentionWithId(target.id)}.`
      });
    }

    const result = await Reban._logMassDeletion({
      config,
      guild: interaction.guild,
      executor: interaction.user,
      target,
      reason,
      count
    });

    return interaction.editReply({
      content: `Wiped **${count}** re-bans for ${userMentionWithId(target.id)}.\n${
        result ? 'Successfully logged the deletion.' : 'Failed to log the deletion.'
      }`
    });
  }

  static _getEmbedFields(rebans: RebanType[]): EmbedField[] {
    const fields: EmbedField[] = [];

    rebans.forEach(reban => {
      fields.push({
        name: `Reban #${reban.id}`,
        value: `Issued on ${time(Number(reban.created_at / 1000n))} (${time(Number(reban.created_at / 1000n), 'R')})`,
        inline: false
      });
    });

    return fields;
  }

  static async _logDeletion(data: {
    config: DatabaseGuild;
    guild: Guild;
    executor: GuildMember;
    reban: RebanType;
    reason: string;
  }): Promise<boolean> {
    const { config, guild, executor, reban, reason } = data;

    if (!config.logging_toggled || !config.logging_channel_id) return false;

    const channel = await guild.channels.fetch(config.logging_channel_id).catch(() => null);
    if (!channel || !channel.isTextBased()) return false;

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Re-ban #${reban.id} deleted`, iconURL: executor.displayAvatarURL() })
      .setColor(Colors.Blue)
      .setFields([
        {
          name: 'Deleted By',
          value: userMentionWithId(executor.id)
        },
        {
          name: 'Deleteion Reason',
          value: reason
        },
        {
          name: 'Re-ban Executor',
          value: userMentionWithId(reban.executor_id)
        },
        {
          name: 'Re-ban Target',
          value: userMentionWithId(reban.target_id)
        }
      ])
      .setTimestamp();

    return channel
      .send({ embeds: [embed] })
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
  }

  static async _logMassDeletion(data: {
    config: DatabaseGuild;
    guild: Guild;
    executor: User;
    target: User;
    reason: string;
    count: number;
  }): Promise<boolean> {
    const { config, guild, executor, target, reason, count } = data;

    if (!config.logging_toggled || !config.logging_channel_id) return false;

    const channel = await guild.channels.fetch(config.logging_channel_id).catch(() => null);
    if (!channel || !channel.isTextBased()) return false;

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${count} re-bans deleted`, iconURL: executor.displayAvatarURL() })
      .setColor(Colors.Blue)
      .setFields([
        {
          name: 'Executor',
          value: userMentionWithId(executor.id)
        },
        {
          name: 'Target',
          value: userMentionWithId(target.id)
        },
        {
          name: 'Reason',
          value: reason
        }
      ])
      .setTimestamp();

    return channel
      .send({ embeds: [embed] })
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
  }
}

enum Subcommand {
  Search = 'search',
  View = 'view',
  Delete = 'delete',
  Wipe = 'wipe'
}

const REBANS_PER_PAGE = 5;
