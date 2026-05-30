const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");

const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
});

// Track warnings per user
const warnings = {};

// ── Welcome new members ──────────────────────────────────────────────────────
client.on("guildMemberAdd", async (member) => {
  if (!config.welcome.enabled) return;
  const channel = member.guild.channels.cache.get(config.welcome.channelId);
  if (!channel) return;
  const embed = new EmbedBuilder()
    .setColor(config.welcome.embedColor || "#6366f1")
    .setTitle(config.welcome.title.replace("{server}", member.guild.name))
    .setDescription(
      config.welcome.message
        .replace("{user}", `<@${member.id}>`)
        .replace("{server}", member.guild.name)
        .replace("{count}", member.guild.memberCount)
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setTimestamp();
  await channel.send({ embeds: [embed] });
});

// ── Reaction roles ────────────────────────────────────────────────────────────
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;
  if (!config.reactionRoles.enabled) return;
  const msgId = config.reactionRoles.messageId;
  if (reaction.message.id !== msgId) return;
  const roleId = config.reactionRoles.map[reaction.emoji.name];
  if (!roleId) return;
  const member = await reaction.message.guild.members.fetch(user.id);
  await member.roles.add(roleId).catch(console.error);
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;
  if (!config.reactionRoles.enabled) return;
  if (reaction.message.id !== config.reactionRoles.messageId) return;
  const roleId = config.reactionRoles.map[reaction.emoji.name];
  if (!roleId) return;
  const member = await reaction.message.guild.members.fetch(user.id);
  await member.roles.remove(roleId).catch(console.error);
});

// ── Commands ──────────────────────────────────────────────────────────────────
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const prefix = config.prefix || "!";

  // Auto-responses
  for (const [trigger, response] of Object.entries(config.autoResponses || {})) {
    if (message.content.toLowerCase().includes(trigger.toLowerCase())) {
      await message.reply(response);
      return;
    }
  }

  if (!message.content.startsWith(prefix)) return;
  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();

  // !poll "Question" "Option1" "Option2" ...
  if (cmd === "poll") {
    const parts = message.content.match(/"([^"]+)"/g);
    if (!parts || parts.length < 3) {
      return message.reply(`Usage: ${prefix}poll "Question" "Option1" "Option2" ...`);
    }
    const question = parts[0].replace(/"/g, "");
    const options = parts.slice(1).map((p) => p.replace(/"/g, ""));
    const emojis = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];
    const embed = new EmbedBuilder()
      .setColor("#6366f1")
      .setTitle(`📊 ${question}`)
      .setDescription(options.map((o, i) => `${emojis[i]} ${o}`).join("\n"))
      .setFooter({ text: `Poll by ${message.author.tag}` })
      .setTimestamp();
    const poll = await message.channel.send({ embeds: [embed] });
    for (let i = 0; i < options.length; i++) {
      await poll.react(emojis[i]);
    }
    await message.delete().catch(() => {});
    return;
  }

  // !info — server stats
  if (cmd === "info") {
    const g = message.guild;
    const embed = new EmbedBuilder()
      .setColor("#6366f1")
      .setTitle(`📊 ${g.name}`)
      .setThumbnail(g.iconURL())
      .addFields(
        { name: "Members", value: `${g.memberCount}`, inline: true },
        { name: "Created", value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "Owner", value: `<@${g.ownerId}>`, inline: true },
        { name: "Channels", value: `${g.channels.cache.size}`, inline: true },
        { name: "Roles", value: `${g.roles.cache.size}`, inline: true },
      )
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  }

  // Admin-only commands
  const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

  // !warn @user reason
  if (cmd === "warn") {
    if (!isAdmin) return message.reply("❌ Admins only.");
    const target = message.mentions.users.first();
    if (!target) return message.reply(`Usage: ${prefix}warn @user reason`);
    const reason = args.slice(1).join(" ") || "No reason provided";
    if (!warnings[target.id]) warnings[target.id] = [];
    warnings[target.id].push({ reason, by: message.author.tag, at: new Date().toISOString() });
    const count = warnings[target.id].length;
    const embed = new EmbedBuilder()
      .setColor("#f59e0b")
      .setTitle(`⚠️ Warning Issued`)
      .addFields(
        { name: "User", value: `<@${target.id}>`, inline: true },
        { name: "Warns", value: `${count}`, inline: true },
        { name: "Reason", value: reason },
      )
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // !kick @user reason
  if (cmd === "kick") {
    if (!isAdmin) return message.reply("❌ Admins only.");
    const target = message.mentions.members.first();
    if (!target) return message.reply(`Usage: ${prefix}kick @user reason`);
    const reason = args.slice(1).join(" ") || "No reason provided";
    await target.kick(reason).catch(() => message.reply("❌ Could not kick user."));
    const embed = new EmbedBuilder()
      .setColor("#ef4444")
      .setTitle("👢 Member Kicked")
      .addFields(
        { name: "User", value: target.user.tag, inline: true },
        { name: "By", value: message.author.tag, inline: true },
        { name: "Reason", value: reason },
      )
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // !help
  if (cmd === "help") {
    const embed = new EmbedBuilder()
      .setColor("#6366f1")
      .setTitle("📖 Bot Commands")
      .addFields(
        { name: `${prefix}poll "Q" "A" "B"`, value: "Create a reaction poll" },
        { name: `${prefix}info`, value: "Show server stats" },
        { name: `${prefix}warn @user reason`, value: "Warn a member (admin)" },
        { name: `${prefix}kick @user reason`, value: "Kick a member (admin)" },
        { name: `${prefix}help`, value: "Show this message" },
      )
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  }
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(config.token);
