import { API, GatewayDispatchEvents, RESTPutAPIApplicationCommandsJSONBody, Client as CoreClient, InteractionType, ApplicationCommandType, APIChatInputApplicationCommandInteractionData } from "@discordjs/core"
import { REST } from "@discordjs/rest"
import { OptionalWebSocketManagerOptions, RequiredWebSocketManagerOptions, WebSocketManager } from "@discordjs/ws"
import EventEmitter from "events"
import { BaseInteraction, ChatCommandInteraction, MessageComponentInteraction } from "./structures/Interactions.js"
import { Message } from "./structures/Message.js"
import User from "./structures/User.js"

interface ClientOptions {
    token: string
    gateway: Omit<Partial<OptionalWebSocketManagerOptions> & RequiredWebSocketManagerOptions, "token" | "rest">
}

type AnyInteraction = ChatCommandInteraction | MessageComponentInteraction

export interface Client {
    on(event: "ready", listener: (shard: number) => void): this
    on(event: "messageCreate", listener: (message: Message) => void): this
    on(event: "interactionCreate", listener: (interaction: AnyInteraction) => void): this
}

export class Client extends EventEmitter {
    readonly rest: REST
    readonly gateway: WebSocketManager
    readonly api: API
    readonly coreClient: CoreClient

    applicationID: string = ""
    /**
     * The user representing this client
     * Will be null if the client hasn't yet connected
     */
    user: User = null!

    constructor(options: ClientOptions) {
        super()
        this.rest = new REST({ version: "10" }).setToken(options.token)
        this.gateway = new WebSocketManager(Object.assign(options.gateway, { token: options.token, rest: this.rest }))
        this.api = new API(this.rest)
        this.coreClient = new CoreClient({ rest: this.rest, gateway: this.gateway })

        this.coreClient.on(GatewayDispatchEvents.Ready, (event) => {
            this.user = new User(event.data.user, this)
            this.applicationID = event.data.application.id
            this.emit("ready", event.shardId)
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