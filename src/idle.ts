import { BigNumber as Big } from "bignumber.js";
import { Database } from "./global";

setInterval(() => {
  for (const id in Database.pdb) {
    let user = Database.getUser(id);
    let tpm = new Big(user.tpm);
    
    if (tpm.gt(0)) {
      let text = new Big(user.text);
      text = text.plus(tpm);
      user.text = text.toString();
    }
  }
}, 6e4); // 1 minute