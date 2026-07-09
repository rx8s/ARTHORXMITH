import fs from "fs";
import fetch from "node-fetch";
import yaml from "js-yaml";

const url =
  "https://raw.githubusercontent.com/rathena/rathena/master/db/pre-re/mob_db.yml";

const res = await fetch(url);
const text = await res.text();

const data = yaml.load(text);

// filter + normalize
const monsters = {};

for (const mob of data) {
  monsters[mob.Id] = {
    id: mob.Id,
    name: mob.Name,
    element: mob.Element,
    race: mob.Race,
    size: mob.Size,

    str: mob.Str ?? 10,
    agi: mob.Agi ?? 10,
    vit: mob.Vit ?? 10,
    int: mob.Int ?? 10,
    dex: mob.Dex ?? 10,
    luk: mob.Luk ?? 10,

    hp: mob.Hp,
    atk: mob.Attack
  };
}

fs.writeFileSync(
  "monsters.json",
  JSON.stringify(monsters, null, 2)
);

console.log("DONE -> monsters.json");