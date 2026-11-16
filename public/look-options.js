// Everything a walker can choose about their looks. The game, the room server and the
// profile transfer all read these lists, so a new option only has to be added here.
export const LOOK_OPTIONS = {
  hair: ["short", "crop", "parted", "curly", "bob", "long", "wavy", "ponytail", "twintails", "braids", "bun", "topknot"],
  hairColor: ["auto", "black", "dark", "brown", "chestnut", "auburn", "honey", "blonde", "ash", "plum", "pink"],
  skin: ["fair", "light", "warm", "tan", "brown", "deep"],
  eyes: ["round", "soft", "bright", "almond", "gentle", "sleepy", "dot", "sharp", "fierce"],
  brows: ["soft", "straight", "arched", "thick", "thin", "droopy", "raised", "short"],
  mouth: ["smile", "grin", "calm", "cat", "pout"],
  outfit: ["coat", "puffer", "tee", "hanbok", "jacket", "hoodie", "knit", "shirt", "dress", "overalls", "varsity", "suit",
    "school", "shorts"]
};
// Looks saved before an option existed fall back to these.
export const LOOK_DEFAULTS = {hairColor: "auto", skin: "light", brows: "soft", mouth: "smile"};
