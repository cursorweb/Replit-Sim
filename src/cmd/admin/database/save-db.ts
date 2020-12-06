import * as Discord from "discord.js";
import { Command, Colors, Database } from "../../../global";

class C extends Command {
  names = ["admin-git-push", "admin-save-db"];
  help = "'git push' to firebase.";
  isGame = 'n' as 'n';

  exec(msg: Discord.Message, _: string[], _1: Discord.Client) {
    Database.save().then(() => Database.update().then(() => msg.channel.send({
      embed: {
        color: Colors.SUCCESS,
        title: "Success!",
        description: "Successfully **saved** and **updated** the database."
      }
    })));
  }
}

export const c = new C();