(function () {
  "use strict";
  const $ = (id) => document.getElementById(id),
    R = KidsRules,
    T = THREE,
    W = {
      bakery: {
        icon: "🧁",
        name: "烘焙厨房",
        bg: "#f3e8dc",
        steps: ["🥣", "🥄", "♨️", "🍽️"],
      },
      garden: {
        icon: "🌷",
        name: "四季花园",
        bg: "#e9efdc",
        steps: ["🌱", "💧", "☀️", "🧺"],
      },
      workshop: {
        icon: "🚙",
        name: "奇想车间",
        bg: "#f2ebd6",
        steps: ["🧩", "🛞", "🗺️", "🏁"],
      },
      ocean: {
        icon: "🐢",
        name: "蔚蓝海湾",
        bg: "#dfedf0",
        steps: ["🐠", "🐢", "🦭", "🐚"],
      },
    };
  let saved = {
    stickers: [],
    sound: true,
    reduced: matchMedia("(prefers-reduced-motion:reduce)").matches,
  };
  try {
    saved = R.readSave(localStorage.getItem("poolo-world-v1")) || saved;
  } catch {}
  let e,
    world = "",
    active = null,
    mascot,
    guideTarget,
    lastAction = 0,
    ctx,
    toastTimer;
  function persist() {
    try {
      localStorage.setItem("poolo-world-v1", JSON.stringify(saved));
    } catch {}
    $("albumCount").textContent = saved.stickers.length;
    document.querySelectorAll(".sound").forEach((b) => {
      b.textContent = saved.sound ? "🔊" : "🔇";
      b.setAttribute("aria-label", saved.sound ? "关闭声音" : "开启声音");
    });
    document.body.classList.toggle("reduced", saved.reduced);
    if (e) e.reduced = saved.reduced;
  }
  function sound(kind = "tap") {
    if (!saved.sound || document.hidden) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      const tones = {
        tap: [480, 640],
        water: [650, 890, 730],
        mix: [230, 310, 250],
        oven: [180, 230, 300],
        bell: [880, 1100],
        yay: [523, 659, 784, 1046],
        eat: [280, 360, 300],
        hmm: [380, 320],
        car: [170, 220, 270],
        wave: [400, 520, 680],
        note0: [523],
        note1: [659],
        note2: [784],
      };
      (tones[kind] || tones.tap).forEach((f, i) => {
        const o = ctx.createOscillator(),
          g = ctx.createGain(),
          t = ctx.currentTime + i * 0.105;
        o.type = ["car", "hmm"].includes(kind) ? "triangle" : "sine";
        o.frequency.setValueAtTime(f, t);
        o.frequency.exponentialRampToValueAtTime(f * 1.08, t + 0.13);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.045, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(t);
        o.stop(t + 0.2);
      });
      if (kind === "eat") {
        const b = ctx.createBuffer(1, ctx.sampleRate * 0.09, ctx.sampleRate),
          d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++)
          d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
        const src = ctx.createBufferSource(),
          g = ctx.createGain(),
          filter = ctx.createBiquadFilter();
        src.buffer = b;
        filter.type = "lowpass";
        filter.frequency.value = 800;
        g.gain.value = 0.035;
        src.connect(filter);
        filter.connect(g);
        g.connect(ctx.destination);
        src.start();
      }
    } catch {}
  }
  function say(text) {
    if (!saved.sound || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN";
      u.rate = 0.85;
      u.volume = 0.65;
      speechSynthesis.speak(u);
    } catch {}
  }
  function touch() {
    lastAction = e?.t || 0;
    guideTarget = null;
    $("guide").classList.remove("show");
  }
  function toast(icons, text = "") {
    clearTimeout(toastTimer);
    $("toast").textContent = icons;
    $("toast").classList.add("show");
    $("sr").textContent = text;
    toastTimer = setTimeout(() => $("toast").classList.remove("show"), 1500);
  }
  function caption(text, hint = "点一点，看看会发生什么") {
    $("caption").textContent = text;
    $("hint").textContent = hint;
  }
  function task(icons) {
    $("task").textContent = icons;
  }
  function step(index) {
    $("steps").replaceChildren();
    W[world].steps.forEach((icon, i) => {
      if (i) {
        const dot = document.createElement("i");
        dot.textContent = "·";
        $("steps").append(dot);
      }
      const s = document.createElement("span");
      s.textContent = icon;
      s.className = i === index ? "active" : i < index ? "done" : "";
      $("steps").append(s);
    });
  }
  function tool(o) {
    const b = document.createElement("button");
    b.id = o.id || "";
    b.className =
      "tool" + (o.selected ? " selected" : "") + (o.primary ? " primary" : "");
    b.setAttribute("aria-label", o.label || o.icon);
    b.disabled = !!o.disabled;
    const icon = document.createElement("span");
    icon.className = "emoji";
    icon.textContent = o.icon;
    b.append(icon);
    if (o.label) {
      const text = document.createElement("span");
      text.className = "text";
      text.textContent = o.label;
      b.append(text);
    }
    b.onclick = () => {
      touch();
      sound();
      o.action?.();
    };
    return b;
  }
  function dock(items, secondary = []) {
    $("dock").replaceChildren(...items.map(tool));
    $("secondary").replaceChildren(...secondary.map(tool));
    e.after(0.4, () => {
      if (!guideTarget) autoGuide();
    });
  }
  function autoGuide() {
    if (!active) return;
    guideTarget = active.guide?.() || null;
    if (guideTarget) lastAction = e.t - 7;
  }
  function modal(art, title, body, actions) {
    guideTarget = null;
    $("guide").classList.remove("show");
    $("modalArt").textContent = art;
    $("modalTitle").textContent = title;
    $("modalBody").replaceChildren();
    if (typeof body === "string") {
      const p = document.createElement("p");
      p.textContent = body;
      $("modalBody").append(p);
    } else if (body) $("modalBody").append(body);
    $("modalActions").replaceChildren(
      ...actions.map((a) => {
        const b = document.createElement("button");
        b.textContent = a.icon;
        b.setAttribute("aria-label", a.label);
        b.className = a.primary ? "primary" : "";
        b.onclick = () => {
          closeModal();
          sound();
          a.action?.();
        };
        return b;
      }),
    );
    $("modal").hidden = false;
    $("modalClose").focus();
  }
  function closeModal() {
    $("modal").hidden = true;
    touch();
  }
  function reward(icon, description, extra) {
    if (active.awarded) return;
    active.awarded = true;
    saved.stickers.push({
      world,
      icon,
      description,
      date: new Date().toLocaleDateString("zh-CN"),
    });
    saved.stickers = saved.stickers.slice(-48);
    persist();
    sound("yay");
    e.mood(mascot, "happy", 3);
    e.burst(mascot);
    const key = world;
    e.after(1, () =>
      modal(icon, "又有一个新发现！", "这份小小的创造，已经放进作品册。", [
        {
          icon: "↻",
          label: "再玩一次",
          primary: true,
          action: () => start(key),
        },
        {
          icon: extra ? "🔧" : "⌂",
          label: extra ? "继续改装" : "回到首页",
          action: extra || home,
        },
      ]),
    );
  }
  function album() {
    const g = document.createElement("div");
    g.className = "album-grid";
    for (const s of saved.stickers.slice().reverse()) {
      const el = document.createElement("div");
      el.className = "sticker";
      el.textContent = s.icon;
      const sm = document.createElement("small");
      sm.textContent = W[s.world].name;
      el.append(sm);
      g.append(el);
    }
    modal(
      "📒",
      "我的小小发现",
      saved.stickers.length ? g : "去一个小世界玩一会儿，就会有新发现！",
      [{ icon: "✓", label: "返回游戏", primary: true }],
    );
  }
  function toggleSound() {
    saved.sound = !saved.sound;
    if (!saved.sound) {
      window.speechSynthesis?.cancel();
      ctx?.suspend();
    } else sound("bell");
    persist();
  }
  function parent() {
    const p = document.createElement("div");
    p.className = "parent-options";
    const intro = document.createElement("p");
    intro.textContent =
      "所有世界开放，无广告、无账号，作品只保存在本设备。建议亲子陪伴，留意休息。iPad 添加到主屏幕后，可使用独立窗口游玩。";
    p.append(intro);
    for (const [text, fn] of [
      [
        saved.sound ? "声音：已开启" : "声音：已关闭",
        () => {
          toggleSound();
          parent();
        },
      ],
      [
        saved.reduced ? "轻柔动画：已开启" : "轻柔动画：已关闭",
        () => {
          saved.reduced = !saved.reduced;
          persist();
          parent();
        },
      ],
      [
        "清空本机作品册",
        () =>
          modal("📒", "清空作品册？", "这会清空本浏览器中的收藏，无法撤销。", [
            { icon: "↩", label: "保留作品", primary: true, action: parent },
            {
              icon: "🗑️",
              label: "确认清空",
              action: () => {
                saved.stickers = [];
                persist();
                parent();
              },
            },
          ]),
      ],
    ]) {
      const b = document.createElement("button");
      b.textContent = text;
      b.onclick = fn;
      p.append(b);
    }
    const a = document.createElement("a");
    a.href = "./design.html";
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "完整玩法与家长说明 ↗";
    p.append(a);
    modal("☁", "家长小角落", p, [
      { icon: "✓", label: "返回游戏", primary: true },
    ]);
  }
  function start(key) {
    if (!W[key]) return;
    window.speechSynthesis?.cancel();
    closeModal();
    world = key;
    $("home").hidden = true;
    $("game").hidden = false;
    $("worldIcon").textContent = W[key].icon;
    $("worldName").textContent = W[key].name;
    e.clear(W[key].bg, "game");
    e.update = update;
    active = new games[key]();
    active.init();
    lastAction = e.t;
    e.after(0.8, () => {
      autoGuide();
      say(active.intro);
    });
    try {
      if (
        !document.fullscreenElement &&
        document.documentElement.requestFullscreen
      )
        document.documentElement.requestFullscreen().catch(() => {});
    } catch {}
  }
  function home() {
    world = "";
    active = null;
    window.speechSynthesis?.cancel();
    closeModal();
    $("game").hidden = true;
    $("home").hidden = false;
    e.clear("#f7f5eb", "home");
    e.update = update;
    const p = innerWidth < innerHeight,
      g = e.group(e.root, p ? 1.1 : 3.1, p ? 0.2 : 0.1, 0);
    e.cyl(g, 0, -0.23, 0, 2.7, 0.45, "#d9dfbf");
    e.cyl(g, 0, -0.46, 0, 2.5, 0.15, "#bdcbaa");
    mascot = e.mascot(g, 0, 0.2, 1.35);
    e.mood(mascot, "wave", 3);
    e.tree(g, -1.6, -1, 0.8);
    e.tree(g, 1.6, -1.2, 0.6);
    e.flower(g, -1.7, 0.02, 1, "#eab09a", 0.8);
    e.flower(g, 1.5, 0.02, 0.9, "#e0bd65", 0.8);
    e.cloud(g, 1.7, 3.4, -1, 0.55);
    e.cloud(g, -1.9, 2.7, -2, 0.45);
    for (const [key, x, z, c] of [
      ["bakery", -2.15, 1.35, "#e9c3b2"],
      ["garden", 0.7, -1.7, "#a8bf8b"],
      ["workshop", 2.2, 0.7, "#dfbd77"],
      ["ocean", -1.6, -1.6, "#99c6cf"],
    ]) {
      const island = e.group(g, x, 0.05, z);
      e.cyl(island, 0, 0, 0, 0.55, 0.15, c);
      if (key === "bakery") {
        e.cyl(island, 0, 0.25, 0, 0.32, 0.36, "#eed3aa");
        e.ball(island, 0, 0.48, 0, 0.36, 0.2, 0.33, "#f4d4c4");
        e.ball(island, 0, 0.66, 0, 0.1, 0.12, 0.1, "#dc8584");
      }
      if (key === "garden") e.flower(island, 0, 0.08, 0, "#dca38c", 0.8);
      if (key === "ocean") e.turtle(island, 0, 0.2, 0, 0.5);
      if (key === "workshop") {
        e.box(island, 0, 0.3, 0, 0.6, 0.28, 0.38, "#e8bc6d");
        for (const x of [-0.2, 0.2])
          for (const z of [-0.2, 0.2])
            e.ball(island, x, 0.14, z, 0.11, 0.11, 0.11, "#607b6e");
      }
      e.target(island, "portal-" + key, () => start(key), 0.6);
    }
    e.onResize = () => {
      const p = innerWidth < innerHeight;
      g.position.x = p ? 1.1 : 3.1;
      g.position.y = p ? 0.2 : 0.1;
    };
    e.resize();
    persist();
  }
  function update(dt, t) {
    active?.update?.(dt, t);
    if (!world || !$("modal").hidden) return;
    if (t - lastAction > 7 && !guideTarget) guideTarget = active?.guide?.();
    if (!guideTarget) {
      $("guide").classList.remove("show");
      return;
    }
    let p;
    if (guideTarget instanceof HTMLElement) {
      if (!guideTarget.isConnected) {
        guideTarget = null;
        return;
      }
      const r = guideTarget.getBoundingClientRect();
      p = { x: r.left + r.width / 2, y: r.top + r.height * 0.35 };
    } else
      p = e.project(
        guideTarget,
        guideTarget.userData.guideY ?? guideTarget.userData.hitY ?? 0,
      );
    $("guide").style.left = p.x + "px";
    $("guide").style.top = p.y + "px";
    $("guide").classList.toggle("show", t - lastAction > 5);
  }
  const games = {};
  games.bakery = class {
    init() {
      Object.assign(this, {
        intro: "选一种食材，放进大碗里吧。",
        stage: 0,
        base: "cake",
        items: [],
        mixed: 0,
        heat: 1,
        guestKind: "rabbit",
        toppings: [],
        page: 0,
        busy: false,
        awarded: false,
      });
      e.ground("#e9dbbf", 6.2);
      for (const x of [-4, 4]) {
        e.box(e.root, x, 1.2, -2.8, 1.7, 2.5, 1, "#c4bea4");
        e.box(e.root, x, 2.52, -2.8, 1.85, 0.12, 1.1, "#f7ead4");
        for (let i = 0; i < 3; i++) {
          e.cyl(
            e.root,
            x - 0.55 + i * 0.55,
            2.8,
            -2.8,
            0.18,
            0.4,
            ["#dfac94", "#a9c3ad", "#dbbe7f"][i],
          );
          e.cyl(e.root, x - 0.55 + i * 0.55, 3.03, -2.8, 0.19, 0.08, "#fff1d6");
        }
      }
      e.box(e.root, 0, 0.58, 0.15, 4.5, 1.05, 2.2, "#d1ab83");
      e.box(e.root, 0, 1.15, 0.15, 4.7, 0.18, 2.35, "#f4e6cb");
      const oven = e.group(e.root, 0, 1, -2.65);
      e.box(oven, 0, 0, 0, 2.2, 1.8, 1, "#81a995");
      e.box(oven, 0, -0.05, 0.53, 1.65, 1.1, 0.08, "#536e60");
      this.glow = e.box(oven, 0, -0.05, 0.59, 1.42, 0.88, 0.04, "#b5c9a6");
      e.box(oven, 0, 0.6, 0.63, 1.35, 0.08, 0.1, "#ead4a5");
      for (const x of [-0.55, 0, 0.55])
        e.ball(oven, x, 0.77, 0.58, 0.1, 0.1, 0.05, "#f1d79f");
      mascot = e.mascot(e.root, -2.65, 0.65, 0.95);
      e.mood(mascot, "wave", 2);
      this.table = e.group(e.root, 0, 1.3, 0.35);
      this.table.userData.hitY = 0.25;
      this.makeBowl();
      this.makeGuest();
      e.target(
        this.table,
        "bowl",
        () => {
          touch();
          if (this.stage === 1) this.stir();
          else if (this.stage === 0) {
            toast("👆 🌾 → 🥣");
            autoGuide();
          }
        },
        0.95,
      );
      this.ui();
    }
    makeGuest() {
      if (this.guest) {
        e.unlabel(this.guestLabel);
        e.actors = e.actors.filter((a) => a !== this.guest);
        this.guest.removeFromParent();
        e.removeTarget("guest");
      }
      this.guest = e.animal(this.guestKind, e.root, 2.8, 0.7, 0.95);
      this.guest.userData.hitY = 1;
      e.mood(this.guest, "wave", 1.8);
      this.guestLabel = e.label(
        this.guest,
        { rabbit: "🥕 🍓", cat: "🐟 🧀", bear: "🍯 🍫" }[this.guestKind],
        2.3,
      );
      e.target(
        this.guest,
        "guest",
        () => {
          touch();
          if (!this.busy && this.stage < 5) this.cycleGuest();
        },
        0.8,
      );
    }
    cycleGuest() {
      this.guestKind = ["rabbit", "cat", "bear"][
        (["rabbit", "cat", "bear"].indexOf(this.guestKind) + 1) % 3
      ];
      this.makeGuest();
      sound("wave");
      this.ui();
    }
    color() {
      const c = new T.Color("#eac697");
      for (const k of this.items)
        c.lerp(new T.Color(R.ingredients[k][2]), 0.25);
      return "#" + c.getHexString();
    }
    makeBowl() {
      e.remove(this.food);
      this.food = e.group(this.table);
      e.cyl(this.food, 0, 0.04, 0, 0.8, 0.26, "#e9c38e");
      e.cyl(this.food, 0, 0.19, 0, 0.72, 0.12, "#f7edcc");
      e.ring(this.food, 0, 0.25, 0, 0.75, "#f9e7ba");
      this.fill = e.group(this.food);
      this.items.forEach((k, i) =>
        e.ball(
          this.fill,
          Math.sin(i * 2.4) * 0.42,
          0.32 + Math.floor(i / 5) * 0.12,
          Math.cos(i * 2.4) * 0.38,
          0.16,
          0.13,
          0.14,
          R.ingredients[k][2],
        ),
      );
      if (this.mixed) {
        this.fill.visible = false;
        e.cyl(this.food, 0, 0.29, 0, 0.62, 0.09, this.color());
      }
      this.spoon = e.group(this.food, 0.3, 0.5, 0);
      e.box(this.spoon, 0, 0.18, 0, 0.07, 0.75, 0.07, "#a9845f");
      e.ball(this.spoon, 0, -0.2, 0, 0.13, 0.08, 0.1, "#a9845f");
      this.spoon.rotation.z = -0.7;
    }
    add(k) {
      if (this.busy || this.stage !== 0) return;
      if (this.items.length >= 8) {
        toast("🥣 ✓");
        sound("hmm");
        return;
      }
      this.items.push(k);
      this.makeBowl();
      const o = this.fill.children.at(-1),
        y = o.position.y,
        s = o.scale.clone();
      e.tween(0.5, (q) => {
        o.position.y = y + (1 - q) * 2;
        o.scale.copy(s).multiplyScalar(0.5 + q * 0.5);
      });
      sound();
      e.mood(mascot, "curious");
      this.ui();
    }
    stir() {
      if (this.stage !== 1 || this.busy) return;
      this.busy = true;
      this.mixed = Math.min(3, this.mixed + 1);
      sound("mix");
      e.mood(mascot, "curious");
      const spoon = this.spoon;
      e.tween(
        0.65,
        (q) => {
          spoon.position.x = Math.cos(q * Math.PI * 2) * 0.35;
          spoon.position.z = Math.sin(q * Math.PI * 2) * 0.35;
          spoon.rotation.z = Math.sin(q * Math.PI * 2) * 0.5;
        },
        () => {
          this.busy = false;
          this.makeBowl();
          this.ui();
          if (this.mixed === 3) toast("🥣 ✨");
        },
      );
    }
    heatFood(heat) {
      if (this.busy) return;
      this.heat = heat;
      this.stage = 3;
      this.busy = true;
      this.result = R.bake(
        this.base,
        this.items,
        this.mixed,
        heat,
        this.guestKind,
      );
      this.ui();
      this.food.visible = false;
      sound("oven");
      e.mood(mascot, "curious", 3);
      const puff = e.cloud(e.root, 0, 2, -2.5, 0.25, "#f7f3dc");
      e.tween(
        2.8,
        (q) => {
          this.glow.scale.x = 1.42 + Math.sin(q * 20) * 0.03;
          puff.position.y = 2 + q * 0.9;
          puff.scale.setScalar(0.25 + q * 0.2);
        },
        () => {
          puff.removeFromParent();
          this.stage = 4;
          this.busy = false;
          this.makeFood();
          sound("bell");
          e.mood(
            mascot,
            this.result.quality === "good" ? "happy" : "curious",
            1.8,
          );
          this.ui();
        },
      );
    }
    makeFood() {
      e.remove(this.food);
      this.food = e.group(this.table);
      e.cyl(this.food, 0, 0, 0, 0.95, 0.055, "#fff8e6");
      this.edible = e.group(this.food);
      const quality = this.result.quality,
        burn = quality === "burnt",
        flat = quality === "flat",
        c = burn ? "#665849" : this.color();
      if (this.base === "cake" || this.base === "pizza") {
        for (let i = 0; i < 3; i++) {
          const slice = e.group(this.edible);
          slice.rotation.y = (i * Math.PI * 2) / 3;
          const cake = this.base === "cake",
            height = cake ? (flat ? 0.12 : 0.6) : 0.13,
            r = cake ? 0.68 : 0.78;
          const m = new T.Mesh(
            new T.CylinderGeometry(
              r,
              r + 0.02,
              height,
              20,
              1,
              false,
              0,
              (Math.PI * 2) / 3,
            ),
            e.mat(c),
          );
          m.position.y = cake ? (flat ? 0.09 : 0.33) : 0.12;
          m.castShadow = true;
          slice.add(m);
          const icing = new T.Mesh(
            new T.CylinderGeometry(
              r,
              r,
              0.06,
              20,
              1,
              false,
              0,
              (Math.PI * 2) / 3,
            ),
            e.mat(burn ? "#716453" : cake ? "#fff1dc" : "#e7b56b"),
          );
          icing.position.y = cake ? (flat ? 0.17 : 0.66) : 0.2;
          slice.add(icing);
        }
      } else {
        e.cyl(this.edible, 0, 0.18, 0, 0.65, 0.35, "#95b6a6");
        e.cyl(this.edible, 0, 0.37, 0, 0.57, 0.06, c);
        for (let i = 0; i < 3; i++)
          e.ball(
            this.edible,
            Math.sin(i * 2) * 0.35,
            0.43,
            Math.cos(i * 2) * 0.3,
            0.13,
            0.08,
            0.13,
            this.items[i] ? R.ingredients[this.items[i]][2] : "#edba75",
          );
      }
      this.decor = e.group(this.food);
      this.items
        .filter((k) => !["flour", "egg", "milk"].includes(k))
        .slice(0, 6)
        .forEach((k, i) =>
          this.garnish(k, i, flat ? 0.23 : this.base === "cake" ? 0.77 : 0.3),
        );
      if (quality === "lumpy")
        for (let i = 0; i < 4; i++)
          e.ball(
            this.decor,
            Math.sin(i * 2) * 0.4,
            0.8,
            Math.cos(i * 2) * 0.4,
            0.14,
            0.16,
            0.12,
            "#e6d4ad",
          );
      if (quality === "raw")
        e.ball(this.decor, 0, 0.06, 0.15, 0.8, 0.06, 0.7, "#e6ce9b");
      if (burn) {
        const puff = e.cloud(this.food, 0.1, 1.1, 0, 0.4, "#aaac9c");
        e.tween(
          2,
          (q) => {
            puff.position.y = 1.1 + q * 0.5;
            puff.scale.setScalar(0.4 * (1 - q));
          },
          () => puff.removeFromParent(),
        );
      }
    }
    garnish(k, i, y) {
      const a = i * 2.4,
        r = 0.25 + (i % 2) * 0.19,
        c = R.ingredients[k]?.[2] || "#fff5e4";
      if (k === "cream")
        e.cone(this.decor, Math.sin(a) * r, y, Math.cos(a) * r, 0.14, 0.22, c);
      else if (k === "fish")
        e.fish(
          this.decor,
          Math.sin(a) * r,
          y,
          Math.cos(a) * r,
          c,
          0.24,
        ).rotation.y = a;
      else
        e.ball(
          this.decor,
          Math.sin(a) * r,
          y,
          Math.cos(a) * r,
          0.13,
          0.12,
          0.12,
          c,
        );
    }
    decorate(k) {
      if (this.stage !== 4 || this.toppings.length >= 6) return;
      this.toppings.push(k);
      this.garnish(
        k,
        this.items.length + this.toppings.length,
        this.base === "cake" && this.result.quality !== "flat" ? 0.84 : 0.4,
      );
      sound();
      e.burst(this.food, R.ingredients[k]?.[2] || "#fff", 4);
    }
    serve() {
      if (this.busy || this.stage !== 4) return;
      this.busy = true;
      this.stage = 5;
      this.result = R.bake(
        this.base,
        this.items,
        this.mixed,
        this.heat,
        this.guestKind,
        this.toppings,
      );
      this.ui();
      task(this.result.likes ? "🍽️ → 😋" : "🍽️ → 🤔");
      const a = this.food.position.clone(),
        b = this.table.worldToLocal(new T.Vector3(2.8, 1.1, 1.22));
      e.tween(
        0.8,
        (q) => {
          this.food.position.lerpVectors(a, b, q);
          this.food.scale.setScalar(1 - q * 0.4);
        },
        () => {
          if (this.result.likes) {
            e.mood(this.guest, "eat", 3.2);
            say("啊呜，真好吃！");
            for (let i = 0; i < 3; i++)
              e.after(0.5 + i * 0.65, () => {
                sound("eat");
                if (this.base === "soup")
                  this.edible.scale.y = Math.max(0.05, 1 - (i + 1) / 3);
                else this.edible.children[i].visible = false;
                this.decor.scale.setScalar(Math.max(0.02, 1 - (i + 1) / 3));
              });
            e.after(2.8, () => {
              this.food.visible = false;
              e.mood(this.guest, "happy", 3);
              this.complete();
            });
          } else {
            e.mood(
              this.guest,
              this.result.quality === "burnt" && this.guestKind === "bear"
                ? "cough"
                : "no",
              2.8,
            );
            e.mood(mascot, "curious", 2.8);
            sound("hmm");
            say("换一种试试吧。");
            e.after(2.8, () => this.complete());
          }
        },
      );
    }
    complete() {
      this.busy = false;
      reward(
        this.result.icon +
          (this.result.likes
            ? "💛"
            : this.result.quality === "burnt"
              ? "☁️"
              : "🔎"),
        this.result.quality + " / " + this.guestKind,
      );
    }
    ui() {
      step(this.stage <= 1 ? this.stage : this.stage <= 3 ? 2 : 3);
      if (this.stage === 0) {
        const keys = Object.keys(R.ingredients),
          n = innerWidth < 700 ? 3 : 5;
        this.page %= Math.ceil(keys.length / n);
        const sample = {
          cake: ["flour", "egg", "milk"],
          pizza: ["flour", "cheese"],
          soup: ["carrot"],
        }[this.base];
        task(
          sample
            .map(
              (k) => R.ingredients[k][1] + (this.items.includes(k) ? "✓" : ""),
            )
            .join(" ") + " → 🥣",
        );
        caption("点食材，放进大碗里", "自由配方 · 食材最多八份");
        dock(
          [
            ...keys
              .slice(this.page * n, (this.page + 1) * n)
              .map((k) => ({
                id: "add-" + k,
                icon: R.ingredients[k][1],
                label: R.ingredients[k][0],
                action: () => this.add(k),
              })),
            {
              id: "pantryPage",
              icon: "➜",
              label: "更多",
              action: () => {
                this.page++;
                this.ui();
              },
            },
            {
              id: "toMix",
              icon: "🥄",
              label: "搅拌",
              primary: !!this.items.length,
              disabled: !this.items.length,
              action: () => {
                this.stage = 1;
                this.ui();
              },
            },
          ],
          [
            ...["cake", "pizza", "soup"].map((k) => ({
              id: "base-" + k,
              icon: { cake: "🧁", pizza: "🍕", soup: "🍲" }[k],
              label: { cake: "蛋糕", pizza: "披萨", soup: "汤" }[k],
              selected: this.base === k,
              action: () => {
                this.base = k;
                this.items = [];
                this.mixed = 0;
                this.makeBowl();
                this.ui();
              },
            })),
            {
              icon: "🧹",
              label: "清空",
              action: () => {
                this.items = [];
                this.makeBowl();
                this.ui();
              },
            },
          ],
        );
      }
      if (this.stage === 1) {
        task("🥄 " + ["○ ○ ○", "● ○ ○", "● ● ○", "● ● ●"][this.mixed]);
        caption("搅一搅，让食材变成面糊", "点大勺，或在碗里划动");
        dock([
          {
            icon: "↩",
            label: "加食材",
            action: () => {
              if (this.busy) return;
              this.stage = 0;
              this.mixed = 0;
              this.makeBowl();
              this.ui();
            },
          },
          {
            id: "stir",
            icon: "🥄",
            label: "搅一搅",
            primary: this.mixed < 3,
            action: () => this.stir(),
          },
          {
            id: "toHeat",
            icon: "♨️",
            label: "进烤箱",
            primary: this.mixed === 3,
            action: () => {
              if (!this.busy) {
                this.stage = 2;
                this.ui();
              }
            },
          },
        ]);
      }
      if (this.stage === 2) {
        task("♨️ ⏳");
        caption("选一种火候，看看结果", "短一点 · 刚刚好 · 久一点");
        dock(
          [0, 1, 2].map((i) => ({
            id: "heat" + i,
            icon: ["⌛", "⏳", "⌛⌛"][i],
            label: ["短一点", "刚刚好", "久一点"][i],
            primary: i === 1,
            action: () => this.heatFood(i),
          })),
        );
      }
      if (this.stage === 3) {
        task("♨️ · · ·");
        caption("香气慢慢飘出来啦", "烤箱正在工作");
        dock([{ icon: "♨️", label: "烘焙中", disabled: true }]);
      }
      if (this.stage === 4) {
        task(
          this.result.icon +
            " " +
            { good: "✨", raw: "💧", burnt: "☁️", flat: "↘", lumpy: "🫧" }[
              this.result.quality
            ],
        );
        caption("装饰一下，请朋友尝一口", "点一下客人，也可以换位朋友");
        dock([
          {
            id: "topping-berry",
            icon: "🍓",
            label: "草莓",
            action: () => this.decorate("berry"),
          },
          { icon: "🍦", label: "奶油", action: () => this.decorate("cream") },
          { icon: "🍫", label: "可可", action: () => this.decorate("cocoa") },
          {
            id: "guestBtn",
            icon: { rabbit: "🐰", cat: "🐱", bear: "🐻" }[this.guestKind],
            label: "换朋友",
            action: () => this.cycleGuest(),
          },
          {
            id: "serve",
            icon: "🍽️",
            label: "请客啦",
            primary: true,
            action: () => this.serve(),
          },
        ]);
      }
      if (this.stage === 5) {
        caption("看看朋友的表情吧", "不同朋友，有不同口味");
        dock([
          {
            icon: { rabbit: "🐰", cat: "🐱", bear: "🐻" }[this.guestKind],
            label: "尝一尝",
            disabled: true,
          },
        ]);
      }
    }
    guide() {
      if (this.busy || this.awarded) return null;
      if (this.stage === 0) {
        const sample = {
            cake: ["flour", "egg", "milk"],
            pizza: ["flour", "cheese"],
            soup: ["carrot"],
          }[this.base],
          next = sample.find((k) => !this.items.includes(k));
        return next ? $("add-" + next) || $("pantryPage") : $("toMix");
      }
      return this.stage === 1
        ? $(this.mixed === 3 ? "toHeat" : "stir")
        : this.stage === 2
          ? $("heat1")
          : $("serve");
    }
    drag() {
      this.stir();
    }
  };
  games.garden = class {
    init() {
      Object.assign(this, {
        intro: "选一颗种子，点一下空空的土地。",
        seed: "berry",
        tool: "seed",
        count: 0,
        harvests: [],
        plots: [],
        awarded: false,
      });
      e.ground("#cddbb5", 7);
      for (let i = 0; i < 7; i++)
        e.tree(e.root, -5 + i * 1.7, -3.2, 0.7 + (i % 2) * 0.25);
      for (let i = 0; i < 10; i++)
        e.flower(
          e.root,
          -4.5 + i,
          0.02,
          2.9,
          i % 2 ? "#dfb36b" : "#d9a89e",
          0.6,
        );
      e.cloud(e.root, 3.5, 3.6, -2, 0.8);
      const sun = e.group(e.root, -3.6, 3.5, -2.6);
      e.ball(sun, 0, 0, 0, 0.45, 0.45, 0.2, "#ebc467");
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        e.box(
          sun,
          Math.sin(a) * 0.68,
          Math.cos(a) * 0.68,
          0,
          0.08,
          0.22,
          0.08,
          "#ebc467",
        ).rotation.z = -a;
      }
      mascot = e.mascot(e.root, -3.6, 1.1, 0.85);
      e.mood(mascot, "wave", 2);
      this.basket = e.group(e.root, 3.5, 0.05, 1.4);
      e.cyl(this.basket, 0, 0.35, 0, 0.58, 0.65, "#cda679");
      e.ring(this.basket, 0, 0.7, 0, 0.57, "#edca8b");
      e.ring(this.basket, 0, 1, 0, 0.5, "#cda679").rotation.x = 0;
      for (let i = 0; i < 3; i++) {
        const p = {
          seed: null,
          water: 0,
          grown: false,
          bug: false,
          pollen: false,
          busy: false,
        };
        p.group = e.group(e.root, -2.1 + i * 2.1, 0, 0);
        e.box(p.group, 0, 0.1, 0, 1.65, 0.25, 1.65, "#bd9b76");
        e.box(p.group, 0, 0.25, 0, 1.42, 0.08, 1.42, "#8f785c");
        p.group.userData.hitY = 0.5;
        e.target(
          p.group,
          "plot" + i,
          () => {
            touch();
            this.interact(p);
          },
          0.85,
        );
        this.plots.push(p);
        this.render(p);
      }
      this.ui();
    }
    need(p) {
      if (!p.seed) return "seed";
      if (p.water < 2) return "water";
      if (p.water > 2) return "sun";
      if (p.bug) return "brush";
      if (!p.grown) return "sun";
      if (p.seed === "flower" && !p.pollen) return "bee";
      return "harvest";
    }
    render(p) {
      e.remove(p.plant);
      e.unlabel(p.label);
      p.plant = e.group(p.group, 0, 0.3, 0);
      if (p.seed) {
        const plant = e.group(p.plant);
        plant.scale.setScalar(
          p.grown ? 1 : p.water === 2 ? 0.6 : p.water === 1 ? 0.4 : 0.2,
        );
        if (p.water > 2) plant.rotation.z = 0.45;
        if (p.seed === "flower") e.flower(plant, 0, 0, 0, "#df9b94", 1.6);
        else {
          e.cyl(plant, 0, 0.55, 0, 0.07, 1.1, "#6d956e");
          for (let i = 0; i < 4; i++)
            e.ball(
              plant,
              Math.sin(i * 2) * 0.28,
              0.3 + i * 0.16,
              Math.cos(i * 2) * 0.2,
              0.3,
              0.07,
              0.15,
              "#8eb27e",
            ).rotation.z = Math.sin(i * 2) * 0.5;
          if (p.grown) {
            if (p.seed === "berry")
              for (let i = 0; i < 3; i++) {
                e.ball(
                  plant,
                  Math.sin(i * 2) * 0.3,
                  0.4 + i * 0.22,
                  0.2,
                  0.2,
                  0.25,
                  0.17,
                  "#dc7c79",
                );
                e.cone(
                  plant,
                  Math.sin(i * 2) * 0.3,
                  0.65 + i * 0.22,
                  0.2,
                  0.13,
                  0.15,
                  "#8aab78",
                );
              }
            else
              e.cone(plant, 0, 0.3, 0.15, 0.28, 0.85, "#e4a05d").rotation.z =
                Math.PI;
          }
        }
        if (p.water > 2) e.cyl(p.plant, 0, 0.04, 0, 0.68, 0.04, "#a8cbd2");
        if (p.bug) {
          const b = e.group(p.plant, 0.36, 0.7, 0.2);
          e.ball(b, 0, 0, 0, 0.13, 0.1, 0.12, "#bc7d5c");
          e.ball(b, 0.11, 0.02, 0.07, 0.06, 0.06, 0.06, "#58684c");
        }
      }
      p.label = e.label(
        p.group,
        {
          seed: "🌱",
          water: "💧",
          sun: "☀️",
          brush: "🪥",
          bee: "🐝",
          harvest: "🧺",
        }[this.need(p)],
        p.grown ? 1.95 : 1.3,
      );
    }
    interact(p) {
      if (p.busy || this.awarded) return;
      const need = this.need(p);
      if (this.tool === "seed" && !p.seed) {
        p.seed = this.seed;
        this.render(p);
        sound();
        e.mood(mascot, "curious");
      } else if (this.tool === "water" && p.seed && !p.grown) {
        p.water = Math.min(4, p.water + 1);
        if (p.water === 2 && p.seed === "carrot") p.bug = true;
        this.render(p);
        const drop = e.ball(
          e.root,
          p.group.position.x,
          2.3,
          0,
          0.15,
          0.22,
          0.15,
          "#8cbfd0",
        );
        e.tween(
          0.55,
          (q) => (drop.position.y = 2.3 - q * 1.8),
          () => drop.removeFromParent(),
        );
        sound("water");
        if (p.water > 2) toast("💧💧 → ☀️");
      } else if (this.tool === "sun" && p.water > 2) {
        p.water = 2;
        this.render(p);
        sound("wave");
        toast("☀️ ✨");
      } else if (this.tool === "sun" && need === "sun") {
        p.grown = true;
        this.render(p);
        const plant = p.plant;
        plant.scale.setScalar(0.3);
        e.tween(1, (q) => plant.scale.setScalar(0.3 + q * 0.7));
        e.burst(p.group);
        sound("yay");
        e.mood(mascot, "happy");
      } else if (this.tool === "brush" && p.bug) {
        p.bug = false;
        this.render(p);
        sound("wave");
        toast("🪥 ✨");
      } else if (this.tool === "bee" && need === "bee") {
        p.pollen = true;
        p.busy = true;
        const b = e.group(e.root, -3, 2, 0);
        e.ball(b, 0, 0, 0, 0.13, 0.1, 0.1, "#e2bb63");
        e.ball(b, 0, 0.12, 0.08, 0.1, 0.05, 0.1, "#faf6dc");
        e.tween(
          1.4,
          (q) =>
            b.position.set(
              -3 + (p.group.position.x + 3) * q,
              2 - Math.sin(q * Math.PI) * 0.65,
              Math.sin(q * 9) * 0.25,
            ),
          () => {
            b.removeFromParent();
            p.busy = false;
            this.render(p);
          },
        );
        sound("wave");
        e.burst(p.group);
        e.mood(mascot, "happy");
      } else if (this.tool === "harvest" && need === "harvest") {
        p.busy = true;
        const seed = p.seed,
          plant = p.plant,
          a = plant.position.clone(),
          b = p.group.worldToLocal(new T.Vector3(3.5, 0.8, 1.4));
        e.unlabel(p.label);
        p.label = null;
        e.tween(
          0.9,
          (q) => {
            plant.position.lerpVectors(a, b, q);
            plant.position.y += Math.sin(q * Math.PI);
            plant.scale.setScalar(1 - q * 0.6);
          },
          () => {
            plant.removeFromParent();
            const i = this.count++,
              icon = { berry: "🍓", carrot: "🥕", flower: "🌷" }[seed];
            this.harvests.push(icon);
            e.ball(
              this.basket,
              -0.25 + (i % 3) * 0.25,
              0.75,
              0,
              0.15,
              0.15,
              0.15,
              { berry: "#d8847b", carrot: "#e6a461", flower: "#dfa5a3" }[seed],
            );
            Object.assign(p, {
              seed: null,
              water: 0,
              grown: false,
              bug: false,
              pollen: false,
              busy: false,
            });
            this.render(p);
            this.ui();
            if (this.count >= 3) reward(this.harvests.join(""), "花园采收");
          },
        );
        sound("yay");
        e.mood(mascot, "happy", 2);
      } else {
        toast(
          {
            seed: "🌱",
            water: "💧",
            sun: "☀️",
            brush: "🪥",
            bee: "🐝",
            harvest: "🧺",
          }[need] + " → 🌱",
        );
        sound("hmm");
        e.mood(mascot, "curious");
        guideTarget = $(
          {
            seed: "seed-berry",
            water: "water",
            sun: "sun",
            brush: "brush",
            bee: "bee",
            harvest: "harvest",
          }[need],
        );
        lastAction = e.t - 8;
      }
      this.ui();
    }
    ui() {
      const p = this.plots.find((p) => p.seed) || this.plots[0];
      step(
        this.count >= 3 ? 3 : !p.seed ? 0 : p.water < 2 ? 1 : !p.grown ? 2 : 3,
      );
      task(
        this.harvests.length
          ? this.harvests.join(" ") +
              " " +
              "○".repeat(Math.max(0, 3 - this.count))
          : "🌱 🌱 🌱",
      );
      caption("照顾小花园，等一个新发现", "种子 → 两滴水 → 阳光 → 收获");
      dock([
        ...["berry", "carrot", "flower"].map((k) => ({
          id: "seed-" + k,
          icon: { berry: "🍓", carrot: "🥕", flower: "🌷" }[k],
          label: { berry: "草莓种子", carrot: "萝卜种子", flower: "花种子" }[k],
          selected: this.tool === "seed" && this.seed === k,
          action: () => {
            this.tool = "seed";
            this.seed = k;
            this.ui();
          },
        })),
        ...["water", "sun", "brush", "bee", "harvest"].map((k) => ({
          id: k,
          icon: {
            water: "💧",
            sun: "☀️",
            brush: "🪥",
            bee: "🐝",
            harvest: "🧺",
          }[k],
          label: {
            water: "浇水",
            sun: "阳光",
            brush: "赶小虫",
            bee: "授粉",
            harvest: "收获",
          }[k],
          selected: this.tool === k,
          action: () => {
            this.tool = k;
            this.ui();
          },
        })),
      ]);
    }
    guide() {
      if (this.awarded) return null;
      const p =
        this.plots.find((p) => !p.busy && this.need(p) === this.tool) ||
        this.plots.find((p) => !p.busy);
      return !p
        ? null
        : this.need(p) === this.tool
          ? p.group
          : $(
              {
                seed: "seed-berry",
                water: "water",
                sun: "sun",
                brush: "brush",
                bee: "bee",
                harvest: "harvest",
              }[this.need(p)],
            );
    }
  };
  games.workshop = class {
    init() {
      Object.assign(this, {
        intro: "给小车装上零件，再到不同的路上试试吧。",
        parts: { body: 0, wheels: 0, roof: 0 },
        route: "grass",
        category: "body",
        running: false,
        awarded: false,
        phase: "build",
      });
      e.ground("#deddb9", 7);
      for (let i = 0; i < 5; i++) {
        e.box(
          e.root,
          -4 + i * 2,
          1,
          -3.6,
          1.5,
          2,
          1,
          ["#b2c4a6", "#dcc391", "#c2c4a3", "#e5c8a7", "#aabdae"][i],
        );
        e.box(e.root, -4 + i * 2, 2.05, -3.6, 1.65, 0.12, 1.1, "#faf0d2");
      }
      this.road = e.group();
      this.platform = e.cyl(e.root, 0, 0.03, 0.5, 1.8, 0.15, "#d1ba8e");
      mascot = e.mascot(e.root, -3.4, -0.4, 0.85);
      e.mood(mascot, "wave", 2);
      this.makeRoute();
      this.makeCar();
      this.ui();
    }
    makeRoute() {
      this.road.clear();
      e.box(this.road, 0, 0.03, 1, 9, 0.08, 2.1, "#d4c7a5");
      for (let i = 0; i < 12; i++)
        e.box(this.road, -4.2 + i * 0.75, 0.08, 1, 0.35, 0.02, 0.06, "#f6efd6");
      if (this.route === "hill")
        for (let i = 0; i < 5; i++)
          e.ball(
            this.road,
            -0.5 + i * 0.55,
            0.18 + (i % 2) * 0.09,
            1,
            0.45,
            0.3,
            0.5,
            "#b6b19b",
          );
      if (this.route === "water") {
        e.box(this.road, 0, 0.1, 1, 3.6, 0.1, 2.2, "#94c4ca");
        for (let i = 0; i < 5; i++)
          e.box(
            this.road,
            -1.4 + i * 0.7,
            0.17,
            1 + (i % 2) * 0.4,
            0.4,
            0.015,
            0.05,
            "#d9eeee",
          );
      }
      for (const x of [-4.3, 4.3]) {
        e.box(this.road, x, 0.8, 1, 0.08, 1.6, 0.08, "#9b9772");
        e.box(
          this.road,
          x + 0.24,
          1.4,
          1,
          0.5,
          0.35,
          0.05,
          x > 0 ? "#83a791" : "#ebc879",
        );
      }
      task({ grass: "🌿 → 🏁", hill: "⛰️ → 🏁", water: "🌊 → 🏁" }[this.route]);
    }
    makeCar() {
      e.remove(this.car);
      this.car = e.group(e.root, 0, 0.25, 0.7);
      const g = this.car,
        p = this.parts;
      this.wheels = [];
      if (p.body === 1) {
        e.ball(g, 0, 0.45, 0, 1.12, 0.36, 0.6, "#9ac0ad");
        e.box(g, 0, 0.65, 0, 1.4, 0.12, 0.65, "#e3d7b7");
      } else if (p.body === 2) {
        e.ball(g, 0, 0.51, 0, 0.9, 0.3, 0.5, "#e7c980");
        e.ball(g, 0.1, 0.78, 0, 0.48, 0.3, 0.42, "#f4e5c5");
      } else {
        e.box(g, 0, 0.5, 0, 1.65, 0.48, 0.85, "#dba479");
        e.box(g, 0.25, 0.88, 0, 0.6, 0.35, 0.75, "#eac18b");
      }
      e.box(g, 0.18, 0.86, 0.44, 0.45, 0.25, 0.035, "#b6d7d4");
      for (const x of [-0.6, 0.6])
        for (const z of [-0.52, 0.52]) {
          const w = e.group(g, x, 0.24, z);
          e.cyl(
            w,
            0,
            0,
            0,
            p.wheels === 1 ? 0.4 : 0.27,
            0.19,
            p.wheels === 2 ? "#bca273" : "#5f776d",
          ).rotation.x = Math.PI / 2;
          if (p.wheels === 2)
            for (let j = 0; j < 6; j++)
              e.box(
                w,
                Math.sin((j * Math.PI) / 3) * 0.28,
                Math.cos((j * Math.PI) / 3) * 0.28,
                0,
                0.12,
                0.23,
                0.24,
                "#d6ba85",
              ).rotation.z = (-j * Math.PI) / 3;
          e.cyl(
            w,
            0,
            0,
            z > 0 ? 0.12 : -0.12,
            0.11,
            0.04,
            "#f2e6bf",
          ).rotation.x = Math.PI / 2;
          this.wheels.push(w);
        }
      if (p.roof === 0) {
        e.box(g, -0.45, 1.22, 0, 0.04, 0.7, 0.04, "#8b8765");
        e.box(g, -0.2, 1.5, 0, 0.52, 0.32, 0.04, "#e7a783");
      }
      if (p.roof === 1) {
        e.box(g, -0.1, 1.45, 0, 0.06, 1.3, 0.06, "#998868");
        const sail = e.cone(g, 0.25, 1.5, 0, 0.65, 1.15, "#f9eccc");
        sail.scale.z = 0.06;
        sail.rotation.z = -0.3;
      }
      if (p.roof === 2) {
        e.box(g, 0, 1.2, 0, 0.12, 0.6, 0.12, "#b6a982");
        this.propeller = e.group(g, 0, 1.55, 0);
        e.box(this.propeller, 0, 0, 0, 1.45, 0.06, 0.16, "#96bba6");
        e.ball(this.propeller, 0, 0.06, 0, 0.13, 0.1, 0.13, "#e6c984");
      } else this.propeller = null;
      this.car.userData.hitY = 0.7;
      e.removeTarget("car");
      e.target(
        this.car,
        "car",
        () => {
          touch();
          if (!this.running && !this.awarded) {
            e.tween(0.8, (q) => (this.car.rotation.y = q * Math.PI * 2));
            sound("car");
          }
        },
        1.1,
      );
    }
    choose(k, i) {
      if (this.running || this.awarded) return;
      this.parts[k] = i;
      this.makeCar();
      e.burst(this.car, "#e7c16f", 6);
      e.mood(mascot, "happy");
      sound("car");
      this.phase = "build";
      this.ui();
    }
    run() {
      if (this.running || this.awarded) return;
      this.running = true;
      this.phase = "run";
      this.result = R.drive(this.parts, this.route);
      this.car.position.x = -3.5;
      this.platform.visible = false;
      this.ui();
      sound("car");
      e.mood(mascot, "wave", 4);
      const end = this.result.pass ? 3.4 : -0.8;
      e.tween(
        4 / this.result.speed,
        (q) => {
          this.car.position.x = -3.5 + (end + 3.5) * q;
          this.car.position.y =
            0.25 +
            (this.route === "hill"
              ? Math.abs(Math.sin(q * Math.PI * 4)) * 0.18
              : this.route === "water"
                ? Math.sin(q * 15) * 0.08
                : 0);
          if (this.parts.roof === 2 && this.route === "hill")
            this.car.position.y += Math.sin(q * Math.PI) * 0.7;
          this.wheels.forEach((w) => (w.rotation.z = -q * 20));
          if (this.propeller) this.propeller.rotation.y = q * 40;
        },
        () => {
          this.running = false;
          if (this.result.pass) {
            this.phase = "done";
            e.burst(this.car);
            sound("yay");
            this.ui();
            const parts = { ...this.parts },
              route = this.route;
            reward(
              "🚙" + { grass: "🌿", hill: "⛰️", water: "🌊" }[route],
              JSON.stringify(parts),
              () => {
                start("workshop");
                active.parts = parts;
                active.route = ["grass", "hill", "water"][
                  (["grass", "hill", "water"].indexOf(route) + 1) % 3
                ];
                active.makeRoute();
                active.makeCar();
                active.ui();
              },
            );
          } else {
            this.phase = "repair";
            e.mood(mascot, "curious", 3);
            sound("hmm");
            toast("🔧 " + this.result.icon);
            task("🔧 " + this.result.icon);
            this.needLabel = e.label(this.car, this.result.icon, 1.6);
            this.ui();
            say("换一个零件，再试试吧。");
          }
        },
      );
    }
    repair() {
      e.unlabel(this.needLabel);
      this.phase = "build";
      this.category = this.route === "hill" ? "wheels" : "body";
      this.car.position.set(0, 0.25, 0.7);
      this.platform.visible = true;
      this.ui();
    }
    ui() {
      step(
        this.running
          ? 2
          : this.phase === "done"
            ? 3
            : this.category === "body"
              ? 0
              : 1,
      );
      if (this.phase === "repair") {
        caption("换一个零件，让小车再试试", "碰到难题，也有新办法");
        dock([
          {
            id: "repair",
            icon: "🔧",
            label: "改装小车",
            primary: true,
            action: () => this.repair(),
          },
        ]);
        return;
      }
      if (this.running) {
        caption("出发！看看小车怎样走过这条路", "观察零件怎样改变小车");
        dock([{ icon: "🚙", label: "试跑中", disabled: true }]);
        return;
      }
      const names = {
        body: [
          ["📦", "木箱"],
          ["🛶", "船身"],
          ["🚕", "轻车身"],
        ],
        wheels: [
          ["🛞", "小轮"],
          ["🚜", "大轮"],
          ["⚙️", "桨轮"],
        ],
        roof: [
          ["🚩", "小旗"],
          ["⛵", "风帆"],
          ["🚁", "螺旋桨"],
        ],
      };
      caption("选零件，造一辆自己的车", "草地很轻松 · 石坡要大轮 · 水道要能浮");
      dock(
        [
          ...names[this.category].map(([icon, label], i) => ({
            id: "part-" + i,
            icon,
            label,
            selected: this.parts[this.category] === i,
            action: () => this.choose(this.category, i),
          })),
          {
            id: "drive",
            icon: "▶",
            label: "试一试",
            primary: true,
            action: () => this.run(),
          },
        ],
        [
          ...["body", "wheels", "roof"].map((k) => ({
            id: "category-" + k,
            icon: { body: "🧩", wheels: "🛞", roof: "🚩" }[k],
            label: { body: "车身", wheels: "轮子", roof: "车顶" }[k],
            selected: this.category === k,
            action: () => {
              this.category = k;
              this.ui();
            },
          })),
          ...["grass", "hill", "water"].map((k) => ({
            id: "route-" + k,
            icon: { grass: "🌿", hill: "⛰️", water: "🌊" }[k],
            label: { grass: "草地", hill: "石坡", water: "水道" }[k],
            selected: this.route === k,
            action: () => {
              this.route = k;
              this.makeRoute();
              this.ui();
            },
          })),
        ],
      );
    }
    guide() {
      return this.running || this.awarded
        ? null
        : this.phase === "repair"
          ? $("repair")
          : $("drive");
    }
  };
  games.ocean = class {
    init() {
      Object.assign(this, {
        intro: "点一位海洋朋友，看看它需要什么。",
        current: null,
        tool: null,
        pending: null,
        awarded: false,
        playing: false,
        targets: [],
        taskLabels: [],
      });
      this.states = {
        fish: { trash: [], food: 0, done: false, shell: false },
        turtle: { cleaned: [], fixed: [], done: false, shell: false },
        seal: { notes: 0, highfive: false, done: false, shell: false },
      };
      this.assets = e.group();
      this.habitat = e.group();
      e.ground("#c8dbcc", 7);
      e.cyl(e.root, 0, -0.02, -0.3, 5.7, 0.12, "#a6cfd2");
      for (let i = 0; i < 13; i++) {
        const x = -5 + i * 0.83;
        e.ball(
          e.root,
          x,
          0.02,
          3.1 + Math.sin(i),
          0.3,
          0.15,
          0.25,
          ["#c9bba3", "#d2c5b2", "#aac5b2"][i % 3],
        );
        if (i % 3 === 0) {
          const g = e.group(e.root, x, 0.05, -3);
          e.cyl(g, 0, 0.3, 0, 0.07, 0.6, "#bfa0a1");
          e.ball(g, 0.1, 0.55, 0, 0.2, 0.14, 0.15, "#d2a8a6");
          e.ball(g, -0.15, 0.35, 0, 0.16, 0.13, 0.14, "#d2a8a6");
        }
      }
      mascot = e.mascot(e.root, -3.7, 2, 0.75);
      e.mood(mascot, "wave", 2);
      this.animals = {
        fish: e.fish(e.root, -2.8, 0.9, 0, "#e6ac81", 1.3),
        turtle: e.turtle(e.root, 0, 0.7, 0, 1.2),
        seal: e.seal(e.root, 2.8, 0.8, 0, 1.3),
      };
      for (const k of ["fish", "turtle", "seal"]) {
        e.target(
          this.animals[k],
          "animal-" + k,
          () => {
            touch();
            this.choose(k);
          },
          0.95,
        );
        e.label(
          this.animals[k],
          { fish: "🐠", turtle: "🐢", seal: "🦭" }[k],
          1,
        );
      }
      this.ui();
    }
    clearTask() {
      this.assets.clear();
      this.targets.forEach((id) => e.removeTarget(id));
      this.targets = [];
      this.taskLabels.forEach((l) => e.unlabel(l));
      this.taskLabels = [];
      this.pending = null;
    }
    target(g, id, fn, r = 0.4) {
      id = "ocean-" + id;
      this.targets.push(id);
      e.target(
        g,
        id,
        () => {
          touch();
          fn();
        },
        r,
        10,
      );
    }
    label(g, text, offset = 0.7) {
      this.taskLabels.push(e.label(g, text, offset));
    }
    choose(k) {
      if (this.playing || this.awarded) return;
      this.current = k;
      this.tool = null;
      this.showTask();
      this.ui();
      sound("wave");
      e.mood(mascot, "wave");
      say(
        {
          fish: "帮小鱼把塑料捞起来吧。",
          turtle: "刷干净，再修好珊瑚小家。",
          seal: "听一听，再点点一样的泡泡。",
        }[k],
      );
    }
    showTask() {
      this.clearTask();
      if (!this.current) return;
      const k = this.current,
        s = this.states[k],
        a = this.animals[k];
      if (s.shell) return;
      if (s.done) {
        const shell = e.group(this.assets, a.position.x, 0.4, 1.2);
        for (let i = 0; i < 5; i++)
          e.ball(
            shell,
            (i - 2) * 0.09,
            0.1,
            0,
            0.08,
            0.2,
            0.12,
            "#e9c8b1",
          ).rotation.z = (i - 2) * -0.2;
        this.target(shell, "shell-" + k, () => this.collect(k), 0.65);
        this.label(shell, "🐚 ↓");
        return;
      }
      if (k === "fish" && s.trash.length < 2) {
        for (let i = 0; i < 2; i++) {
          if (s.trash.includes(i)) continue;
          const g = e.group(this.assets, -2.4 + i * 1.4, 0.65, 1.4);
          e.cyl(g, 0, 0, 0, 0.14, 0.48, "#bcc8ad");
          e.cyl(g, 0, 0.3, 0, 0.07, 0.15, "#a4b79e");
          g.rotation.z = 0.7;
          this.target(g, "trash" + i, () => this.net(i, g), 0.5);
          this.label(g, "♻️");
        }
      }
      if (k === "fish" && s.trash.length === 2)
        this.label(a, "🥣 " + "●".repeat(s.food) + "○".repeat(2 - s.food), 0.8);
      if (k === "turtle" && s.cleaned.length < 3) {
        for (let i = 0; i < 3; i++) {
          if (s.cleaned.includes(i)) continue;
          const g = e.group(
            this.assets,
            -0.35 + i * 0.32,
            1.05,
            0.12 + (i % 2) * 0.3,
          );
          e.ball(g, 0, 0, 0, 0.16, 0.06, 0.14, "#9a8f70");
          this.target(g, "dirt" + i, () => this.brush(i, g), 0.32);
        }
        this.label(a, "🪥", 1.15);
      }
      if (k === "turtle" && s.cleaned.length === 3) {
        this.coralPieces = [];
        this.coralSlots = [];
        for (let i = 0; i < 2; i++) {
          if (s.fixed.includes(i)) continue;
          const slot = e.group(this.assets, -0.8 + i * 1.65, 0.15, -1.7);
          e.ring(slot, 0, 0.12, 0, 0.36, i ? "#bdabb7" : "#c9b59b");
          this.target(slot, "slot" + i, () => this.placeCoral(i), 0.6);
          this.label(slot, i ? "🪸②" : "🪸①");
          this.coralSlots[i] = slot;
          const piece = e.group(this.assets, -1.3 + i * 1.8, 0.2, 2.1);
          for (let j = 0; j < 3; j++) {
            const c = i ? "#bd9caa" : "#d8ac87";
            e.cyl(piece, (j - 1) * 0.15, 0.25 + j * 0.08, 0, 0.06, 0.5, c);
            e.ball(
              piece,
              (j - 1) * 0.15,
              0.5 + j * 0.08,
              0,
              0.12,
              0.12,
              0.12,
              c,
            );
          }
          piece.userData.original = piece.position.clone();
          this.target(
            piece,
            "piece" + i,
            () => {
              if (this.playing) return;
              this.pending = i;
              toast("🪸 → ◯");
              this.ui();
            },
            0.5,
          );
          this.coralPieces[i] = piece;
        }
      }
      if (k === "seal") {
        if (s.notes < 3) {
          this.noteModels = [];
          for (let i = 0; i < 3; i++) {
            const g = e.group(this.assets, 1.3 + i * 0.92, 1.2, 1.8);
            e.ball(
              g,
              0,
              0,
              0,
              0.32,
              0.32,
              0.32,
              ["#e9b988", "#a6c5b3", "#b4bed4"][i],
            );
            this.target(g, "note" + i, () => this.note(i), 0.43);
            this.label(g, ["♪", "♫", "♬"][i], 0.28);
            this.noteModels.push(g);
          }
        } else this.label(a, "✋", 1.05);
      }
    }
    net(i, g) {
      const s = this.states.fish;
      if (this.tool !== "net") {
        toast("🥅 → ♻️");
        guideTarget = $("net");
        lastAction = e.t - 8;
        return;
      }
      if (s.trash.includes(i)) return;
      s.trash.push(i);
      e.burst(g, "#c6e0d2", 6);
      sound("water");
      this.showTask();
      this.ui();
    }
    brush(i, g) {
      const s = this.states.turtle;
      if (this.tool !== "brush") {
        toast("🪥 → 🐢");
        guideTarget = $("oceanBrush");
        lastAction = e.t - 8;
        return;
      }
      if (s.cleaned.includes(i)) return;
      s.cleaned.push(i);
      e.burst(g, "#d5e5ca", 5);
      sound("water");
      this.showTask();
      this.ui();
    }
    feed() {
      const s = this.states.fish;
      if (this.current !== "fish" || s.trash.length < 2 || s.done) return;
      s.food++;
      sound("eat");
      const a = this.animals.fish,
        food = e.ball(
          e.root,
          a.position.x + 0.9,
          1.4,
          0.3,
          0.08,
          0.08,
          0.08,
          "#bba579",
        );
      e.tween(
        0.5,
        (q) => {
          food.position.x = a.position.x + 0.9 - q * 0.8;
          food.position.y = 1.4 - q * 0.5;
          food.scale.setScalar(0.08 * (1 - q * 0.8));
        },
        () => food.removeFromParent(),
      );
      e.tween(0.6, (q) => {
        a.rotation.z = Math.sin(q * Math.PI * 3) * 0.1;
        a.userData.mouth.scale.y =
          0.03 + Math.abs(Math.sin(q * Math.PI * 3)) * 0.07;
      });
      if (s.food >= 2) this.finishAnimal("fish");
      else {
        this.showTask();
        this.ui();
      }
    }
    placeCoral(i) {
      if (this.playing) return;
      if (this.pending === null) {
        toast("👆 🪸 → ◯");
        return;
      }
      if (i !== this.pending) {
        toast("🪸 → " + (this.pending ? "②" : "①"));
        sound("hmm");
        guideTarget = this.coralSlots[this.pending];
        lastAction = e.t - 8;
        return;
      }
      const s = this.states.turtle;
      if (s.fixed.includes(i)) return;
      const piece = this.coralPieces[i],
        a = piece.position.clone(),
        b = this.coralSlots[i].position.clone();
      this.pending = null;
      this.playing = true;
      s.fixed.push(i);
      sound("wave");
      this.ui();
      e.tween(
        0.7,
        (q) => {
          piece.position.lerpVectors(a, b, q);
          piece.position.y += Math.sin(q * Math.PI) * 0.5;
        },
        () => {
          this.habitat.attach(piece);
          this.playing = false;
          if (s.fixed.length === 2) this.finishAnimal("turtle");
          else {
            this.showTask();
            this.ui();
          }
        },
      );
    }
    demo() {
      const s = this.states.seal;
      if (this.current !== "seal" || this.playing || s.notes >= 3) return;
      this.playing = true;
      this.ui();
      [0, 2, 1].forEach((i, j) =>
        e.after(0.5 + j * 0.65, () => {
          sound("note" + i);
          const m = this.noteModels?.[i];
          if (m)
            e.tween(0.4, (q) =>
              m.scale.setScalar(1 + Math.sin(q * Math.PI) * 0.35),
            );
        }),
      );
      e.after(2.65, () => {
        this.playing = false;
        this.ui();
      });
    }
    note(i) {
      const s = this.states.seal;
      if (this.current !== "seal" || this.playing || s.notes >= 3) return;
      sound("note" + i);
      const m = this.noteModels[i];
      e.tween(0.4, (q) => m.scale.setScalar(1 + Math.sin(q * Math.PI) * 0.2));
      if (i === [0, 2, 1][s.notes]) {
        s.notes++;
        if (s.notes === 3) {
          toast("♪ ♬ ♫ ✨");
          this.showTask();
        }
        this.ui();
      } else {
        s.notes = 0;
        toast("👂 ♪");
        e.mood(mascot, "curious");
        this.demo();
      }
    }
    highfive() {
      const s = this.states.seal;
      if (this.current !== "seal" || s.notes < 3 || s.highfive) return;
      s.highfive = true;
      this.playing = true;
      e.mood(mascot, "wave", 2);
      sound("yay");
      const a = this.animals.seal;
      e.tween(
        1.2,
        (q) => (a.rotation.x = q * Math.PI * 2),
        () => {
          a.rotation.x = 0;
          this.playing = false;
          this.finishAnimal("seal");
        },
      );
    }
    finishAnimal(k) {
      const s = this.states[k];
      if (s.done) return;
      s.done = true;
      this.playing = true;
      this.clearTask();
      const a = this.animals[k],
        z = a.position.z;
      sound("yay");
      e.mood(mascot, "happy", 2);
      e.burst(a);
      toast("💛 " + { fish: "🐠", turtle: "🐢", seal: "🦭" }[k]);
      this.ui();
      e.tween(
        1.5,
        (q) => {
          a.position.z = z - Math.sin(q * Math.PI) * 1.2;
          a.rotation.y = Math.sin(q * Math.PI * 2) * 0.3;
        },
        () => {
          this.playing = false;
          this.showTask();
          this.ui();
        },
      );
    }
    collect(k) {
      if (this.playing) return;
      const s = this.states[k];
      if (!s.done || s.shell) return;
      s.shell = true;
      sound("bell");
      this.showTask();
      if (Object.values(this.states).every((s) => s.shell)) {
        reward("🐠🐢🦭", "海湾三位伙伴");
        task("🐚 🐚 🐚");
      } else {
        this.current = null;
        this.clearTask();
        this.ui();
        say("谢谢你，再去看看另一位朋友吧。");
      }
    }
    ui() {
      step(Object.values(this.states).filter((s) => s.shell).length);
      if (!this.current) {
        task("🐠 🐢 🦭");
        caption("点一位朋友，看看它需要什么", "三位伙伴，三种不同的小小帮助");
        dock(
          ["fish", "turtle", "seal"]
            .filter((k) => !this.states[k].shell)
            .map((k) => ({
              id: "choose-" + k,
              icon: { fish: "🐠", turtle: "🐢", seal: "🦭" }[k],
              label: { fish: "小鱼", turtle: "海龟", seal: "海豹" }[k],
              action: () => this.choose(k),
            })),
        );
        return;
      }
      const k = this.current,
        s = this.states[k],
        switches = ["fish", "turtle", "seal"].map((j) => ({
          id: "choose-" + j,
          icon: { fish: "🐠", turtle: "🐢", seal: "🦭" }[j],
          label: this.states[j].shell ? "照顾好了" : "换位朋友",
          selected: k === j,
          disabled: this.playing,
          action: () => this.choose(j),
        }));
      if (s.shell) {
        caption("这位朋友已经照顾好了", "看看另外一位伙伴吧");
        dock([], switches);
        return;
      }
      if (s.done) {
        task("💛 → 🐚");
        caption(this.playing ? "朋友在和你说谢谢" : "点贝壳，带走朋友的感谢");
        dock(
          [
            {
              id: "collectShell",
              icon: "🐚",
              label: "收贝壳",
              primary: true,
              disabled: this.playing,
              action: () => this.collect(k),
            },
          ],
          switches,
        );
        return;
      }
      if (k === "fish") {
        if (s.trash.length < 2) {
          task(
            "♻️ " + "●".repeat(s.trash.length) + "○".repeat(2 - s.trash.length),
          );
          caption("用网兜捞起塑料，给小鱼干净的家", "先点网兜，再点漂浮的塑料");
          dock(
            [
              {
                id: "net",
                icon: "🥅",
                label: "网兜",
                selected: this.tool === "net",
                primary: this.tool !== "net",
                action: () => {
                  this.tool = "net";
                  this.ui();
                },
              },
            ],
            switches,
          );
        } else {
          task("🥣 " + "●".repeat(s.food) + "○".repeat(2 - s.food));
          caption("给小鱼喂两口鱼粮", "每一口，都有开心的回应");
          dock(
            [
              {
                id: "feed",
                icon: "🥣",
                label: "喂一口",
                primary: true,
                action: () => this.feed(),
              },
            ],
            switches,
          );
        }
      }
      if (k === "turtle") {
        if (s.cleaned.length < 3) {
          task(
            "🪥 " +
              "●".repeat(s.cleaned.length) +
              "○".repeat(3 - s.cleaned.length),
          );
          caption("轻轻刷掉海龟背上的小污渍", "点刷子，再点污渍");
          dock(
            [
              {
                id: "oceanBrush",
                icon: "🪥",
                label: "小刷子",
                selected: this.tool === "brush",
                primary: this.tool !== "brush",
                action: () => {
                  this.tool = "brush";
                  this.ui();
                },
              },
            ],
            switches,
          );
        } else {
          task("🪸 → ◯");
          caption(
            "把珊瑚放回相同的小圆圈",
            "点珊瑚，再点同样的圈，也可以拖过去",
          );
          dock(
            [0, 1].map((i) => ({
              id: "coral" + i,
              icon: "🪸" + (i ? "②" : "①"),
              label: "珊瑚" + (i ? "二" : "一"),
              selected: this.pending === i,
              disabled: s.fixed.includes(i) || this.playing,
              action: () => {
                this.pending = i;
                this.ui();
              },
            })),
            switches,
          );
        }
      }
      if (k === "seal") {
        if (s.notes < 3) {
          task(
            (this.playing ? "👂 " : "") +
              "♪ ♬ ♫  " +
              "●".repeat(s.notes) +
              "○".repeat(3 - s.notes),
          );
          caption(
            this.playing
              ? "听一听，看看哪一个泡泡亮了"
              : "按刚才的顺序，点点音符泡泡",
            "低音 → 高音 → 中音",
          );
          dock(
            [
              {
                id: "demo",
                icon: "👂",
                label: "听一遍",
                primary: true,
                disabled: this.playing,
                action: () => this.demo(),
              },
            ],
            switches,
          );
        } else {
          task("✋ → 🦭");
          caption("和小海豹击个掌吧", "你的陪伴，让它很开心");
          dock(
            [
              {
                id: "highfive",
                icon: "✋",
                label: "击掌",
                primary: true,
                disabled: this.playing,
                action: () => this.highfive(),
              },
            ],
            switches,
          );
        }
      }
    }
    guide() {
      if (this.playing || this.awarded) return null;
      if (!this.current) return document.querySelector("#dock .tool");
      const s = this.states[this.current];
      if (s.done) return $("collectShell");
      if (this.current === "fish") {
        if (s.trash.length === 2) return $("feed");
        return this.tool !== "net"
          ? $("net")
          : e.targets.find((t) => t.id.startsWith("ocean-trash"))?.object;
      }
      if (this.current === "turtle") {
        if (s.cleaned.length < 3)
          return this.tool !== "brush"
            ? $("oceanBrush")
            : e.targets.find((t) => t.id.startsWith("ocean-dirt"))?.object;
        return this.pending === null
          ? this.coralPieces?.[s.fixed.includes(0) ? 1 : 0]
          : this.coralSlots?.[this.pending];
      }
      return s.notes >= 3
        ? $("highfive")
        : s.notes
          ? this.noteModels?.[[0, 2, 1][s.notes]]
          : $("demo");
    }
    update(dt, t) {
      const a = this.animals.fish;
      a.position.y = 0.9 + Math.sin(t * 2) * 0.07;
      a.userData.tail.rotation.y = Math.sin(t * 6) * 0.3;
    }
    dragMove(x, y) {
      if (this.current !== "turtle" || this.pending === null || this.playing)
        return;
      const piece = this.coralPieces?.[this.pending];
      if (!piece) return;
      e.pointer.set((x / innerWidth) * 2 - 1, 1 - (y / innerHeight) * 2);
      e.ray.setFromCamera(e.pointer, e.camera);
      const p = new T.Vector3();
      if (
        e.ray.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), -0.4), p)
      )
        piece.position.copy(p);
    }
    dragEnd(x, y) {
      if (this.current !== "turtle" || this.pending === null) return;
      const i = this.pending,
        piece = this.coralPieces?.[i],
        slot = this.coralSlots?.[i];
      if (!piece || !slot) return;
      const p = e.project(slot, 0.1);
      if (Math.hypot(p.x - x, p.y - y) < 85) this.placeCoral(i);
      else piece.position.copy(piece.userData.original);
    }
  };
  function bind() {
    document.querySelectorAll("[data-world]").forEach(
      (b) =>
        (b.onclick = () => {
          sound();
          start(b.dataset.world);
        }),
    );
    $("homeBtn").onclick = () => {
      touch();
      sound();
      home();
    };
    $("restartBtn").onclick = () => {
      touch();
      sound();
      if (world) start(world);
    };
    $("helpBtn").onclick = () => {
      touch();
      sound();
      autoGuide();
      say(
        $("caption").textContent || active?.intro || "点一点，看看会发生什么。",
      );
    };
    document.querySelectorAll(".sound").forEach(
      (b) =>
        (b.onclick = () => {
          touch();
          toggleSound();
        }),
    );
    $("albumBtn").onclick = album;
    $("modalClose").onclick = () => {
      const finished =
        active?.awarded && $("modalTitle").textContent === "又有一个新发现！";
      closeModal();
      if (finished) home();
    };
    let timer,
      frame,
      opened = false;
    function cancelHold() {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      $("parentBtn").classList.remove("hold-progress");
    }
    $("parentBtn").addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      opened = false;
      const begin = performance.now(),
        draw = () => {
          const u = Math.min(1, (performance.now() - begin) / 2000);
          $("parentBtn").classList.add("hold-progress");
          $("parentBtn").style.setProperty("--hold", u * 100 + "%");
          if (u < 1) frame = requestAnimationFrame(draw);
        };
      draw();
      timer = setTimeout(() => {
        opened = true;
        parent();
        cancelHold();
      }, 2000);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((ev) =>
      $("parentBtn").addEventListener(ev, cancelHold),
    );
    $("parentBtn").onclick = () => {
      if (!opened) toast("⚙️ ⏳", "按住两秒打开家长设置");
    };
    $("parentBtn").onkeydown = (ev) => {
      if (ev.key === "Enter" && !ev.repeat) timer = setTimeout(parent, 2000);
    };
    $("parentBtn").onkeyup = cancelHold;
    let pressed;
    $("scene").addEventListener("pointerdown", (ev) => {
      if (!$("modal").hidden) return;
      touch();
      sound();
      pressed = { x: ev.clientX, y: ev.clientY, dist: 0 };
      $("scene").setPointerCapture?.(ev.pointerId);
      if (!e.tap(ev.clientX, ev.clientY) && world) e.mood(mascot, "curious");
    });
    $("scene").addEventListener("pointermove", (ev) => {
      if (!pressed) return;
      pressed.dist = Math.hypot(ev.clientX - pressed.x, ev.clientY - pressed.y);
      if (pressed.dist > 14) {
        active?.drag?.();
        active?.dragMove?.(ev.clientX, ev.clientY);
      }
    });
    $("scene").addEventListener("pointerup", (ev) => {
      if (pressed?.dist > 20) active?.dragEnd?.(ev.clientX, ev.clientY);
      pressed = null;
    });
    $("scene").addEventListener("pointercancel", () => {
      pressed = null;
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") $("modalClose").click();
      if (!$("modal").hidden && ev.key === "Tab") {
        const list = Array.from($("modal").querySelectorAll("button,a")),
          first = list[0],
          last = list.at(-1);
        if (ev.shiftKey && document.activeElement === first) {
          last.focus();
          ev.preventDefault();
        } else if (!ev.shiftKey && document.activeElement === last) {
          first.focus();
          ev.preventDefault();
        }
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        window.speechSynthesis?.cancel();
        ctx?.suspend();
      } else if (saved.sound) ctx?.resume();
    });
  }
  try {
    e = new WorldEngine($("scene"));
    bind();
    persist();
    home();
    $("loading").hidden = true;
    if ("serviceWorker" in navigator)
      navigator.serviceWorker
        .register("./service-worker.js", { scope: "./" })
        .catch(() => {});
    window.__poolo = {
      get world() {
        return world;
      },
      get active() {
        return active;
      },
      get engine() {
        return e;
      },
      get saved() {
        return saved;
      },
      start,
      home,
    };
  } catch (err) {
    console.error(err);
    $("loading").hidden = true;
    $("error").hidden = false;
  }
})();
