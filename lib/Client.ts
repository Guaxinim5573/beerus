import { API, GatewayDispatchEvents, RESTPutAPIApplicationCommandsJSONBody, Client as CoreClient, InteractionType, ApplicationCommandType, APIChatInputApplicationCommandInteractionData } from "@discordjs/core"
import { REST, RESTOptions } from "@discordjs/rest"
import { OptionalWebSocketManagerOptions, RequiredWebSocketManagerOptions, WebSocketManager, WebSocketShardEvents } from "@discordjs/ws"
import EventEmitter from "events"
import { BaseInteraction, ChatCommandInteraction, MessageComponentInteraction } from "./structures/Interactions.js"
import { Message } from "./structures/Message.js"
import User from "./structures/User.js"

interface ClientOptions {
    token: string
    rest: Partial<RESTOptions>
    gateway: Omit<Partial<OptionalWebSocketManagerOptions> & RequiredWebSocketManagerOptions, "token" | "rest">
}

type AnyInteraction = ChatCommandInteraction | MessageComponentInteraction

export interface Client {
    on(event: "ready", listener: (shard: Shard) => void): this
    on(event: "messageCreate", listener: (message: Message) => void): this
    on(event: "interactionCreate", listener: (interaction: AnyInteraction) => void): this
}

/**
 * Partial info about a shard
 */
export class Shard {
    _client: Client
    id: number
    lastHeartbeatCompleted: number | null = null
    latency: number = -1

    constructor(id: number, _client: Client) {
        this._client = _client
        this.id = id
    }
}

export class Client extends EventEmitter {
    readonly rest: REST
    readonly gateway: WebSocketManager
    readonly api: API
    readonly coreClient: CoreClient

    shards: Map<number, Shard> = new Map()

    applicationID: string = ""
    /**
     * The user representing this client
     * Will be null if the client hasn't yet connected
     */
    user: User = null!

    constructor(options: ClientOptions) {
        super()
        this.rest = new REST(Object.assign({ version: "10" }, options.rest)).setToken(options.token)
        this.gateway = new WebSocketManager(Object.assign(options.gateway, { token: options.token, rest: this.rest }))
        this.api = new API(this.rest)
        this.coreClient = new CoreClient({ rest: this.rest, gateway: this.gateway })

        this.gateway.on(WebSocketShardEvents.HeartbeatComplete, (data) => {
            const shard = this.shards.get(data.shardId)
            if(!shard) return
            shard.lastHeartbeatCompleted = Date.now()
            shard.latency = data.latency
        })

        this.coreClient.on(GatewayDispatchEvents.Ready, (event) => {
            this.user = new User(event.data.user, this)
            this.applicationID = event.data.application.id
            const shard = new Shard(event.shardId, this)
            this.emit("ready", shard)
        })
        this.coreClient.on(GatewayDispatchEvents.MessageCreate, (event) => {
            const message = new Message(event.data, this)
            this.emit("messageCreate", message)
        })
        this.coreClient.on(GatewayDispatchEvents.InteractionCreate, (event) => {
            if(event.data.type === InteractionType.ApplicationCommand) {
                if(event.data.data.type === ApplicationCommandType.ChatInput) {
                    console.log(JSON.stringify(event.data, null, "  "))
                    // TODO:
                    // @ts-expect-error
                    this.emit("interactionCreate", new BaseInteraction(event.data, this) as ChatCommandInteraction)
                }
            } else if(event.data.type === InteractionType.ApplicationCommandAutocomplete) {
            } else if(event.data.type === InteractionType.MessageComponent) {
                this.emit("interactionCreate", new MessageComponentInteraction(event.data, this))
            }
        })
    }

    bulkEditCommands(commands: RESTPutAPIApplicationCommandsJSONBody) {
        return this.api.applicationCommands.bulkOverwriteGlobalCommands(this.applicationID, commands)
    }

    connect() { return this.gateway.connect() }
}