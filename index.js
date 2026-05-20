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
const MAX_ROLLS = 18518;
const WASH_TIME = 48 * 60 * 60 * 1000;

const activeWashes = new Map();

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
    ),

  new SlashCommandBuilder()
    .setName("cancelwash")
    .setDescription("Cancel your active money wash")
].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log("Slash commands registered.");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "moneywash") {
    const rolls = interaction.options.getInteger("rolls");

    if (rolls > MAX_ROLLS) {
      return interaction.reply({
        content: `❌ You cannot wash more than **${MAX_ROLLS.toLocaleString()} rolls** at once.`,
        ephemeral: true
      });
    }

    if (rolls <= 0) {
      return interaction.reply({
        content: `❌ Rolls must be at least **1**.`,
        ephemeral: true
      });
    }

    if (activeWashes.has(interaction.user.id)) {
      return interaction.reply({
        content: `❌ You already have an active money wash. Use **/cancelwash** first if you want to cancel it.`,
        ephemeral: true
      });
    }

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

    const timeout = setTimeout(async () => {
      if (!activeWashes.has(interaction.user.id)) return;

      await interaction.channel.send(
        `${interaction.user} your money wash is ready for collection! 💸`
      );

      activeWashes.delete(interaction.user.id);
    }, WASH_TIME);

    activeWashes.set(interaction.user.id, {
      timeout,
      rolls,
      expected
    });
  }

  if (interaction.commandName === "cancelwash") {
    const wash = activeWashes.get(interaction.user.id);

    if (!wash) {
      return interaction.reply({
        content: `❌ You do not have an active money wash to cancel.`,
        ephemeral: true
      });
    }

    clearTimeout(wash.timeout);
    activeWashes.delete(interaction.user.id);

    return interaction.reply({
      content: `✅ Your money wash has been cancelled. You will not be pinged.`,
      ephemeral: true
    });
  }
});

client.login(TOKEN);
