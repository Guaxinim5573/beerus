import { GatewayMessageCreateDispatchData } from "@discordjs/core"
import { Client } from "../Client.js"
import { CreateMessageOptions, TextChannel } from "./Channel.js"
import User from "./User.js"

/**
 * Represents a Message
 */
export class Message {
    readonly _client: Client
    readonly id: string
    readonly channel: TextChannel
    readonly author: User
    readonly content: string
    readonly mentions: any[]
    readonly guildID: string

    constructor(data: GatewayMessageCreateDispatchData, _client: Client) {
        this._client = _client
        this.id = data.id
        this.channel = new TextChannel(data.channel_id, _client)
        this.author = new User(data.author, _client)
        this.content = data.content
        this.mentions = data.mentions
        this.guildID = data.guild_id!
    }

    /**
     * Replies to this message
     */
    reply(options: CreateMessageOptions) {
        if(typeof options === "string") return this.channel.createMessage({
            content: options,
            messageReference: {
                messageID: this.id
            }
        })
        else return this.channel.createMessage(Object.assign(options, {
            messageReference: {
                messageID: this.id
            }
        }))
    }

    delete(reason?: string) {
        return this._client.api.channels.deleteMessage(this.channel.id, this.id, { reason })
    }

    edit(options: CreateMessageOptions) {
        return this.channel.editMessage(this.id, options)
    }
}