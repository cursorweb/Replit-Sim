import * as Discord from "discord.js";
import { Command, Colors, brackets, plural, formatDate } from "../../global";

class C extends Command {
  names = ["lore", "background-info"];
  help = "Explains the lore of the bot";
  isGame = 'n' as 'n';
}

export const c = new C();
