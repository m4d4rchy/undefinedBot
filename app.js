var apiKey = require('./key.js');
const Discord = require('discord.js');
var giphy = require('giphy-api')(apiKey.giphyKey);
const client = new Discord.Client();
var fs = require('fs');
var search = require('youtube-search');

var opts = {
    maxResults: 1,
    key: apiKey.googleKey
};
var config = {};
var reactionRoleData = [];
var playerLevels = {};
var json = null;
var start = 0;

const events = {
    MESSAGE_REACTION_ADD: 'messageReactionAdd',
    MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
};

fs.open('config.json', 'r', (err, fd) => {
    if (err) {
        if (err.code === 'ENOENT') {
            console.error('No config file.');
            return;
        }

        throw err;
    }
    fs.readFile('config.json', 'utf8', function (err, contents) {
        config = JSON.parse(contents);
        if (config.reactionRole)
            reactionRoleData = config.reactionRole;
        if (config.playerXp)
            playerLevels = config.playerXp;
        console.log("Config file Loaded.");
    });
});

function main(client) {
    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
        client.user.setActivity('!help');
    });
    client.on('raw', async event => {
        if (!events.hasOwnProperty(event.t)) return;

        const { d: data } = event;
        const user = client.users.get(data.user_id);
        const channel = client.channels.get(data.channel_id) || await user.createDM();

        if (channel.messages.has(data.message_id)) return;

        const message = await channel.fetchMessage(data.message_id);
        const emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
        let reaction = message.reactions.get(emojiKey);

        if (!reaction) {
            const emoji = new Discord.Emoji(client.guilds.get(data.guild_id), data.emoji);
            reaction = new Discord.MessageReaction(message, emoji, 1, data.user_id === client.user.id);
        }

        client.emit(events[event.t], reaction, user);
    });
    client.on('message', msg => {
        command = msg.content.split(" ");
        if (command[0] == '!reactionrole' && msg.member.roles.find(r => r.name === "Admin"))
            reactionRole(msg, command, client);
        else if (command[0] == '!say' && msg.member.roles.find(r => r.name === "Admin")) {
            command = msg.content.split(" ", 2);
            say(msg, command, client);
        }
        else if (command[0] == '!clear' && msg.member.roles.find(r => r.name === "Admin"))
            clear(msg, command, client);
        else if (command[0] == '!youtube')
            findYoutube(msg, command, client);
        else if (command[0] == '!level')
            myLevel(msg, command, client);
        else if (command[0] == '!gif')
            findGif(msg, command, client);
        else {
            if (msg.author.bot === false) {
                if (playerLevels[msg.author.id]) {
                    var xp = Math.random() * (25 - 15) + 15;
                    playerLevels[msg.author.id][1] = playerLevels[msg.author.id][1] + xp;
                    if (playerLevels[msg.author.id][1] > playerLevels[msg.author.id][2] || playerLevels[msg.author.id][1] == playerLevels[msg.author.id][2]) {
                        var rest = playerLevels[msg.author.id][1] - playerLevels[msg.author.id][2];
                        playerLevels[msg.author.id][1] = rest;
                        playerLevels[msg.author.id][0] = playerLevels[msg.author.id][0] + 1;
                        playerLevels[msg.author.id][2] = 5 * ((playerLevels[msg.author.id][0] + 1) * (playerLevels[msg.author.id][0] + 1)) + 50 * playerLevels[msg.author.id][0] + 1 + 100;
                        msg.channel.send(`GG <@${msg.author.id}>, tu monte au niveau ${playerLevels[msg.author.id][0]}!`);
                    }
                }
                else {
                    var xp = Math.random() * (25 - 15) + 15;
                    playerLevels[msg.author.id] = [0, xp, 100];
                    console.log(msg.author.id);
                    console.log(playerLevels[msg.author.id]);
                }
                saveData();
            }
        }
    });
    client.on('messageReactionAdd', (messageReaction, user) => {
        var i = 0;
        for (var i = 0; i < reactionRoleData.length; i++) {
            var data = reactionRoleData[i];
            if (messageReaction.message.channel.id === data[0] && messageReaction.message.id === data[1]
                && messageReaction.emoji.name === data[3] && user.bot === false) {
                const member = messageReaction.message.guild.members.get(user.id);
                role = messageReaction.message.guild.roles.find(role => role.id === data[2]);
                member.addRole(role.id);
                console.log("Add Role");
                console.log(role.name);
                console.log("\n");
            }
        }
    });
    client.on('messageReactionRemove', (messageReaction, user) => {
        var i = 0;
        for (var i = 0; i < reactionRoleData.length; i++) {
            var data = reactionRoleData[i];
            if (messageReaction.message.channel.id === data[0] && messageReaction.message.id === data[1]
                && messageReaction.emoji.name === data[3] && user.bot === false) {
                const member = messageReaction.message.guild.members.get(user.id);
                role = messageReaction.message.guild.roles.find(role => role.id === data[2]);
                member.removeRole(role.id);
                console.log("Remove Role");
                console.log(role.name);
                console.log("\n");
            }
        }
    });
    client.on('guildMemberAdd', member => {
        member.guild.channels.get('614211649489993756').send(`Salut <@${member.user.id}>, bienvenue sur le serveur **{undefined}** :tada::hugging:!`);
    });
    client.on('guildMemberRemove', member => {
        member.guild.channels.get('614211649489993756').send(`**${member.user.tag}** vient de quitter le serveur :wave::slight_frown:`);
    });
}

function reactionRole(msg, command, client) {
    console.log(command);
    if (command.length < 5) {
        embedMessage(client, msg.channel.id, "\n\nError: Arguments missing!\nUsage: !reactionrole <tagChannel> <messageId> <roleName> <emoji>\n\n");
        return (-1);
    }
    if (msg.mentions.channels) {

        //* Get tagChannel
        collect = msg.mentions.channels
        let channel = collect.first();
        //* Check if tagChannel's exist
        if (channel === null) {
            embedMessage(client, msg.channel.id, "\n\nError: Channel not found!\n\n");
            return (-1);
        }

        //* Get role
        let guild = client.guilds.find(guild => guild.name === "{undefined}");
        let role = guild.roles.find(role => role.name === command[3]);
        //* Check if role's exist
        if (role === null) {
            embedMessage(client, msg.channel.id, "\n\nError: Role not found!\n\n");
            return (-1);
        }
        var emoji = command[4];
        if (command[4][0] === '<') {
            emoji = command[4].slice(0, -1);
            emoji = emoji.slice(0);
            var temp = emoji.split(":");
            emoji = temp[1];
        }
        var find = emoji;
        var emojiObj = guild.emojis.find(emoji => emoji.name === find);
        if (emojiObj === null) {
            embedMessage(client, msg.channel.id, "\n\nError: Emoji not found!\n\n");
            return (-1);
        }
        reactionRoleData.push([channel.id, command[2], role.id, emoji]);
        channel.fetchMessage(command[2]).then(message => {
            if (emojiObj)
                message.react(emojiObj);
            else
                message.react(command[4]);
        });
    }
    msg.reply("\n***\t--- Reaction Role ---***\nReaction role added.");
    saveData();
}

function say(msg, command, client) {
    console.log(command);
    console.log(command.length);
    if (command.length < 2) {
        embedMessage(client, msg.channel.id, "\n\nError: Arguments missing!\n\nUsage: !say [tagChannel] <message>\n\n");
        return (-1);
    }
    else {
        if (command.length == 1) {
            var message = msg.content.slice(4);
            embedMessage(client, msg.channel.id, message);
        }
        else {
            //* Get tagChannel
            collect = msg.mentions.channels
            let channel = collect.first();
            //* Check if tagChannel's exist
            if (channel === null) {
                var message = msg.content.slice(4);
                embedMessage(client, msg.channel.id, message);
            }
            else {
                message = msg.content.split(" ");
                message = message.splice(1, message.length);
                message = message.join(" ");
                embedMessage(client, msg.channel.id, message);
            }
        }
    }
}

function clear(msg, command, client) {
    let fetched;
    msg.channel.bulkDelete(100).then(() => {
        msg.channel.send("Deleted 100 messages.").then(msg => msg.delete(3000));
    });
    /*if (command[1])
        fetched = msg.channel.fetchMessages({ limit: command[1] });
    else
        fetched = msg.channel.fetchMessages({ limit: 10 });
    fetched.then(messages => msg.channel.bulkDelete(messages));*/
}

function embedMessage(client, channelId, message) {
    client.channels.get(channelId).send({
        embed: {
            color: 3447003,
            description: message
        }
    });
}

function findYoutube(msg, command, client) {
    var keyword = command.splice(1, command.length);
    keyword = keyword.join(" ")
    console.log(keyword);
    search(keyword, opts, function (err, results) {
        if (err) return console.log(err);
        for (var i = 0; i < results.length; i++) {
            console.log(results[i].link);
            msg.channel.send(results[i].link);
        }
    });
}

function findGif(msg, command, client) {
    var keyword = command.splice(1, command.length);
    keyword = keyword.join(" ")
    console.log(keyword);
    giphy.random(keyword, function (err, results) {
        if (err) return console.log(err);
        console.log(results.data.image_original_url);
        msg.channel.send(results.data.image_original_url);
    });
}

function myLevel(msg, command, client) {
    if (playerLevels[msg.author.id])
        msg.channel.send(`<@${msg.author.id}>: Niveau ${playerLevels[msg.author.id][0]}`);
    else {
        var xp = Math.random() * (25 - 15) + 15;
        playerLevels[msg.author.id] = [0, xp, 100];
        myLevel();
    }
}

function saveData() {
    config["reactionRole"] = reactionRoleData;
    config["playerXp"] = playerLevels;
    json = JSON.stringify(config);
    fs.writeFile('config.json', json, function (err) {
        if (err) throw err;
        console.log('File is created successfully.');
    });
}

client.login(apiKey.discordKey);
main(client);