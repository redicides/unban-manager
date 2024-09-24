import ConfigManager from '@/managers/config/ConfigManager';
import Command, { CommandCategory } from '@managers/commands/Command';
import {
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel
} from 'discord.js';
import { prisma } from '..';
import { Guild } from '@prisma/client';

export default class Settings extends Command<ChatInputCommandInteraction<'cached'>> {
  constructor() {
    super({
      category: CommandCategory.Management,
      usage: [],
      data: {
        name: 'settings',
        description: 'Manage the bot settings.',
        defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
        options: [
          {
            name: SubcommandGroup.Unbans,
            description: 'Configure the unban settings.',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
              {
                name: Subcommand.AddManagerRole,
                description: 'Add a role to the unban manager role list.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                  {
                    name: 'role',
                    description: 'The role to add to the unban manager role list.',
                    type: ApplicationCommandOptionType.Role,
                    required: true
                  }
                ]
              },
              {
                name: Subcommand.RemoveManagerRole,
                description: 'Remove a role from the unban manager role list.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                  {
                    name: 'role',
                    description: 'The role to remove from the unban manager role list.',
                    type: ApplicationCommandOptionType.Role,
                    required: true
                  }
                ]
              },
              {
                name: Subcommand.ListManagerRoles,
                description: 'List the current unban manager role list.',
                type: ApplicationCommandOptionType.Subcommand
              }
            ]
          },
          {
            name: 'logging',
            description: 'Configure the logging settings.',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
              {
                name: Subcommand.SetChannel,
                description: 'Set the channel to log to.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                  {
                    name: 'channel',
                    description: 'The channel to log to.',
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                    channel_types: [ChannelType.GuildText]
                  }
                ]
              },
              {
                name: Subcommand.Toggle,
                description: 'Toggle logging.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                  {
                    name: 'value',
                    description: 'The value to set the logging to.',
                    type: ApplicationCommandOptionType.Boolean,
                    required: true
                  }
                ]
              }
            ]
          }
        ]
      }
    });
  }

  async execute(interaction: ChatInputCommandInteraction<'cached'>) {
    const group = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    let config = await prisma.guild.findUnique({
      where: { id: interaction.guildId }
    });

    if (!config) {
      config = await prisma.guild.create({
        data: { id: interaction.guildId }
      });
    }

    await interaction.deferReply({ ephemeral: false });

    switch (group) {
      case SubcommandGroup.Unbans:
        if (!ConfigManager.global_config.owners.includes(interaction.user.id)) {
          throw 'You cannot add, remove, or list unban manager roles as you are not recognized as an owner.';
        }

        switch (subcommand) {
          case Subcommand.AddManagerRole:
            return Settings._addManagerRole(config, interaction);
          case Subcommand.RemoveManagerRole:
            return Settings._removeManagerRole(config, interaction);
          case Subcommand.ListManagerRoles:
            return Settings._listManagerRoles(config, interaction);
        }
        break;

      case SubcommandGroup.Logging:
        switch (subcommand) {
          case Subcommand.SetChannel:
            return Settings._setChannel(config, interaction);
          case Subcommand.Toggle:
            return Settings._toggle(config, interaction);
        }
    }
  }

  static async _addManagerRole(config: Guild, interaction: ChatInputCommandInteraction<'cached'>) {
    const role = interaction.options.getRole('role', true);
    let roles = JSON.parse(config.manager_roles) as string[];

    if (roles.includes(role.id)) {
      throw 'That role is already recognized as a manager role.';
    }

    roles = [...roles, role.id];
    const updated = JSON.stringify(roles);

    await prisma.guild.update({
      where: { id: interaction.guildId },
      data: { manager_roles: updated }
    });

    return interaction.editReply(`Successfully added "${role.toString()}" to the unban manager role list.`);
  }

  static async _removeManagerRole(config: Guild, interaction: ChatInputCommandInteraction<'cached'>) {
    const role = interaction.options.getRole('role', true);
    let roles = JSON.parse(config.manager_roles) as string[];

    if (!roles.includes(role.id)) {
      throw 'That role is not recognized as a manager role.';
    }

    roles = roles.filter(r => r !== role.id);
    const updated = JSON.stringify(roles);

    await prisma.guild.update({
      where: { id: interaction.guildId },
      data: { manager_roles: updated }
    });

    return interaction.editReply(`Successfully removed "${role.toString()}" from the unban manager role list.`);
  }

  static async _listManagerRoles(config: Guild, interaction: ChatInputCommandInteraction<'cached'>) {
    const roles = JSON.parse(config.manager_roles) as string[];

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Unban Manager Roles', iconURL: interaction.guild?.iconURL() ?? undefined })
      .setColor(Colors.NotQuiteBlack)
      .setDescription(
        roles.length > 0
          ? `Below are the roles that are recognized as unban manager roles.\n\n${roles
              .map(r => `• <@&${r}>`)
              .join('\n')}`
          : 'There are no unban manager roles for this guild.'
      )
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }

  static async _setChannel(config: Guild, interaction: ChatInputCommandInteraction<'cached'>) {
    const channel = interaction.options.getChannel('channel', true);

    if (!channel.isTextBased()) {
      throw 'That channel is not a text based channel.';
    }

    if (config.logging_channel_id === channel.id) {
      throw 'That channel is already set as the logging channel.';
    }

    if (
      !channel
        .permissionsFor(interaction.guild.members.me!)
        .has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])
    ) {
      throw 'I cannot set that channel as the logging channel because I do not have the required permissions to view it, or send messages and embed links.';
    }

    await prisma.guild.update({
      where: { id: interaction.guildId },
      data: { logging_channel_id: channel.id }
    });

    return interaction.editReply(`Successfully set the logging channel to ${channel.toString()}.`);
  }

  static async _toggle(config: Guild, interaction: ChatInputCommandInteraction<'cached'>) {
    const value = interaction.options.getBoolean('value', true);

    if (config.logging_toggled === value) {
      throw value ? 'Logging is already enabled.' : 'Logging is already disabled.';
    }

    await prisma.guild.update({
      where: { id: interaction.guildId },
      data: { logging_toggled: value }
    });

    return interaction.editReply(`Successfully ${value ? 'enabled' : 'disabled'} logging.`);
  }
}

enum SubcommandGroup {
  Unbans = 'unbans',
  Logging = 'logging'
}

enum Subcommand {
  AddManagerRole = 'add-manager-role',
  RemoveManagerRole = 'remove-manager-role',
  ListManagerRoles = 'list-manager-roles',
  SetChannel = 'set-channel',
  Toggle = 'toggle'
}
