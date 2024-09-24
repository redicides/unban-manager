import {Client} from "discord.js";
import {CLIENT_CACHE_OPTIONS, CLIENT_INTENTS, CLIENT_PARTIALS, CLIENT_SWEEPER_OPTIONS} from "@utils/constants";


export class UnbanManagerClient extends  Client {
    constructor() {
        super({

            /**
             * Gateway intents (bits).
             *
             * The following privileged intents are required for the bot to work:
             *
             * 1. Server Members Intent - For handling guild member events
             *
             * If these intents have not been granted the client will not log in.
             * @see https://discord.com/developers/docs/topics/gateway#gateway-intents
             */

            intents: CLIENT_INTENTS,

            /**
             * The partials for the client.
             *
             * These are required from utility functions.
             */

            partials: CLIENT_PARTIALS,

            /**
             * Client cache options.
             */

            makeCache: CLIENT_CACHE_OPTIONS,

            sweepers: CLIENT_SWEEPER_OPTIONS,

            /**
             * Mentions are disabled by default.
             */

            allowedMentions: {
                parse: []
            }
        })
    }
}