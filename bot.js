const Discord = require("discord.js");
const client = new Discord.Client();

const db = require("quick.db");
const schedule = require("node-schedule");
const fetch = require("node-fetch");
const puppeteer = require("puppeteer");
const Canvas = require("canvas");
const ms = require("ms");

const color = "#138BFB";

const prefix = ">";

client.on("ready", () => {
    if(db.get("fact") === null){
        db.set("fact", {facts: [], toggled: true });
    }
    if(db.get("topic") === null){
        db.set("topic", {topics: [], toggled: true });
    }
    if(db.get("infractions") === null){
        db.set("infractions", {v: "."});
    }
    const g = client.guilds.cache.get("846413849351290962");
    client.user.setActivity(g.memberCount + " Members in PYL! My prefix is '>'", { type: "WATCHING" });
});

const topicSchedule = schedule.scheduleJob({hour: 0, minute: 0}, function() {
    topic();
});

async function topic(){
    const c = client.channels.cache.find(channel => channel.id === "803701147047034950");
    
    if(db.get("topic.toggled")){
        const browser = await puppeteer.launch();
        let page = await browser.newPage();
        await page.goto("https://capitalizemytitle.com/random-topic-generator/", {waitUntil: 'load'});

        const newPage = await page.evaluate(() => {
            return document.getElementById("blog-ideas-output").innerHTML; 
        });
        const embed = new Discord.MessageEmbed()
        .setTitle("**TOPIC OF THE DAY**")
        .setColor(color)
        .setDescription("Daily topic")
        .addField(`Today's topic:`, "" + newPage, false);
            
        c.send(embed);
    } else {
        const embed = new Discord.MessageEmbed()
        .setTitle("**TOPIC OF THE DAY**")
        .setColor(color)
        .setDescription("Daily topic");
        
        
        if(db.get("topic.topics").length === 0){
            const browser = await puppeteer.launch();
            let page = await browser.newPage();
            await page.goto("https://capitalizemytitle.com/random-topic-generator/", {waitUntil: 'load'});

            const newPage = await page.evaluate(() => {
                return document.getElementById("blog-ideas-output").innerHTML; 
            });
            embed.addField(`Today's topic:`, "" + newPage, false);
            c.send(embed);
            return;
        }
        
        let currentTopic = db.get("topic.topics")[0];
        embed.addField(`Today's topic:`, "" + currentTopic, false);
        db.set("topic.topics", db.get("topic.topics").filter(topic => topic !== currentTopic));
        
        c.send(embed);
    }
    
}

const factSchedule = schedule.scheduleJob({hour: 0, minute: 0}, function() {
    fact();
});

function fact(){
    const c = client.channels.cache.find(channel => channel.id === "847975014607487036");
    if(db.get("fact.toggled")){
        fetch("https://uselessfacts.jsph.pl/random.json?language=en")
        .then(res => res.json())
        .then(json => {
            let s = json.text;
            const embed = new Discord.MessageEmbed()
            .setTitle("**FACT OF THE DAY**")
            .setColor(color)
            .setDescription("Daily fact")
            .addField(`Today's fact:`, "" + s, false);
            
            c.send(embed);
        });
    } else {
        const embed = new Discord.MessageEmbed()
        .setTitle("**FACT OF THE DAY**")
        .setColor(color)
        .setDescription("Daily fact");
        
        
        if(db.get("fact.facts").length === 0){
            fetch("https://uselessfacts.jsph.pl/random.json?language=en")
            .then(res => res.json())
            .then(json => {
                let s = json.text;
                embed.addField(`Today's fact:`, "" + s, false);
                c.send(embed);
            });
            return;
        }
        
        let currentFact = db.get("fact.facts")[0];
        embed.addField(`Today's fact:`, "" + currentFact, false);
        db.set("fact.facts", db.get("fact.facts").filter(fact => fact !== currentFact));
        
        c.send(embed);
    }
}

client.on("message", message => {
    const args = message.content.split(" ").map(arg => arg.toLowerCase());
    if(args[0] === prefix + "addlangs"){
        const select_language = message.guild.channels.cache.get("806950608711712839").toString();
        const select_fluent = message.guild.channels.cache.get("807002294201483264").toString();
        channel.send("Languages can be added in " + select_language + " and " + select_fluent + ". Once you select roles, the language channels you selected will be visible to you.");
    } else if (args[0] === prefix + "topic"){
        if(!message.guild.member(message.author).hasPermission("ADMINISTRATOR")){
            return;
        }
        if(!args[1]){
            message.channel.send("You need to add an argument: [toggle, add, remove, status, list]");
            return;
        }
        if(args[1] === "toggle"){
            db.set("topic.toggled", !db.get("topic.toggled"));
            
            const embed = new Discord.MessageEmbed()
            .setTitle("Toggled Topic Automation")
            .setColor(color)
            .setDescription("You have toggled the topic automation from " + !db.get("topic.toggled") + " to " + db.get("topic.toggled"));
            
            message.channel.send(embed);
        } else if(args[1] === "add"){
            if(!args[2]){
                message.channel.send("You must specify a topic!");
                return;
            }
            let topic = "";
            for(let i = 0; i < args.length - 2; i++){
                if(i !== args.length - 3){
                    topic += args[2+i] + " ";
                }
                else {
                    topic += args[2+i];
                }
            }
            
            if(topic === ""){
                message.channel.send("Something went wrong..");
                return;
            }
            
            db.push("topic.topics", topic);
            const embed = new Discord.MessageEmbed()
            .setTitle("Added topic!")
            .setColor(color)
            .setDescription("You've added '" + topic + "' to the queue!");
            
            message.channel.send(embed);
        } else if(args[1] === "remove"){
            if(!args[2]){
                message.channel.send("You must specify which topic to remove!");
                return;
            }
            
            if(isNaN(args[2])){
                let t = "";
                for(let i = 0; i < args.length - 2; i++){
                    if(i !== args.length - 3){
                        t += args[2+i] + " ";
                    }
                    else {
                        t += args[2+i];
                    }
                }
                
                let index = db.get("topic.topics").indexOf(t);
                if(index === -1){
                    message.channel.send("This is not a valid topic!");
                    return;
                }
                let topic = db.get("topic.topics")[index];
                db.set("topic.topics", db.get("topic.topics").filter(topic => topic !== db.get("topic.topics")[index]));
                
                const embed = new Discord.MessageEmbed()
                .setTitle("Removed topic!")
                .setColor(color)
                .setDescription("You've removed '" + topic + "' from the queue!");
                
                message.channel.send(embed);
                return;
            }
            
            let index = parseInt(args[2]) -1;
            if(index < 0) {
                message.channel.send("That is not a valid index!");
                return;
            }
            if(db.get("topic.topics").length > index){
                let topic = db.get("topic.topics")[index];
                db.set("topic.topics", db.get("topic.topics").filter(topic => topic !== db.get("topic.topics")[index]));
                
                const embed = new Discord.MessageEmbed()
                .setTitle("Removed topic!")
                .setColor(color)
                .setDescription("You've removed '" + topic + "' from the queue!");
                
                message.channel.send(embed);
            } else {
                message.channel.send("This index is greater than the size of the queue list!");
                return;
            }
        } else if(args[1] === "status"){
            const embed = new Discord.MessageEmbed()
            .setTitle("Automatic Toggle")
            .setDescription("Check if the topics are set to manual (false) or automatic (true)")
            .setColor(color)
            .addField("Status", db.get("topic.toggled"), false);
            
            message.channel.send(embed);
        } else if(args[1] === "list"){
            if(db.get("topic.topics").length === 0){
                message.channel.send("There are no topics in the queue.");
                return;
            } else {
                const embed = new Discord.MessageEmbed()
                .setTitle("Topics")
                .setColor(color)
                .setDescription("All topics in the queue.");
                
                for(let i = 0; i < db.get("topic.topics").length; i++){
                    embed.addField("" + (i+1)+ ".", db.get("topic.topics")[i], false);
                }
                
                message.channel.send(embed);
            }
        } else {
            message.channel.send("This is not a viable argument: [toggle, add, remove]");
            return;
        }
    } else if (args[0] === prefix + "fact"){
        if(!message.guild.member(message.author).hasPermission("ADMINISTRATOR")){
            return;
        }
        if(!args[1]){
            message.channel.send("You need to add an argument: [toggle, add, remove, status, list]");
            return;
        }
        if(args[1] === "toggle"){
            db.set("fact.toggled", !db.get("fact.toggled"));
            
            const embed = new Discord.MessageEmbed()
            .setTitle("Toggled Fact Automation")
            .setColor(color)
            .setDescription("You have toggled the fact automation from " + !db.get("fact.toggled") + " to " + db.get("fact.toggled"));
            
            message.channel.send(embed);
        } else if(args[1] === "add"){
            if(!args[2]){
                message.channel.send("You must specify a fact!");
                return;
            }
            let fact = "";
            for(let i = 0; i < args.length - 2; i++){
                if(i !== args.length - 3){
                    fact += args[2+i] + " ";
                }
                else {
                    fact += args[2+i];
                }
            }
            
            if(fact === ""){
                message.channel.send("Something went wrong..");
                return;
            }
            
            db.push("fact.facts", fact);
            const embed = new Discord.MessageEmbed()
            .setTitle("Added fact!")
            .setColor(color)
            .setDescription("You've added '" + fact + "' to the queue!");
            
            message.channel.send(embed);
        } else if(args[1] === "remove"){
            if(!args[2]){
                message.channel.send("You must specify which fact to remove!");
                return;
            }
            
            if(isNaN(args[2])){
                let t = "";
                for(let i = 0; i < args.length - 2; i++){
                    if(i !== args.length - 3){
                        t += args[2+i] + " ";
                    }
                    else {
                        t += args[2+i];
                    }
                }
                
                let index = db.get("fact.facts").indexOf(t);
                if(index === -1){
                    message.channel.send("This is not a valid fact!");
                    return;
                }
                let fact = db.get("fact.facts")[index];
                db.set("fact.facts", db.get("fact.facts").filter(fact => fact !== db.get("fact.facts")[index]));
                
                const embed = new Discord.MessageEmbed()
                .setTitle("Removed fact!")
                .setColor(color)
                .setDescription("You've removed '" + fact + "' from the queue!");
                
                message.channel.send(embed);
                return;
            }
            
            let index = parseInt(args[2]) -1;
            if(index < 0) {
                message.channel.send("That is not a valid index!");
                return;
            }
            if(db.get("fact.facts").length > index){
                let fact = db.get("fact.facts")[index];
                db.set("fact.facts", db.get("fact.facts").filter(fact => fact !== db.get("fact.facts")[index]));
                
                const embed = new Discord.MessageEmbed()
                .setTitle("Removed fact!")
                .setColor(color)
                .setDescription("You've removed '" + fact + "' from the queue!");
                
                message.channel.send(embed);
            } else {
                message.channel.send("This index is greater than the size of the queue list!");
                return;
            }
        } else if(args[1] === "status"){
            const embed = new Discord.MessageEmbed()
            .setTitle("Automatic Toggle")
            .setDescription("Check if the topics are set to manual (false) or automatic (true)")
            .setColor(color)
            .addField("Status", db.get("fact.toggled"), false);
            
            message.channel.send(embed);
        } else if(args[1] === "list"){
            if(db.get("fact.facts").length === 0){
                message.channel.send("There are no facts in the queue.");
                return;
            } else {
                const embed = new Discord.MessageEmbed()
                .setTitle("Facts")
                .setColor(color)
                .setDescription("All facts in the queue.");
                
                for(let i = 0; i < db.get("fact.facts").length; i++){
                    embed.addField("" + (i+1)+ ".", db.get("fact.facts")[i], false);
                }
                
                message.channel.send(embed);
            }
        } else {
            message.channel.send("This is not a viable argument: [toggle, add, remove]");
            return;
        }
    } else if (args[0] === prefix + "kick"){
        kick_command(message, args);
    } else if (args[0] === prefix + "ban"){
        ban_command(message, args);
    } else if (args[0] === prefix + "mute"){
        mute_command(message, args);
    } else if (args[0] === prefix + "tempmute"){
        tempmute_command(message, args);
    } else if (args[0] === prefix + "tempban"){
        tempban_command(message, args);
    } else if (args[0] === prefix + "unmute"){
        unmute_command(message, args);
    } else if (args[0] === prefix + "unban"){
        unban_command(message, args);
    } else if(args[0] === prefix + "clear"){
        clear_command(message, args);  
    } else if(args[0] === prefix + "warn"){
        warn_command(message, args);   
    } else if(args[0] === prefix + "infractions"){
        infractions_command(message, args);   
    } else if(args[0] === prefix + "help"){
        help_command(message, args);
    }
});

function kick_command(message, args){
    if(!message.member.hasPermission("KICK_MEMBERS")) return;
    
    if(!args[1]){
        message.channel.send("You must specify a member!");
        return;
    }
    const m = message.mentions.members.first();
    if(!m){
        message.channel.send("The member you specified is not valid!");
        return;
    }
    
    let reason = "";
    
    if(!args[2]){
        reason = "Kicked from the server!";
    } else {
        let r = "";
        for(let i = 0; i < args.length - 2; i++){
            if(i !== args.length - 3){
                r += args[2+i] + " ";
            }
            else {
                r += args[2+i];
            }
        }
        reason = r;
    }
    
    const embed = new Discord.MessageEmbed()
    .setTitle("Kicked: " + m.user.username)
    .setColor(color)
    .setDescription(m.user.username + " has been kicked by " + message.author.username)
    .addField("Reason: ", reason, true);
    
    message.channel.send(embed);
    m.send(embed);
    
    m.kick(reason);
    
    message.delete({timeout: 1000 });
}

function ban_command(message, args){
    if(!message.member.hasPermission("BAN_MEMBERS")) return;
    
    if(!args[1]){
        message.channel.send("You must specify a member!");
        return;
    }
    const m = message.mentions.members.first();
    if(!m){
        message.channel.send("The member you specified is not valid!");
        return;
    }
    
    let reason = "";
    
    if(!args[2]){
        reason = "Banned from the server!";
    } else {
        let r = "";
        for(let i = 0; i < args.length - 2; i++){
            if(i !== args.length - 3){
                r += args[2+i] + " ";
            }
            else {
                r += args[2+i];
            }
        }
        reason = r;
    }
    
    const embed = new Discord.MessageEmbed()
    .setTitle("Banned: " + m.user.username)
    .setColor(color)
    .setDescription(m.user.username + " has been banned by " + message.author.username)
    .addField("Reason: ", reason, true);
    
    message.channel.send(embed);
    m.send(embed);
    
    m.ban({days:7, reason: reason}).catch(err => console.log(err));
    
    message.delete({timeout: 1000 });
}

function mute_command(message, args){
    if(!message.member.hasPermission("MUTE_MEMBERS")) return;
    
    const muteRole = message.guild.roles.cache.get("793513162686464090");
    const mentionedMember = message.mentions.members.first();
    
    if(!args[1]){
        message.channel.send("You must specify a member!");
        return;
    }
    
    let reason = "";
    if(!args[2]){
        reason = "Muted.";
    } else {
        let r = "";
        for(let i = 0; i < args.length - 2; i++){
            if(i !== args.length - 3){
                r += args[2+i] + " ";
            }
            else {
                r += args[2+i];
            }
        }
        reason = r;
    }
    
    const embed = new Discord.MessageEmbed()
    .setTitle("Muted: " + mentionedMember.user.username)
    .setColor(color)
    .setDescription(message.author.username + " muted " + mentionedMember.user.username);
    
    message.channel.send(embed);
    
    mentionedMember.roles.add(muteRole.id);
    
    message.delete({timeout: 1000 });
}

function tempmute_command(message, args){
    if(!message.member.hasPermission("MUTE_MEMBERS")) return;
    
    const muteRole = message.guild.roles.cache.get("793513162686464090");
    const mentionedMember = message.mentions.members.first();
    
    if(!args[1]){
        message.channel.send("You must specify a member!");
        return;
    }
    if(!args[2]){
        message.channel.send("You must specify an amount time!");
        return;
    }
    
    let reason = "";
    if(!args[3]){
        reason = "Muted.";
    } else {
        let r = "";
        for(let i = 0; i < args.length - 2; i++){
            if(i !== args.length - 3){
                r += args[2+i] + " ";
            }
            else {
                r += args[2+i];
            }
        }
        reason = r;
    }
    
    let time = args[2];
    
    const embed = new Discord.MessageEmbed()
    .setTitle("Temp-muted: " + mentionedMember.user.username)
    .setColor(color)
    .setDescription("Duration: " + time);
    
    message.channel.send(embed);
    
    mentionedMember.roles.add(muteRole.id);
    
    setTimeout(async function() {
        await mentionedMember.roles.remove(muteRole.id);
        await mentionedMember.send("Your mute has been lifted in " + message.guild.name);
    }, ms(time));
    
    
    message.delete({timeout: 1000 });
}

function tempban_command(message, args){
    if(!message.member.hasPermission("BAN_MEMBERS")) return;
    
    const mentionedMember = message.mentions.members.first();
    
    if(!args[1]){
        message.channel.send("You must specify a member!");
        return;
    }
    if(!args[2]){
        message.channel.send("You must specify an amount time!");
        return;
    }
    
    let reason = "";
    if(!args[3]){
        reason = "Banned.";
    } else {
        let r = "";
        for(let i = 0; i < args.length - 2; i++){
            if(i !== args.length - 3){
                r += args[2+i] + " ";
            }
            else {
                r += args[2+i];
            }
        }
        reason = r;
    }
    
    let time = args[2];
    
    const embed = new Discord.MessageEmbed()
    .setTitle("Temp-Banned: " + mentionedMember.user.username)
    .setColor(color)
    .setDescription("Duration: " + time);
    
    message.channel.send(embed);
    mentionedMember.send(embed);
    
    mentionedMember.ban({days: 7, reason: reason}).catch(err => console.log(err));
    
    setTimeout(async function() {
        await message.guild.fetchBans().then(async bans => {
            if(bans.size == 0) return message.channel.send("This guild does not have any bans!");
            let bannedUser = bans.find(b => b.user.id == mentionedMember.id);
            if(!bannedUser) return console.log("Member unbanned");
            await message.guild.members.unban(bannedUser.user, reason).catch(err => console.log(err));
        })
    }, ms(time));
    
    
    message.delete({timeout: 1000 });
}

function unmute_command(message, args){
     if(!message.member.hasPermission("MUTE_MEMBERS")) return;
    
    const muteRole = message.guild.roles.cache.get("793513162686464090");
    const mentionedMember = message.mentions.members.first();
    
    if(!args[1]){
        message.channel.send("You must specify a member!");
        return;
    }
    
    const embed = new Discord.MessageEmbed()
    .setTitle("Unmuted: " + mentionedMember.user.username)
    .setColor(color)
    .setDescription(message.author.username + " unmuted " + mentionedMember.user.username);
    
    message.channel.send(embed);
    
    mentionedMember.roles.remove(muteRole.id);
    
    message.delete({timeout: 1000 });
}

function unban_command(message, args){
    if(!message.member.hasPermission("KICK_MEMBERS")) return;
    
    if(!args[1]){
        message.channel.send("You must specify a member's ID!");
        return;
    }
    if(isNaN(args[1])){
        message.channel.send("You must specify a member's ID!");
        return;
    }
    
    message.guild.members.unban(args[1]).then(u => {
        const embed = new Discord.MessageEmbed()
        .setTitle("Unbanned: " + u.username)
        .setColor(color)
        .setDescription(u.username + " has been unbanned by " + message.author.username);

        message.channel.send(embed);
    });
    
    message.delete({timeout: 1000 });
}

function clear_command(message, args){
    if(!message.member.hasPermission("MANAGE_MESSAGES")) return;
    
    if(!args[1]){
        message.channel.send("You must specify amount of messages!");
        return;
    }
    if(isNaN(args[1])){
        message.channel.send("Please enter a valid number!");
        return;
    }
    if(parseInt(args[1]) > 100) {
        message.channel.send("You cannot delete over 100 messages!");
        return;
    }
    if(parseInt(args[1]) < 1){
        message.channel.send("You must delete at least 1 message!");
        return;
    }
    
    message.channel.messages.fetch({limit: parseInt(args[1]) + 1}).then(messages => {
       message.channel.bulkDelete(messages); 
    });
}

function warn_command(message, args){
    if(!message.member.hasPermission("KICK_MEMBERS")) return;
    
    if(!args[1]){
        message.channel.send("Please specify a member!");
        return;
    }
    let reason = "";
    if(!args[2]){
        reason = "Banned.";
    } else {
        let r = "";
        for(let i = 0; i < args.length - 2; i++){
            if(i !== args.length - 3){
                r += args[2+i] + " ";
            }
            else {
                r += args[2+i];
            }
        }
        reason = r;
    }
    
    let mentionedMember = message.mentions.members.first();
    
    if(!mentionedMember){
        message.channel.send("Please enter a valid member!");
        return;
    }
    
    if(db.get("infractions." + mentionedMember.id) === null){
        db.set("infractions." + mentionedMember.id, {history: []});
    }
    db.push("infractions." + mentionedMember.id + ".history", [message.author.username, reason]);
    
    const embed = new Discord.MessageEmbed()
    .setTitle("Warned: " + mentionedMember.user.username)
    .setColor(color)
    .setDescription(mentionedMember.user.username + " was warned by " + message.author.username)
    .addField("Reason: ", reason, false);
    
    message.channel.send(embed);
    
    message.delete({timeout: 1000});
}

function infractions_command(message, args) {
    if(!message.member.hasPermission("KICK_MEMBERS")) return;
    
    if(!args[1]){
        message.channel.send("You must specify a member!");
        return;
    }
    
    let mentionedMember = message.mentions.members.first();
    if(!mentionedMember){
        message.channel.send("Please mention a valid member!");
        return;
    }
    
    if(db.get("infractions." + mentionedMember.id) === null){
        message.channel.send("This member doesn't have any infractions!");
        return;
    }
    const embed = new Discord.MessageEmbed()
    .setTitle(mentionedMember.user.username + "'s warnings")
    .setColor(color)
    .setDescription("All of " + mentionedMember.user.username + "'s warnings");
    
    for(let i = 0; i < db.get("infractions." + mentionedMember.id + ".history").length; i++){
        let infraction = db.get("infractions." + mentionedMember.id + ".history")[i];
        embed.addField("" + (i+1) + ".", "Warned by: " + infraction[0] + "    Reason: " + infraction[1], false);
    }
    
    message.channel.send(embed);
}

function help_command(message, args){
    const embed = new Discord.MessageEmbed()
    .setTitle("Command List")
    .setColor(color)
    .setDescription("All of the commands for the PYL Utilities bot. Prefix is '>'");
    
    embed.addField(">addlangs", "Add languages!", false);
    embed.addField(">help", "See all avaliable commands!", false);
    
    const admin = new Discord.MessageEmbed()
    .setTitle("Admin Command List")
    .setColor(color)
    .setDescription("All admin commands, [] means optional, {} means mandatory");
    
    admin.addField(">kick {@member} [reason]", "Kick member with/without reason", false);
    admin.addField(">ban {@member} [reason]", "Ban member with/without reason", false);
    admin.addField(">unban {@member_id}", "Unban member", false);
    admin.addField(">mute {@member} [reason]", "Mute member", false);
    admin.addField(">unmute {@member}", "Unmute member", false);
    admin.addField(">tempmute {@member} {duration(1m)} [reason]", "Tempmute member for a certain amount of time with/without reason", false);
    admin.addField(">tempban {@member} {duration(1m)} [reason]", "Tempban member for a certain amount of time with/without reason", false);
    admin.addField(">clean {amount}", "Clear messages", false);
    admin.addField(">warn {@member}", "Warn a member", false);
    admin.addField(">infractions {@member}", "See all of the warnings a member has", false);
    admin.addField(">topic [toggle, status, add, remove, list]", "All of the topic commands", false);
    admin.addField(">fact [toggle, status, add, remove, list]", "All of the fact commands", false);

    message.member.send(embed);
    if(message.member.hasPermission("KICK_MEMBERS")){
        message.member.send(admin);
    }
}

client.on("guildMemberAdd", async member => {
    const g = client.guilds.cache.get("793202043703001098");
    client.user.setActivity(g.memberCount + " Members in PYL! My prefix is '>'", { type: "WATCHING" });
    
    const c = member.guild.channels.cache.find(channel => channel.id === "846861547312644128");
    
    let sizeX = 1280;
    let sizeY = 878;
    
    const canvas = Canvas.createCanvas(sizeX/2,sizeY/2);
    const context = canvas.getContext("2d");
    
    const background = await Canvas.loadImage("./backdrop.png");
    
    context.drawImage(background, (-640/4), (-439/4), 1280/1.3, 878/1.3);
    
    context.lineWidth = 1;
    context.strokeStyle = "#000000";
    
    context.font = context.font = `bold 69px Verdana`;
    context.fillStyle = '#ffffff';
    context.fillText("WELCOME", canvas.width/2-200, canvas.height/2+100);
    context.fillText(`${member.displayName}#${member.user.discriminator}`, canvas.width/2 - context.measureText(`${member.displayName}#${member.user.discriminator}`).width/2, canvas.height/2+200);
    context.strokeText("WELCOME", canvas.width/2-200, canvas.height/2+100);
    context.strokeText(`${member.displayName}#${member.user.discriminator}`, canvas.width/2 - context.measureText(`${member.displayName}#${member.user.discriminator}`).width/2, canvas.height/2+200);
    
    context.beginPath();
    context.arc(320, 125, 105, 0, Math.PI * 2, true);
    context.fillStyle = "#FFFFFF";
    context.strokeStyle = "#FFFFFF";
    context.fill();
    context.lineWidth = 5;
    context.stroke();
    context.closePath();
    
    context.strokeStyle = "#74037b";
    
    context.beginPath();
	context.arc(320, 125, 100, 0, Math.PI * 2, true);
	context.closePath();
	context.clip();
    
    const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ format: "jpg"}));
    context.drawImage(avatar, sizeX/4-100, sizeY/4-200, 200, 200);
    
    context.closePath();
    
    const attachment = new Discord.MessageAttachment(canvas.toBuffer(), "welcome-image.png");
    
    let num = member.guild.members.cache.filter(member => !member.user.bot).size;
    let memberNumber = ordinal_suffix(num);
    
    var what_to_do = member.guild.channels.cache.get("813173309004316713").toString();
    var rules = member.guild.channels.cache.get("793202044500049959").toString();
    var help = member.guild.channels.cache.get("812700884256686110").toString();
    
    c.send("Hey, " + idToMention(member.user.id) + " and thanks for visiting Practice Your Language! 👋 We hope you enjoy your time here. 😄 Have a look at " + what_to_do + " to learn how to begin using this server. Even though they can be boring, don't forget to have a look at the " + rules + ". 😉 If you need help or ever need to quickly get in touch with the staff, you can open a ticket in " + help +".\n\nMost importantly, have fun in the server and enjoy your time here!\n\nYou are the " + memberNumber + " member of this server.", attachment);
});

client.on("guildMemberRemove", member => {
    const g = client.guilds.cache.get("793202043703001098");
    client.user.setActivity(g.memberCount + " Members in PYL! My prefix is '>'", { type: "WATCHING" });
});
    
function idToMention(id){
    return "<@" + id + ">";
}

function ordinal_suffix(i){
    var j = i % 10, k = i % 100;
    if(j == 1 && k != 11){
        return i + "st";
    }
    if(j == 2 && k != 12){
        return i + "nd";
    }
    if(j == 3 && k != 13){
        return i + "rd";
    }
    return i + "th";
}

const applyText = (canvas, text) => {
    const context = canvas.getContext("2d");
    
    let fontSize = 79;
    
    do {
        context.font = `bold ${fontSize -= 10}px Verdana`;
    } while (context.measureText(text).width > canvas.width - 300);
    
    return context.font;
}

client.login(process.env.TOKEN);