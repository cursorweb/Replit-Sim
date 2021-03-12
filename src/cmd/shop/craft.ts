import * as Discord from "discord.js";
import { BigNumber as Big } from "bignumber.js";
import { Command, Colors, Bot, Database, brackets, parseNumber, commanum } from "../../global";
import { items } from "../../util/data/item";
import { craftItems } from "../../util/data/craft";

class C extends Command {
  names = ["craft", "create"];
  help = "Create an item... from other items!";
  examples = ["create 'chest chest chest' 5"];

  isAdmin = true;

  exec(msg: Discord.Message, args: string[]) {
    if (args.length > 3) return Bot.argserror(msg, args.length, [0, 1, 2]);
    let num = parseNumber(args[0] || "0");
    if (args.length == 0 || num) {
      let fields = craftItems.map(p => {
        let uses = p.requires.map(n => `${items[n.type].name} x${brackets(n.amt.toString())}`);
        return {
          make: items[p.creates].name + "\n".repeat(uses.length - 1),
          uses: uses.join("\n"),
        }
      });
      Bot.carousel(msg, fields, 3, (page, i) => {
        return {
          color: Colors.PRIMARY,
          title: "Crafting Items",
          description: `These are all the available crafting items! Page ${brackets(page.toString())}`,
          fields: i.length == 0 ? [{
            name: "Empty Page",
            value: "No items here!"
          }] : [{
            name: "Item",
            value: i.map(n => n.make).join("\n\n"),
            inline: true
          }, {
            name: "Ingredients",
            value: i.map(n => n.uses).join("\n\n"),
            inline: true
          }],
          footer: { text: "Tip: Use &craft <item> to craft <item>!" }
        }
      }, num || 1);
    } else {
      let itmInput = args[0];
      let amt = parseNumber(args[1] || "1");
      if (isNaN(amt)) return Bot.usererr(msg, "The amount must be a number!");

      // find item
      let item = craftItems.find(o => items[o.creates].name.toLowerCase() == itmInput.toLowerCase());
      if (!item) item = craftItems.find(o => items[o.creates].name.toLowerCase().indexOf(itmInput.toLowerCase()) > -1);
      if (!item) return Bot.usererr(msg, `Item ${brackets(itmInput)} not found.
      Check your spelling!`, "Item not found!");

      // alias
      let itemMeta = items[item.creates];

      // check availability
      const user = Database.getUser(msg.author.id);
      for (const itm of item.requires) {
        let num = new Big(itm.amt).times(amt);
        let userAmt = new Big(user.inv[itm.type] || 0);
        if (userAmt.lt(num)) return Bot.errormsg(msg, `You don't have enough of ${brackets(items[itm.type].name)}!
**You still need** ${brackets(commanum(num.minus(userAmt).toString()))} **more!**`);
        user.inv[itm.type] = userAmt.minus(num).toString();
      }

      let outAmt = new Big(user.inv[item.creates] || 0);
      outAmt = outAmt.plus(amt);
      user.inv[item.creates] = outAmt.toString();

      msg.channel.send({
        embed: {
          color: Colors.SUCCESS,
          title: "Success!",
          description: item.message,
          fields: [{
            name: "Result",
            value: `+ ${brackets(commanum(amt.toString()))} ${itemMeta.name}!`
          }]
        }
      });
    }
  }
}

export const c = new C();