const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const ROLL_VALUE = 27;
const WASH_TIME = 48 * 60 * 60 * 1000;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName("moneywash")
    .setDescription("Start a money wash")
    .addIntegerOption(option =>
      option
        .setName("rolls")
        .setDescription("How many rolls?")
        .setRequired(true)
    )
].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log("Slash command registered.");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "moneywash") {
    const rolls = interaction.options.getInteger("rolls");
    const expected = rolls * ROLL_VALUE;

    const collectionDate = new Date(Date.now() + WASH_TIME);

    const formattedTime = collectionDate
      .toLocaleString("en-GB", {
        timeZone: "Europe/London",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      })
      .replace(",", "");

    await interaction.reply({
      content:
        `💸 Money Wash Started\n` +
        `User: ${interaction.user}\n` +
        `Rolls: ${rolls}\n` +
        `Expected: £${expected.toLocaleString()}\n` +
        `Collection Time: ${formattedTime}\n` +
        `Status: Washing...`
    });

    setTimeout(async () => {
      await interaction.channel.send(
        `${interaction.user} your money wash is ready for collection! 💸`
      );
    }, WASH_TIME);
  }
});

client.login(TOKEN);