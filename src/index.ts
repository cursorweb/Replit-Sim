/*
Invite link: https://discord.com/api/oauth2/authorize?client_id=781939317450342470&permissions=265280&scope=bot
*/

require("dotenv").config();

import * as Discord from "discord.js";
import DBL from "dblapi.js";
import * as g from "./global";
import admin from "./util/admin.json";

import { parse } from "./cmd-parser";
import { help, load, verifyHuman } from "./loader";

import admins from "./util/admin.json";

const client = new Discord.Client();
// todo: DBL
let commands: { [i: string]: { cmds: g.Command[], desc: string } }, gcmdarr: g.Command[];

// the limit is x before we have people confirm they are not self-botting.
// the array is: `commands used,bot input,bot answer`
let commandsUsed: { [i: string]: [number, string, number] } = {};


client.on("ready", async () => {
  client.user!.setPresence({ activity: { name: "&help for help!", type: "PLAYING" }, status: "idle" });
  console.log(`Logged in as ${client.user!.tag}!`);

  await (process.env.NODE_ENV ? g.Database.updateBackup() : g.Database.update());
  console.log("Loaded database.");

  commands = await load();
  gcmdarr = Object.keys(commands).reduce((prev: g.Command[], kurr): g.Command[] => prev.concat(commands[kurr].cmds), []);

  console.log(`Loaded ${gcmdarr.length} commands.`);
});

client.on("message", (msg: Discord.Message) => {
  let cmd = parse("&", msg.content);
  if (msg.author.id == client.user!.id || msg.author.bot || !msg.guild || !cmd) return;

  if (cmd.command == "help") help(msg, cmd.args, commands);
  else if (cmd.command == "verify") { if (commandsUsed[msg.author.id] && verifyHuman(msg, cmd.args, commandsUsed)) delete commandsUsed[msg.author.id]; }
  else {
    let found = false;

    for (const cmdclss of gcmdarr) {
      if (cmdclss.names.includes(cmd.command)) {
        if (commandsUsed[msg.author.id] && commandsUsed[msg.author.id][0] >= 100) {
          msg.channel.send({
            embed: {
              color: g.Colors.WARNING,
              title: "Anti-Bot Verification",
              description: `Type the number for ${g.brackets(commandsUsed[msg.author.id][1])}\n
For example, if you get **1**, type in ${g.codestr("&verify 1")}`,
              footer: {
                text: "You cannot continue until you complete this challenge!"
              }
            }
          });

          found = true;
          break;
        }

        if (cmdclss.cooldown && cmdclss.getCooldown(msg.author) != null) {
          cmdclss.cooldownError(msg, cmdclss.getCooldown(msg.author)!);
        } else

          if (cmdclss.isAdmin) {
            if (admins.includes(msg.author.id)) cmdclss.wrap(msg, cmd.args, client);
            else {
              g.Bot.errormsg(msg, "haha you don't have the perms!", "Permissions needed!");
            }
          } else cmdclss.wrap(msg, cmd.args, client);

        found = true;
        if (!commandsUsed[msg.author.id]) {
          let numbers = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
          let choice = g.randomChoice(numbers)[0];
          let answer = numbers.indexOf(choice);
          commandsUsed[msg.author.id] = [1, choice, answer];
        }
        else commandsUsed[msg.author.id][0]++;
        break;
      }
    }

    if (!found) g.Bot.errormsg(msg, `Command ${g.brackets(cmd.command)} not found!\n
> Use \`&help\` if you don't know how to use this bot!`, "Unknown Command!");
  }
});


setInterval(async () => {
  if (process.env.NODE_ENV) {
    await g.Database.saveBackup();
    await g.Database.updateBackup();
  } else {
    await g.Database.save();
    await g.Database.update();
  }
}, 6e5); // 10 min


client.login(process.env.TOKEN);

process.on("unhandledRejection", (reason, promise) => {
  console.log("[REJECTION ERROR]", reason);
});

process.on("uncaughtException", async (err: Error, origin: string) => {
  console.log(`[EXCEPTION] (${err.name}) ${err.message}\n${err.stack || ""}\n\n${origin}`);
  for (const id of admin) {
    let user = client.users.cache.get(id);
    await user?.send({
      embed: {
        color: g.Colors.PRIMARY,
        title: "Error!",
        description: `Error is type ${g.brackets("UNHANDLED EXCEPTION")}`,
        fields: [{
          name: "Error",
          value: g.codestr(`${err.message}`, "js")
        }]
      }
    });
  }

  // prevent undefined behavior
  process.exit(1);
});