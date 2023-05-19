import { APIActionRowComponent, APIEmbed, APIMessageActionRowComponent, RESTPostAPIChannelMessageJSONBody } from "@discordjs/core"
import { Client } from "../Client.js"
import { Message } from "./Message.js"

export type CreateAdvancedMessage = {
    allowedMentions?: {
        roles?: string[]
        users?: string[]
        repliedUser?: boolean
    }
    components?: APIActionRowComponent<APIMessageActionRowComponent>[]
    content?: string
    messageReference?: Message | string | {
        channelID?: string
        failIfNotExists?: boolean
        guildID?: string
        messageID?: string
    }
} & (
    { embed: APIEmbed; embeds?: never }
    | { embed?: never; embeds: APIEmbed[] }
    | { embed?: never; embeds?: never }
)

export type CreateMessageOptions = string | CreateAdvancedMessage

export class BaseChannel {
    readonly _client: Client
    readonly id: string

    constructor(id: string, _client: Client) {
        this._client = _client
        this.id = id
    }

    get mention() { return `<#${this.id}>` }
}

/**
 * A guild text channel
 * Thread channels, text voice channels, news channels and stage channels are excluded
 */
export class TextChannel extends BaseChannel {
    createMessage(options: CreateMessageOptions) {
        return this._client.api.channels.createMessage(this.id, TextChannel.parseMessageOptions(options))
    }

    editMessage(message: string, options: CreateMessageOptions) {
        return this._client.api.channels.editMessage(this.id, message, TextChannel.parseMessageOptions(options))
    }

    static parseMessageOptions(options: CreateMessageOptions): RESTPostAPIChannelMessageJSONBody {
        let result = undefined
        if(typeof options === "string") {
            result = { content: options }
        } else {
            const embeds = options.embed ? [options.embed] : options.embeds

            let reference
            if(typeof options.messageReference === "string") reference = { message_id: options.messageReference, fail_if_not_exists: false }
            else if(options.messageReference instanceof Message) reference = {
                message_id: options.messageReference.id,
                fail_if_not_exists: false
            }
            else if(options.messageReference?.messageID) reference = {
                message_id: options.messageReference.messageID,
                fail_if_not_exists: options.messageReference.failIfNotExists
            }

            result = {
                allowed_mentions: options.allowedMentions,
                components: options.components,
                content: options.content,
                embeds,
                message_reference: reference
            }
        }
        return result
    }
}