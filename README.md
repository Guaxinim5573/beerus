> **Note**: I made this library for one bot alone. It only covers message and interactions. You shouldn't use this.

# beerus
A Node.js Discord library focused on having less!
Based on discord.js' [`core`](https://npmjs.com/package/@discordjs/core), this library focus on having less features but simple and performant.
This library doesn't and don't intend to cover the full Discord api. It only covers parts **I** will use.

## Installing
This library won't have backwards compatibility. Use the currently node.js LTS version.
```
echo ...
```

## Ping Pong Example
```ts
import { Client, GatewayIntentBits } from "beerus"

const client = new Client({
  token: "123",
  gateway: {
    intents: GatewayIntentBits.GuildMessages | GatewayIntentBits.MessageContent
  }
})
client.once("ready", shard => {
  console.log("Shard " + shard.id + " is ready!")
})

client.on("messageCreate", message => {
  if(message.content === "ping") {
    message.reply("Pong!")
  }
})

client.connect()
```

## License
This library uses the MIT license. See [LICENSE](https://github.com/Guaxinim5573/beerus/blob/HEAD/LICENSE) file for more details.
