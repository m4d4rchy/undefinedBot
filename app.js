const Discord = require('discord.js');
const client = new Discord.Client();
var reactionRoleData = [];

function main(client) {
    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
    });
    client.on('message', msg => {
        command = msg.content.split(" ");
        if (command[0] == '!reactionrole') {
            reactionRole(msg, command, client, reactionRole);
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
}

function reactionRole(msg, command, client, reactionRole) {
    console.log(command);
    if (msg.mentions.channels) {
        collect = msg.mentions.channels
        let channel = collect.first();
        let guild = client.guilds.find(guild => guild.name === "{undefined}");
        let role = guild.roles.find(role => role.name === command[3]);
        var emoji = command[4];
        if (command[4][0] === '<') {
            emoji = command[4].slice(0, -1);
            emoji = emoji.slice(0);
            var temp = emoji.split(":");
            emoji = temp[1];
        }
        var find = emoji;
        var emojiObj = guild.emojis.find(emoji => emoji.name === find);
        console.log(emoji);
        reactionRoleData.push([channel.id, command[2], role.id, emoji]);
        channel.fetchMessage(command[2]).then(message => {
            if (emojiObj)
                message.react(emojiObj);
            else
                message.react(command[4]);
        });
    }
    msg.reply("***Reaction Role***\nReaction role added.");
}

client.login('youtoken');
main(client);