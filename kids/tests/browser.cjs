const assert = require("node:assert/strict"),
  fs = require("fs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:4173/kids/";
let p;
const checks = [],
  errors = [];
async function check(name, fn) {
  try {
    await fn();
    checks.push({ name, passed: true });
    console.log("PASS", name);
  } catch (err) {
    checks.push({ name, passed: false, error: err.message });
    throw err;
  }
}
async function advance(s) {
  await p.evaluate(async (s) => {
    __poolo.engine.t += s;
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r)),
    );
  }, s);
}
async function start(w) {
  await p.evaluate((w) => __poolo.start(w), w);
  await p.waitForTimeout(80);
}
async function click(id) {
  await p.locator("#" + id).click({ timeout: 8000 });
  await p.waitForTimeout(60);
}
async function target(id) {
  const point = await p.evaluate((id) => {
    const e = __poolo.engine,
      t = e.targets.find((t) => t.id === id);
    if (!t) throw Error("Missing target: " + id);
    return e.project(t.object, t.object.userData.hitY || 0);
  }, id);
  await p.mouse.click(point.x, point.y);
  await p.waitForTimeout(100);
}
async function cake({
  items = ["flour", "egg", "milk", "berry"],
  heat = 1,
  mix = 3,
  guest = "rabbit",
} = {}) {
  await start("bakery");
  for (const k of items) {
    if (!(await p.locator("#add-" + k).count())) await click("pantryPage");
    await click("add-" + k);
  }
  await click("toMix");
  for (let i = 0; i < mix; i++) {
    await click("stir");
    await advance(0.8);
  }
  await click("toHeat");
  await click("heat" + heat);
  await advance(3);
  await p.evaluate((k) => {
    while (__poolo.active.guestKind !== k) __poolo.active.cycleGuest();
  }, guest);
}
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    headless: true,
    args: [
      "--no-sandbox",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  const c = await b.newContext({
    viewport: { width: 1133, height: 744 },
    hasTouch: true,
  });
  p = await c.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  try {
    await p.goto(base);
    await p.waitForFunction(() => !!window.__poolo);
    await p.evaluate(() => {
      __poolo.engine.renderer.setPixelRatio(0.65);
      document.querySelector(".sound").click();
    });
    await check("Four homepage cards open their 3D worlds", async () => {
      for (const w of ["bakery", "garden", "workshop", "ocean"]) {
        await p.evaluate(() => __poolo.home());
        await p.locator('[data-world="' + w + '"]').click();
        assert.equal(await p.evaluate(() => __poolo.world), w);
      }
    });
    await check(
      "Ingredient size and picture recipe guide remain correct",
      async () => {
        await start("bakery");
        await click("add-flour");
        await advance(0.8);
        assert.ok(
          await p.evaluate(() => __poolo.active.fill.children[0].scale.x < 0.3),
        );
        assert.equal(
          await p.evaluate(() => __poolo.active.guide().id),
          "add-egg",
        );
      },
    );
    await check("Cake succeeds and rabbit eats the actual pieces", async () => {
      await cake();
      assert.equal(
        await p.evaluate(() => __poolo.active.result.quality),
        "good",
      );
      await click("serve");
      await advance(1);
      await advance(1);
      assert.ok(
        await p.evaluate(
          () =>
            __poolo.active.edible.children.filter((x) => x.visible).length < 3,
        ),
      );
      await advance(3);
      await advance(1.2);
      assert.equal(await p.evaluate(() => __poolo.active.food.visible), false);
      assert.equal(await p.locator("#modal").isVisible(), true);
      await click("modalClose");
    });
    await check(
      "Burnt, raw, missing-ingredient and unmixed results differ physically",
      async () => {
        await cake({ heat: 2 });
        assert.equal(
          await p.evaluate(() => __poolo.active.result.quality),
          "burnt",
        );
        assert.equal(
          await p.evaluate(() =>
            __poolo.active.edible.children[0].children[0].material.color.getHexString(),
          ),
          "665849",
        );
        await cake({ heat: 0 });
        assert.equal(
          await p.evaluate(() => __poolo.active.result.quality),
          "raw",
        );
        await cake({ items: ["egg", "milk"] });
        assert.equal(
          await p.evaluate(() => __poolo.active.result.quality),
          "flat",
        );
        await cake({ mix: 0 });
        assert.equal(
          await p.evaluate(() => __poolo.active.result.quality),
          "lumpy",
        );
      },
    );
    await check(
      "Cat rejects sweet recipe and leaves food visible",
      async () => {
        await cake({ guest: "cat" });
        await click("serve");
        assert.equal(
          await p.evaluate(() => __poolo.active.result.likes),
          false,
        );
        await advance(1);
        await advance(3);
        await advance(1.2);
        assert.equal(await p.evaluate(() => __poolo.active.food.visible), true);
        await click("modalClose");
      },
    );
    await check(
      "Leaving cancels all delayed completion and reward callbacks",
      async () => {
        await cake();
        const before = await p.evaluate(() => __poolo.saved.stickers.length);
        await click("serve");
        await click("homeBtn");
        await advance(10);
        assert.equal(await p.evaluate(() => __poolo.world), "");
        assert.equal(
          await p.evaluate(() => __poolo.saved.stickers.length),
          before,
        );
        assert.equal(await p.locator("#modal").isVisible(), false);
      },
    );
    await check(
      "Garden grows three species, recovers overwatering, removes bug and pollinates",
      async () => {
        await start("garden");
        for (const [i, k] of ["berry", "carrot", "flower"].entries()) {
          await click("seed-" + k);
          await target("plot" + i);
          await click("water");
          await target("plot" + i);
          await target("plot" + i);
          if (!i) {
            await target("plot0");
            assert.equal(
              await p.evaluate(() => __poolo.active.plots[0].water),
              3,
            );
            await click("sun");
            await target("plot0");
            assert.equal(
              await p.evaluate(() => __poolo.active.plots[0].water),
              2,
            );
          }
          if (k === "carrot") {
            await click("brush");
            await target("plot1");
          }
          await click("sun");
          await target("plot" + i);
          await advance(1.2);
          if (k === "flower") {
            await click("bee");
            await target("plot2");
            await advance(1.6);
          }
          await click("harvest");
          await target("plot" + i);
          await advance(1.1);
        }
        assert.equal(await p.evaluate(() => __poolo.active.count), 3);
        await advance(1.2);
        assert.equal(await p.locator("#modal").isVisible(), true);
        await click("modalClose");
      },
    );
    await check(
      "Hill failure changes to success after fitting larger wheels",
      async () => {
        await start("workshop");
        await click("route-hill");
        await click("drive");
        await advance(4.5);
        assert.equal(await p.evaluate(() => __poolo.active.phase), "repair");
        await click("repair");
        await click("part-1");
        await click("drive");
        await advance(4.5);
        assert.equal(await p.evaluate(() => __poolo.active.result.pass), true);
        await advance(1.2);
        await click("modalClose");
      },
    );
    await check(
      "Water failure changes to success after fitting a boat hull",
      async () => {
        await start("workshop");
        await click("route-water");
        await click("drive");
        await advance(4.5);
        assert.equal(await p.evaluate(() => __poolo.active.result.pass), false);
        await click("repair");
        await click("part-1");
        await click("drive");
        await advance(4.5);
        assert.equal(await p.evaluate(() => __poolo.active.result.pass), true);
        await advance(1.2);
        await click("modalClose");
      },
    );
    await check(
      "Ocean completes trash, feeding, brushing, reverse coral repair, memory and high-five",
      async () => {
        await start("ocean");
        await click("choose-fish");
        await click("net");
        while (
          await p.evaluate(() => __poolo.active.states.fish.trash.length < 2)
        ) {
          const id = await p.evaluate(
            () =>
              __poolo.engine.targets.find((t) => t.id.startsWith("ocean-trash"))
                .id,
          );
          await target(id);
        }
        await click("feed");
        await click("feed");
        await advance(1.7);
        await click("collectShell");
        await click("choose-turtle");
        await click("oceanBrush");
        while (
          await p.evaluate(
            () => __poolo.active.states.turtle.cleaned.length < 3,
          )
        ) {
          const id = await p.evaluate(
            () =>
              __poolo.engine.targets.find((t) => t.id.startsWith("ocean-dirt"))
                .id,
          );
          await target(id);
        }
        await click("coral1");
        await target("ocean-slot1");
        await advance(0.9);
        await click("coral0");
        await target("ocean-slot0");
        await advance(0.9);
        await advance(1.7);
        assert.equal(
          await p.evaluate(() => __poolo.active.habitat.children.length),
          2,
        );
        await click("collectShell");
        await click("choose-seal");
        await click("demo");
        await advance(3);
        await target("ocean-note1");
        await advance(3);
        for (const i of [0, 2, 1]) await target("ocean-note" + i);
        await click("highfive");
        await advance(1.4);
        await advance(1.7);
        await click("collectShell");
        await advance(1.2);
        assert.equal(
          await p.evaluate(() =>
            Object.values(__poolo.active.states).every((s) => s.shell),
          ),
          true,
        );
        assert.equal(await p.locator("#modal").isVisible(), true);
        await click("modalClose");
      },
    );
    await check(
      "Four iPad sizes keep tools on screen and at least 64px including 3D targets",
      async () => {
        for (const v of [
          { width: 1133, height: 744 },
          { width: 1024, height: 768 },
          { width: 744, height: 1133 },
          { width: 768, height: 1024 },
        ]) {
          await p.setViewportSize(v);
          for (const w of ["bakery", "garden", "workshop", "ocean"]) {
            await start(w);
            const bounds = await p.evaluate(() =>
              Array.from(
                document.querySelectorAll(
                  "#dock button,#secondary button,.game-header button",
                ),
              )
                .filter((b) => !b.disabled)
                .map((b) => {
                  const r = b.getBoundingClientRect();
                  return {
                    id: b.id,
                    x: r.x,
                    y: r.y,
                    w: r.width,
                    h: r.height,
                    right: r.right,
                    bottom: r.bottom,
                  };
                }),
            );
            for (const r of bounds)
              assert.ok(
                r.w >= 64 &&
                  r.h >= 64 &&
                  r.x >= 0 &&
                  r.y >= 0 &&
                  r.right <= v.width &&
                  r.bottom <= v.height,
                JSON.stringify({ v, w, r }),
              );
            await p.evaluate(() => __poolo.engine.syncTargets());
            assert.ok(
              await p.evaluate(() =>
                __poolo.engine.targets.every(
                  (t) =>
                    (t.proxy.scale.x * 2 * innerHeight) /
                      (__poolo.engine.camera.top -
                        __poolo.engine.camera.bottom) >=
                    63.99,
                ),
              ),
            );
          }
        }
      },
    );
    await check(
      "Sound and album survive refresh; parent gate requires holding",
      async () => {
        await p.evaluate(() => __poolo.home());
        const before = await p.evaluate(() => __poolo.saved.stickers.length);
        await p.reload();
        await p.waitForFunction(() => !!window.__poolo);
        assert.equal(
          await p.evaluate(() => __poolo.saved.stickers.length),
          before,
        );
        assert.equal(await p.evaluate(() => __poolo.saved.sound), false);
        await click("parentBtn");
        assert.equal(await p.locator("#modal").isVisible(), false);
        await p.locator("#parentBtn").dispatchEvent("pointerdown");
        await p.waitForTimeout(2100);
        await p.locator("#parentBtn").dispatchEvent("pointerup");
        assert.equal(await p.locator("#modalTitle").innerText(), "家长小角落");
        await click("modalClose");
      },
    );
    await check("Same-origin cached game reopens offline", async () => {
      await p.evaluate(() => navigator.serviceWorker.ready);
      await p.waitForTimeout(500);
      await c.setOffline(true);
      await p.reload();
      await p.waitForFunction(() => !!window.__poolo);
      await start("bakery");
      assert.equal(await p.evaluate(() => __poolo.world), "bakery");
      await c.setOffline(false);
    });
    await check("No unhandled browser runtime errors", async () =>
      assert.deepEqual(errors, []),
    );
  } catch (err) {
    console.error(err.stack);
  } finally {
    fs.writeFileSync(
      process.env.QA_REPORT || "acceptance-results.json",
      JSON.stringify(
        { date: new Date().toISOString(), checks, errors },
        null,
        2,
      ),
    );
    await b.close();
    if (checks.some((x) => !x.passed) || checks.length < 14)
      process.exitCode = 1;
  }
})();
