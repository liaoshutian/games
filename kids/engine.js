/* Original clay models; all geometry is created locally. */
(function () {
  "use strict";
  const T = THREE;
  class WorldEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.scene = new T.Scene();
      this.camera = new T.OrthographicCamera(-8, 8, 5, -5, 0.1, 100);
      this.camera.position.set(6, 8, 14);
      this.camera.lookAt(0, 1, 0);
      this.renderer = new T.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: "high-performance",
      });
      this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
      this.renderer.outputColorSpace = T.SRGBColorSpace;
      this.renderer.toneMapping = T.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.08;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = T.PCFSoftShadowMap;
      this.scene.add(new T.HemisphereLight("#fff", "#adb99e", 2.5));
      const light = new T.DirectionalLight("#fff0d7", 3);
      light.position.set(-5, 12, 8);
      light.castShadow = true;
      light.shadow.mapSize.set(1024, 1024);
      Object.assign(light.shadow.camera, {
        left: -12,
        right: 12,
        top: 12,
        bottom: -12,
      });
      light.shadow.bias = -0.001;
      this.scene.add(light);
      this.geo = {
        sphere: new T.SphereGeometry(1, 24, 16),
        box: new T.BoxGeometry(1, 1, 1),
        cyl: new T.CylinderGeometry(1, 1, 1, 28),
        cone: new T.ConeGeometry(1, 1, 24),
        torus: new T.TorusGeometry(1, 0.12, 12, 40),
      };
      this.materials = new Map();
      this.ray = new T.Raycaster();
      this.pointer = new T.Vector2();
      this.root = new T.Group();
      this.scene.add(this.root);
      this.targets = [];
      this.actors = [];
      this.effects = [];
      this.tweens = [];
      this.labels = [];
      this.t = 0;
      this.prev = performance.now();
      this.paused = false;
      this.reduced = false;
      this.mode = "home";
      this.bg = "#f7f5eb";
      window.addEventListener("resize", () => this.resize());
      document.addEventListener("visibilitychange", () => {
        this.paused = document.hidden;
        this.prev = performance.now();
      });
      canvas.addEventListener("webglcontextlost", (ev) => {
        ev.preventDefault();
        this.paused = true;
        document.getElementById("error").hidden = false;
      });
      this.resize();
      this.frame = this.frame.bind(this);
      requestAnimationFrame(this.frame);
    }
    mat(c, opts = {}) {
      const k = c + JSON.stringify(opts);
      if (!this.materials.has(k))
        this.materials.set(
          k,
          new T.MeshStandardMaterial({ color: c, roughness: 0.65, ...opts }),
        );
      return this.materials.get(k);
    }
    mesh(p, shape, pos, scale, c, opts = {}) {
      const m = new T.Mesh(this.geo[shape], this.mat(c, opts));
      m.position.set(...pos);
      m.scale.set(...scale);
      m.castShadow = true;
      m.receiveShadow = true;
      p.add(m);
      return m;
    }
    ball(p, x, y, z, a, b, c, col) {
      return this.mesh(p, "sphere", [x, y, z], [a, b, c], col);
    }
    box(p, x, y, z, a, b, c, col) {
      return this.mesh(p, "box", [x, y, z], [a, b, c], col);
    }
    cyl(p, x, y, z, r, h, c) {
      return this.mesh(p, "cyl", [x, y, z], [r, h, r], c);
    }
    cone(p, x, y, z, r, h, c) {
      return this.mesh(p, "cone", [x, y, z], [r, h, r], c);
    }
    ring(p, x, y, z, r, c) {
      const m = this.mesh(p, "torus", [x, y, z], [r, r, r], c);
      m.rotation.x = Math.PI / 2;
      return m;
    }
    group(p = this.root, x = 0, y = 0, z = 0) {
      const g = new T.Group();
      g.position.set(x, y, z);
      p.add(g);
      return g;
    }
    star(p, x, y, z, s = 0.2, c = "#e6b454") {
      const g = this.group(p, x, y, z);
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5,
          m = this.cone(
            g,
            Math.sin(a) * s * 0.38,
            Math.cos(a) * s * 0.38,
            0,
            s * 0.37,
            s * 0.9,
            c,
          );
        m.rotation.z = -a;
      }
      g.scale.z = 0.4;
      return g;
    }
    ground(c = "#dbe3c4", r = 7) {
      this.cyl(this.root, 0, -0.25, 0, r, 0.4, c);
      const p = new T.Mesh(new T.PlaneGeometry(160, 160), this.mat(this.bg));
      p.rotation.x = -Math.PI / 2;
      p.position.y = -0.5;
      p.receiveShadow = true;
      this.root.add(p);
    }
    cloud(p, x, y, z, s = 1, c = "#fffaf0") {
      const g = this.group(p, x, y, z);
      g.scale.setScalar(s);
      this.ball(g, -0.3, 0, 0, 0.4, 0.25, 0.3, c);
      this.ball(g, 0, 0.13, 0, 0.43, 0.35, 0.33, c);
      this.ball(g, 0.33, 0, 0, 0.35, 0.25, 0.3, c);
      return g;
    }
    tree(p, x, z, s = 1) {
      const g = this.group(p, x, 0, z);
      g.scale.setScalar(s);
      this.cyl(g, 0, 0.55, 0, 0.13, 1.1, "#bc9973");
      this.ball(g, 0, 1.4, 0, 0.62, 0.75, 0.6, "#9dbf83");
      this.ball(g, -0.32, 1.25, 0.1, 0.42, 0.46, 0.4, "#b0cc96");
      return g;
    }
    flower(p, x, y, z, c = "#df9b94", s = 1) {
      const g = this.group(p, x, y, z);
      g.scale.setScalar(s);
      this.cyl(g, 0, 0.3, 0, 0.035, 0.6, "#7aa576");
      this.ball(g, 0.14, 0.24, 0, 0.2, 0.06, 0.09, "#8fb77c").rotation.z = 0.4;
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        this.ball(
          g,
          Math.cos(a) * 0.16,
          0.65 + Math.sin(a) * 0.16,
          0,
          0.14,
          0.14,
          0.08,
          c,
        );
      }
      this.ball(g, 0, 0.65, 0.07, 0.09, 0.09, 0.06, "#edc86d");
      return g;
    }
    mascot(p = this.root, x = 0, z = 0, s = 1) {
      const g = this.group(p, x, 0, z);
      g.scale.setScalar(s);
      this.ball(g, 0, 0.78, 0, 0.48, 0.6, 0.4, "#80bda7");
      this.ball(g, 0, 0.8, 0.32, 0.28, 0.35, 0.1, "#c7e0c2");
      for (const sign of [-1, 1])
        this.ball(g, sign * 0.25, 0.22, 0.1, 0.22, 0.22, 0.28, "#fff0d7");
      const left = this.ball(g, -0.49, 0.93, 0.03, 0.17, 0.3, 0.18, "#fff0d7"),
        right = this.ball(g, 0.49, 0.93, 0.03, 0.17, 0.3, 0.18, "#fff0d7");
      const head = this.group(g, 0, 1.58, 0.03);
      this.ball(head, 0, 0, 0, 0.68, 0.61, 0.53, "#fff0d7");
      for (const sign of [-1, 1]) {
        const ear = this.group(head, sign * 0.56, 0.44, -0.06);
        ear.rotation.z = -sign * 0.3;
        this.ball(ear, 0, 0.1, 0, 0.25, 0.31, 0.2, "#9ec7ab");
        this.ball(ear, sign * 0.1, 0.28, 0, 0.21, 0.23, 0.18, "#b6d6b7");
        this.ball(ear, -sign * 0.12, 0.27, 0, 0.18, 0.22, 0.17, "#b6d6b7");
        this.ball(
          head,
          sign * 0.38,
          -0.12,
          0.43,
          0.14,
          0.075,
          0.035,
          "#edb49e",
        );
      }
      const eyes = [];
      for (const sign of [-1, 1]) {
        eyes.push(
          this.ball(
            head,
            sign * 0.23,
            0.055,
            0.49,
            0.078,
            0.102,
            0.045,
            "#334b42",
          ),
        );
        this.ball(
          head,
          sign * 0.23 - 0.02,
          0.09,
          0.527,
          0.022,
          0.028,
          0.013,
          "#fffdf5",
        );
      }
      this.ball(head, 0, -0.09, 0.537, 0.06, 0.045, 0.025, "#c8977d");
      const mouth = this.ball(
        head,
        0,
        -0.225,
        0.516,
        0.075,
        0.035,
        0.025,
        "#66584a",
      );
      this.star(g, 0, 0.82, 0.435, 0.19, "#e8a14c");
      this.ball(g, 0.38, 0.53, -0.3, 0.23, 0.24, 0.22, "#b6d6b7");
      g.userData = {
        home: g.position.clone(),
        scale: s,
        parts: { head, left, right, eyes, mouth },
        mood: "idle",
        start: 0,
        duration: 0,
      };
      this.actors.push(g);
      return g;
    }
    animal(kind, p = this.root, x = 0, z = 0, s = 1) {
      const g = this.group(p, x, 0, z);
      g.scale.setScalar(s);
      const c =
        kind === "rabbit" ? "#fff0dc" : kind === "cat" ? "#dfad82" : "#bc9074";
      this.ball(g, 0, 0.57, 0, 0.43, 0.52, 0.35, c);
      const head = this.group(g, 0, 1.24, 0);
      this.ball(head, 0, 0, 0, 0.52, 0.48, 0.43, c);
      for (const sign of [-1, 1]) {
        if (kind === "rabbit") {
          this.ball(head, sign * 0.26, 0.57, 0, 0.15, 0.5, 0.12, c).rotation.z =
            -sign * 0.12;
          this.ball(head, sign * 0.26, 0.58, 0.08, 0.07, 0.34, 0.04, "#ecc1ae");
        } else if (kind === "cat")
          this.cone(head, sign * 0.33, 0.42, 0, 0.18, 0.4, c);
        else this.ball(head, sign * 0.38, 0.33, 0, 0.21, 0.2, 0.17, c);
        this.ball(g, sign * 0.2, 0.15, 0.08, 0.2, 0.18, 0.22, c);
        this.ball(head, sign * 0.3, -0.1, 0.35, 0.1, 0.065, 0.03, "#e8a391");
      }
      const eyes = [
          this.ball(head, -0.18, 0.04, 0.395, 0.055, 0.075, 0.03, "#37463e"),
          this.ball(head, 0.18, 0.04, 0.395, 0.055, 0.075, 0.03, "#37463e"),
        ],
        mouth = this.ball(head, 0, -0.21, 0.405, 0.06, 0.035, 0.025, "#695148"),
        left = this.ball(g, -0.42, 0.7, 0.04, 0.14, 0.25, 0.15, c),
        right = this.ball(g, 0.42, 0.7, 0.04, 0.14, 0.25, 0.15, c);
      this.ball(head, 0, -0.11, 0.43, 0.055, 0.045, 0.03, "#9a7866");
      g.userData = {
        home: g.position.clone(),
        scale: s,
        kind,
        parts: { head, eyes, mouth, left, right },
        mood: "idle",
        start: 0,
        duration: 0,
      };
      this.actors.push(g);
      return g;
    }
    fish(p, x = 0, y = 1, z = 0, c = "#efa985", s = 1) {
      const g = this.group(p, x, y, z);
      g.scale.setScalar(s);
      this.ball(g, 0, 0, 0, 0.48, 0.28, 0.2, c);
      const tail = this.cone(g, -0.47, 0, 0, 0.25, 0.4, c);
      tail.rotation.z = Math.PI / 2;
      this.ball(g, 0.23, 0.07, 0.17, 0.045, 0.055, 0.03, "#334c45");
      this.cone(g, 0, 0.27, 0, 0.12, 0.2, "#e9c282");
      g.userData = {
        tail,
        mouth: this.ball(g, 0.445, -0.065, 0.08, 0.045, 0.03, 0.04, "#687a67"),
      };
      return g;
    }
    turtle(p, x = 0, y = 0.6, z = 0, s = 1) {
      const g = this.group(p, x, y, z);
      g.scale.setScalar(s);
      this.ball(g, 0, 0.08, 0, 0.65, 0.33, 0.5, "#8db69b");
      this.ball(g, 0, 0.23, 0, 0.49, 0.27, 0.4, "#b9ca85");
      this.ball(g, 0.68, 0, 0, 0.28, 0.25, 0.23, "#a1c7a6");
      this.ball(g, 0.8, 0.08, 0.17, 0.045, 0.055, 0.025, "#3f5a48");
      for (const dx of [-0.4, 0.3])
        for (const dz of [-0.43, 0.43])
          this.ball(g, dx, -0.1, dz, 0.28, 0.08, 0.15, "#a1c7a6").rotation.y =
            dz * dx;
      return g;
    }
    seal(p, x = 0, y = 0.6, z = 0, s = 1) {
      const g = this.group(p, x, y, z);
      g.scale.setScalar(s);
      this.ball(g, 0, 0, 0, 0.62, 0.34, 0.35, "#b9cbd5");
      this.ball(g, 0.37, 0.28, 0, 0.35, 0.37, 0.31, "#c7d8df");
      this.ball(g, 0.5, 0.25, 0.25, 0.09, 0.08, 0.06, "#eef1e6");
      this.ball(g, 0.5, 0.38, 0.245, 0.04, 0.05, 0.03, "#3a5353");
      this.ball(g, 0.65, 0.3, 0.22, 0.055, 0.035, 0.035, "#537478");
      this.ball(g, -0.62, -0.03, 0, 0.22, 0.08, 0.22, "#a0bdc8");
      this.ball(g, 0, -0.16, 0.3, 0.27, 0.07, 0.15, "#a0bdc8");
      return g;
    }
    target(object, id, fn, radius = 0.65, priority = 0) {
      const proxy = this.ball(
        this.root,
        0,
        0,
        0,
        radius,
        radius,
        radius,
        "#fff",
      );
      proxy.material = this.mat("#fff", {
        transparent: true,
        opacity: 0,
        depthWrite: false,
        colorWrite: false,
      });
      proxy.castShadow = proxy.receiveShadow = false;
      this.targets.push({ object, id, fn, proxy, radius, priority });
      return object;
    }
    removeTarget(id) {
      this.targets = this.targets.filter((t) => {
        if (t.id === id) {
          t.proxy.removeFromParent();
          return false;
        }
        return true;
      });
    }
    syncTargets() {
      this.root.updateMatrixWorld(true);
      for (const t of this.targets) {
        t.object.getWorldPosition(t.proxy.position);
        t.proxy.position.y += t.object.userData.hitY || 0;
        t.proxy.scale.setScalar(
          Math.max(
            t.radius,
            ((this.camera.top - this.camera.bottom) * 32) / innerHeight,
          ),
        );
        t.proxy.updateMatrixWorld(true);
      }
    }
    tap(x, y) {
      this.pointer.set((x / innerWidth) * 2 - 1, 1 - (y / innerHeight) * 2);
      this.ray.setFromCamera(this.pointer, this.camera);
      this.syncTargets();
      const hits = this.ray
        .intersectObjects(
          this.targets.map((t) => t.proxy),
          false,
        )
        .map((h) => ({
          t: this.targets.find((t) => t.proxy === h.object),
          d: h.distance,
        }))
        .sort((a, b) => b.t.priority - a.t.priority || a.d - b.d);
      if (hits.length) {
        hits[0].t.fn(hits[0].t.object);
        return true;
      }
      return false;
    }
    remove(g) {
      if (!g) return;
      g.traverse((o) => {
        if (o.geometry && !Object.values(this.geo).includes(o.geometry))
          o.geometry.dispose();
      });
      g.removeFromParent();
    }
    clear(bg = "#f7f5eb", mode = "game") {
      this.remove(this.root);
      this.root = new T.Group();
      this.scene.add(this.root);
      this.targets = [];
      this.actors = [];
      this.tweens = [];
      this.effects = [];
      this.labels = [];
      document.getElementById("labels").replaceChildren();
      this.bg = bg;
      this.scene.background = new T.Color(bg);
      this.mode = mode;
      this.onResize = null;
      this.resize();
    }
    resize() {
      const w = innerWidth,
        h = innerHeight,
        ratio = w / h,
        vh =
          this.mode === "home" ? (ratio > 1 ? 10 : 15) : ratio > 1 ? 9.8 : 15.4;
      this.renderer.setSize(w, h, false);
      Object.assign(this.camera, {
        left: (-vh * ratio) / 2,
        right: (vh * ratio) / 2,
        top: vh / 2,
        bottom: -vh / 2,
      });
      this.camera.updateProjectionMatrix();
      this.onResize?.();
    }
    project(g, offset = 0) {
      const v = new T.Vector3();
      g.getWorldPosition(v);
      v.y += offset;
      v.project(this.camera);
      return {
        x: ((v.x + 1) * innerWidth) / 2,
        y: ((1 - v.y) * innerHeight) / 2,
      };
    }
    label(g, text, offset = 1) {
      const el = document.createElement("div");
      el.className = "label3d";
      el.textContent = text;
      document.getElementById("labels").append(el);
      const item = { g, el, offset };
      this.labels.push(item);
      return item;
    }
    unlabel(item) {
      if (item) {
        item.el.remove();
        this.labels = this.labels.filter((x) => x !== item);
      }
    }
    mood(a, mood, duration = 1.5) {
      if (a) Object.assign(a.userData, { mood, start: this.t, duration });
    }
    tween(duration, update, done) {
      this.tweens.push({ start: this.t, duration, update, done });
    }
    after(seconds, done) {
      this.tween(seconds, () => {}, done);
    }
    burst(g, c = "#e9bc5d", n = 12) {
      if (this.reduced) n = 4;
      const v = new T.Vector3();
      g.getWorldPosition(v);
      for (let i = 0; i < n; i++) {
        const m = this.ball(
          this.root,
          v.x,
          v.y + 0.6,
          v.z,
          0.055,
          0.055,
          0.055,
          c,
        );
        this.effects.push({
          m,
          start: this.t,
          p: m.position.clone(),
          v: new T.Vector3(
            (Math.random() - 0.5) * 2,
            1 + Math.random(),
            (Math.random() - 0.5) * 2,
          ),
        });
      }
    }
    frame(now) {
      requestAnimationFrame(this.frame);
      const dt = Math.min(0.05, (now - this.prev) / 1000);
      this.prev = now;
      if (this.paused) return;
      this.t += dt;
      for (const q of this.tweens.slice()) {
        if (!this.tweens.includes(q)) continue;
        const u = Math.min(1, (this.t - q.start) / q.duration);
        q.update(u);
        if (u >= 1) {
          this.tweens = this.tweens.filter((x) => x !== q);
          q.done?.();
        }
      }
      for (const a of this.actors) {
        if (!a.parent) continue;
        const d = a.userData,
          p = d.parts,
          u = this.t - d.start,
          q = Math.min(1, u / (d.duration || 1)),
          m = q < 1 ? d.mood : "idle",
          amp = this.reduced ? 0.25 : 1;
        a.position.copy(d.home);
        a.rotation.set(0, 0, 0);
        a.scale.setScalar(d.scale);
        a.position.y += Math.sin(this.t * 2 + a.id) * 0.025 * amp;
        p.head.rotation.set(0, 0, 0);
        p.left.rotation.z = -0.3;
        p.right.rotation.z = 0.3;
        p.mouth.scale.y =
          m === "eat" ? 0.04 + Math.abs(Math.sin(u * 16)) * 0.09 : 0.035;
        for (const eye of p.eyes)
          eye.scale.y = this.t % 4 > 3.8 ? 0.014 : 0.085;
        if (m === "happy") {
          a.position.y += Math.abs(Math.sin(u * 7)) * 0.25 * amp;
          p.left.rotation.z = -1;
          p.right.rotation.z = 1;
        }
        if (m === "wave") p.right.rotation.z = 1.1 + Math.sin(u * 10) * 0.4;
        if (m === "curious") p.head.rotation.z = Math.sin(q * Math.PI) * 0.23;
        if (m === "no") {
          p.head.rotation.y = Math.sin(u * 10) * 0.3;
          a.position.z -= Math.sin(q * Math.PI) * 0.35;
          for (const eye of p.eyes) eye.scale.y = 0.045;
        }
        if (m === "eat") {
          a.position.z += Math.sin(q * Math.PI) * 0.25;
          p.left.rotation.z = -0.8;
          p.right.rotation.z = 0.8;
          p.head.rotation.z = Math.sin(u * 16) * 0.05;
        }
        if (m === "cough") {
          p.right.rotation.z = 1.9;
          p.head.rotation.x = Math.sin(u * 15) * 0.12;
        }
      }
      this.effects = this.effects.filter((q) => {
        const u = this.t - q.start;
        if (u > 1.2) {
          q.m.removeFromParent();
          return false;
        }
        q.m.position.copy(q.p).addScaledVector(q.v, u);
        q.m.position.y -= u * u * 1.4;
        q.m.scale.setScalar(0.055 * (1 - u / 1.3));
        return true;
      });
      this.update?.(dt, this.t);
      for (const l of this.labels) {
        if (!l.g.parent) {
          l.el.hidden = true;
          continue;
        }
        const p = this.project(l.g, l.offset);
        l.el.style.left = p.x + "px";
        l.el.style.top = p.y + "px";
      }
      this.renderer.render(this.scene, this.camera);
    }
  }
  window.WorldEngine = WorldEngine;
})();
