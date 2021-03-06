import * as Discord from "discord.js";
import { BigNumber as Big } from "bignumber.js";
import { Command, Colors, Database, Bot, brackets, random, pluralb, commanum, parseNumber } from "../../global";
import { post as drops } from "../../util/data/drops";

class C extends Command {
  names = ["post", "p"];
  help = "Post lines of code for some cycles!";
  examples = ["post 10"];
  isGame = 'y' as 'y';

  get cooldown() { return 10000; }

  exec(msg: Discord.Message, args: string[], _: Discord.Client) {
    if (args.length > 1) Bot.argserror(msg, args.length, [0, 1]);
    else {
      let user = Database.getUser(msg.author.id);
      let text = new Big(user.text), cpp = new Big(user.cpp), cycles = new Big(user.cycles);
      let amt = new Big(parseNumber(args[0]) || user.text);

      if (amt.lte(0)) return Bot.usererr(msg, `You cannot post less than ${brackets('0')} lines of code!`);
      if (text.lt(amt)) return Bot.usererr(msg, `You don't have enough code!
You need ${brackets(amt.minus(text).toString())} more code.`);

      // refer to desmos.
      let upvotes = amt.div(5).times(Math.abs(random(-7, 7)) + 1).abs().plus(cpp).dp(0);

      let isServer = msg.guild!.id == "788421241005408268"; // refer to ./code.ts
      if (isServer) upvotes = upvotes.times(1.05).dp(0);

      let fields: Discord.EmbedFieldData[] = [];
      for (const drop of drops) {
        if (drop.chance()) {
          fields.push(drop.award(user));
          cycles = new Big(user.cycles), text = new Big(user.text); // have to update it again
        }
      }

      cycles = cycles.plus(upvotes);

      msg.channel.send({
        embed: {
          color: Colors.SUCCESS,
          title: "Post your Code!",
          description: `You posted ${brackets(commanum(amt.toString()))} line${pluralb(amt)} of code.
People view your post!
+ ${brackets(commanum(upvotes.toString()))} cycle${pluralb(new Big(upvotes))}!

> You now have ${brackets(commanum(cycles.toString()))} cycles!${isServer ? `
**5% cycle boost** for posting in the official discord server!` : ""}`,
          footer: {
            text: "Use &bal to view your balance!"
          }
        }
      });

      text = text.minus(amt);

      Database.pdb[msg.author.id].cycles = cycles.toString();
      Database.pdb[msg.author.id].text = text.toString();
    }
  }

  cooldownError(msg: Discord.Message, ms: number) {
    Bot.errormsg(msg, `Don't spam people!
Please wait ${brackets((ms / 1000).toFixed(1))} seconds before you can post again.`, "No Spamming!");
  }
}

export const c = new C();