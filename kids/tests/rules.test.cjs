const { test } = require("node:test");
const a = require("node:assert/strict");
const R = require("../rules.js");
const cake = ["flour", "egg", "milk", "berry"];
test("Food structure, heat and stirring produce distinct results", () => {
  a.equal(R.bake("cake", cake, 3, 1, "rabbit").quality, "good");
  a.equal(R.bake("cake", cake, 3, 0, "rabbit").quality, "raw");
  a.equal(R.bake("cake", cake, 3, 2, "rabbit").quality, "burnt");
  a.equal(R.bake("cake", ["egg", "milk"], 3, 1, "rabbit").quality, "flat");
  a.equal(R.bake("cake", cake, 0, 1, "rabbit").quality, "lumpy");
  a.equal(
    R.bake("pizza", ["flour", "cheese", "fish"], 3, 1, "cat").likes,
    true,
  );
  a.equal(R.bake("soup", ["carrot"], 3, 1, "rabbit").likes, true);
});
test("Characters have different preferences", () => {
  a.equal(R.bake("cake", cake, 3, 1, "rabbit").likes, true);
  a.equal(R.bake("cake", cake, 3, 1, "cat").likes, false);
  a.equal(R.bake("cake", cake, 3, 2, "rabbit").likes, false);
  a.equal(
    R.bake("pizza", ["flour", "cheese", "fish"], 3, 1, "cat").favorite,
    true,
  );
});
test("Vehicle parts change actual route outcomes", () => {
  const p = { body: 0, wheels: 0, roof: 0 };
  a.equal(R.drive(p, "grass").pass, true);
  a.equal(R.drive(p, "hill").pass, false);
  a.equal(R.drive({ ...p, wheels: 1 }, "hill").pass, true);
  a.equal(R.drive({ ...p, roof: 2 }, "hill").pass, true);
  a.equal(R.drive(p, "water").pass, false);
  a.equal(R.drive({ ...p, body: 1 }, "water").pass, true);
  a.equal(R.drive({ ...p, wheels: 2 }, "water").pass, true);
  a.equal(R.drive({ ...p, body: 1, roof: 1 }, "water").speed, 1.4);
});
test("Broken local storage falls back and albums stay bounded", () => {
  a.equal(R.readSave("{bad"), null);
  a.equal(R.readSave("null"), null);
  a.deepEqual(R.readSave('{"stickers":"oops"}').stickers, []);
  a.equal(
    R.readSave(
      JSON.stringify({
        stickers: Array.from({ length: 100 }, () => ({
          world: "bakery",
          icon: "🧁",
        })),
      }),
    ).stickers.length,
    48,
  );
  a.equal(R.readSave('{"sound":false}').sound, false);
});
