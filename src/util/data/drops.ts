import * as Discord from "discord.js";
import { BigNumber as Big } from "bignumber.js";
import { brackets, pluralb, commanum, hidden, Database } from "../../global";
import { items } from "./item";

const code: DropItem[] = [{
  chance: () => Math.random() < 0.1,
  award: user => {
    let text = new Big(user.text);
    let tpc = new Big(user.tpc);
    let boost = Math.random() * 2;
    let amount = tpc.times(boost).dp(0);
    text = text.plus(amount);
    user.text = text.toString();
    return { name: "Code Burst!", value: `You get an extra burst of energy!
+${brackets(commanum(amount.toString()))} line${pluralb(amount)} of code! (+${Math.floor(boost * 100)}%)` };
  }
}, {
  chance: () => Math.random() < 0.05,
  award: user => {
    let cycles = new Big(user.cycles);
    cycles = cycles.plus(5);
    return { name: "Question Answerer!", value: `You answered somebody's question!
You earned ${brackets('5')} cycles!` };
  }
}, {
  chance: () => Math.random() < 0.2,
  award: user => {
    let itemsGot: { [i: string]: number } = {};

    for (let j = 0; j < 5; j++) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (Math.random() * 100 < item.dropChance) {
          itemsGot[i] = (itemsGot[i] || 0) + 1;
          user.inv[i] = new Big(user.inv[i] || 0).plus(1).toString();
        }
      }
    }

    let itemText = Object.keys(itemsGot).map(i => `${hidden(`${items[Number(i)].name}`)}${itemsGot[i] > 1 ? ` x**${commanum(itemsGot[i].toString())}**` : ""}`);

    return { name: "Mystery Chest!", value: `You accidentally make a ${brackets("chest")}!
You open it up and find...
${itemText.length == 0 ? hidden("nothing :(") : itemText.join("\n")}` };
  }
}];

// ----

const post: DropItem[] = [{
  chance: () => Math.random() < 0.05,
  award: user => {
    let text = new Big(user.text);
    let tpc = new Big(user.tpc);
    let boost = Math.floor(Math.random() * 1);
    let amount = tpc.times(boost).dp(0);
    text = text.plus(amount);
    user.text = text.toString();
    return { name: "User Suggestions", value: `People give you suggestions, and you write ${brackets(commanum(amount.toString()))} line${pluralb(amount)} of code!` };
  }
}];

export interface DropItem {
  chance: () => boolean;
  award: (_: Database.CycleUser) => Discord.EmbedFieldData
};

export { code, post };