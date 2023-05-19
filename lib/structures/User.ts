import { APIGuildMember, APIInteractionGuildMember, APIUser } from "@discordjs/core"
import { Client } from "../Client.js"

export default class User {
    readonly _client: Client
    readonly avatar: string | null
    readonly id: string
    readonly username: string
    readonly discriminator: string

    constructor(data: APIUser, _client: Client) {
        this._client = _client
        this.avatar = data.avatar
        this.id = data.id
        this.username = data.username
        this.discriminator = data.discriminator
    }

    getAvatarURL() {
        if(this.avatar) {
            const ext = this.avatar.startsWith("a_") ? "gif" : "webp"
            return `https://cdn.discordapp.com/avatars/${this.id}/${this.avatar}.${ext}`
        } else {
            return `https://cdn.discordapp.com/embed/avatars/${(Number(this.discriminator) % 5) || 0}.webp`
        }
    }

    get mention() { return `<@${this.id}>` }

    static fromGuildMember(data: APIInteractionGuildMember | APIGuildMember, _client: Client) {
        if(data.user) return new User(data.user, _client)
        else return null
    }
}