import { APIActionRowComponent, APIApplicationCommandAutocompleteInteraction, APIBaseInteraction, APIChatInputApplicationCommandInteractionData, APICommandAutocompleteInteractionResponseCallbackData, APIMessageComponentInteraction, APIMessageComponentInteractionData, APITextInputComponent, InteractionType, APIModalSubmission, APIModalSubmitInteraction } from "@discordjs/core"
import { Client } from "../Client.js"
import { CreateMessageOptions, TextChannel } from "./Channel.js"
import { Message } from "./Message.js"
import User from "./User.js"

export class BaseInteraction<Type extends InteractionType, Data> {
    readonly _client: Client
    readonly applicationID: string
    readonly channel?: TextChannel
    readonly guildID?: string
    readonly guildLocale?: string
    readonly id: string
    readonly locale: string
    readonly token: string
    readonly type: InteractionType
    readonly user: User

    readonly data?: Data
    readonly message?: Message

    acknowledged = false

    constructor(data: APIBaseInteraction<Type, Data>, _client: Client) {
        this._client = _client
        this.applicationID = data.application_id
        this.channel = data.channel ? new TextChannel(data.channel.id, _client) : undefined
        this.guildID = data.guild_id
        this.guildLocale = data.guild_locale
        this.id = data.id
        this.locale = data.locale
        this.token = data.token
        this.type = data.type
        this.user = data.user ? new User(data.user, _client) : User.fromGuildMember(data.member!, _client)!

        if(data.message) this.message = new Message(data.message, _client)
    }

    createFollowup(options: CreateMessageOptions) {
        const data = TextChannel.parseMessageOptions(options)
        if(this.acknowledged) return this._client.api.interactions.followUp(this.applicationID, this.token, data)
        else return this._client.api.interactions.reply(this.id, this.token, data)
    }

    acknowledge() {
        this.acknowledged = true
        return this._client.api.interactions.defer(this.id, this.token)
    }
}

export class MessageComponentInteraction extends BaseInteraction<InteractionType.MessageComponent, APIMessageComponentInteractionData> {
    readonly channel: TextChannel
    readonly data: APIMessageComponentInteractionData
    readonly message: Message

    constructor(data: APIMessageComponentInteraction, _client: Client) {
        super(data, _client)
        this.channel = new TextChannel(data.channel.id, _client)
        this.data = data.data
        this.message = new Message(data.message, _client)
    }

    createModal(options: { custom_id: string, title: string, components: APIActionRowComponent<APITextInputComponent>[]}) {
        return this._client.api.interactions.createModal(this.id, this.token, options)
    }
}

export type AutocompleteInteractionData = APIChatInputApplicationCommandInteractionData & Required<Pick<APIChatInputApplicationCommandInteractionData, "options">>
export class AutocompleteInteraction extends BaseInteraction<InteractionType.ApplicationCommandAutocomplete, APIChatInputApplicationCommandInteractionData> {
    readonly data: AutocompleteInteractionData

    constructor(data: APIApplicationCommandAutocompleteInteraction, _client: Client) {
        super(data, _client)
        this.data = data.data
    }

    respond(data: APICommandAutocompleteInteractionResponseCallbackData) {
        return this._client.api.interactions.createAutocompleteResponse(this.id, this.token, data)
    }
}

export class ChatCommandInteraction extends BaseInteraction<InteractionType.ApplicationCommand, APIChatInputApplicationCommandInteractionData> {}

export class ModalInteraction extends BaseInteraction<InteractionType.ModalSubmit, APIModalSubmission> {
    readonly data: APIModalSubmission

    constructor(data: APIModalSubmitInteraction, _client: Client) {
        super(data, _client)
        this.data = data.data
    }
}

export type AnyInteraction = MessageComponentInteraction | AutocompleteInteraction | ChatCommandInteraction