// Skin tones multiply the base complexion; painted facial features keep their colours.
export const SKIN_TONES = {fair:[1.035,1.045,1.075], light:[1,1,1], warm:[.975,.925,.87], tan:[.89,.80,.715],
  brown:[.735,.615,.53], deep:[.565,.445,.385]};

// Everything a walker can choose about their looks. The game, the room server and the
// profile transfer all read these lists, so a new option only has to be added here.
export const LOOK_OPTIONS = {
  hair: ["short", "crop", "parted", "curly", "bob", "long", "wavy", "ponytail", "twintails", "braids", "bun", "topknot"],
  hairColor: ["auto", "black", "dark", "brown", "chestnut", "auburn", "honey", "blonde", "ash", "plum", "pink"],
  skin: Object.keys(SKIN_TONES),
  eyes: ["round", "soft", "bright", "almond", "gentle", "sleepy", "dot", "sharp", "fierce"],
  brows: ["soft", "straight", "arched", "thick", "thin", "droopy", "raised", "short"],
  mouth: ["smile", "grin", "calm", "cat", "pout"],
  glasses: ["none", "horn", "round", "square"],
  beard: ["none", "moustache", "stubble", "goatee", "full"],
  outfit: ["coat", "puffer", "tee", "hanbok", "jacket", "hoodie", "knit", "shirt", "dress", "overalls", "varsity", "suit",
    "school", "shorts"]
};
// Looks saved before an option existed fall back to these.
export const LOOK_DEFAULTS = {hairColor: "auto", skin: "light", brows: "soft", mouth: "smile", glasses: "none", beard: "none"};
