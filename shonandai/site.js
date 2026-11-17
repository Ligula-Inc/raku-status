/* らく 相模大野店
   1. いまの時刻に合うコースを開く  2. 湯の道の写真を切り替える
   3. 各セクションの出現           4. 開業のお知らせフォーム

   ▼ 公開前に設定するもの:受付のメールアドレス(空のままだと送信できません) */
const SIGNUP_TO = "";

(function () {
  "use strict";

  /* ---------- 1. いまの時刻に合うコースを開く ---------- */
  // 営業は 10:00〜翌10:00。終電をなくした人が一番多い 21:00〜翌5:00 は「泊まる」を見せる。
  function bandForHour(h, m) {
    const t = h * 60 + m;
    if (t >= 5 * 60 && t < 8 * 60 + 30) return "b-asa";      // 朝だけ
    if (t >= 8 * 60 + 30 && t < 15 * 60) return "b-hiru";    // 昼に入る
    return "b-tomaru";                                        // 15:00〜翌5:00 は泊まる
  }

  function nowInJapan() {
    const s = new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" });
    return new Date(s);
  }

  const stack = document.querySelector(".stack");
  if (stack) {
    const now = nowInJapan();
    const id = bandForHour(now.getHours(), now.getMinutes());
    const radio = document.getElementById(id);
    if (radio) {
      radio.checked = true;
      const label = stack.querySelector('label[for="' + id + '"]');
      if (label && !label.querySelector(".now-flag")) {
        const flag = document.createElement("span");
        flag.className = "now-flag";
        flag.textContent = "いま";
        label.insertBefore(flag, label.firstChild);
      }
    }
    const head = document.getElementById("stack-head");
    if (head) {
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      head.textContent = "いま " + hh + ":" + mm + "。この時間に来ると、こうなります";
    }
  }

  /* ---------- 1-2. トップのヒーロー:画が順に入れ替わる ---------- */
  const heroShots = document.querySelectorAll(".hero-bg img");
  if (heroShots.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let hi = 0;
    setInterval(function () {
      heroShots[hi].classList.remove("on");
      hi = (hi + 1) % heroShots.length;
      heroShots[hi].classList.add("on");
    }, 6000);
  }

  /* ---------- 2. 湯の道:紙片をさすと、後ろの写真が変わる ---------- */
  const slips = document.querySelectorAll("#michi .slip");
  const shots = document.querySelectorAll("#michi .bgwrap img");

  function showShot(id, slip) {
    shots.forEach(function (img) { img.classList.toggle("on", img.id === id); });
    slips.forEach(function (s) { s.setAttribute("aria-current", s === slip ? "true" : "false"); });
  }

  slips.forEach(function (slip) {
    const id = slip.dataset.bg;
    ["mouseenter", "focus", "click"].forEach(function (ev) {
      slip.addEventListener(ev, function () { showShot(id, slip); });
    });
  });

  /* 触る画面では、見えている紙片に写真を合わせる */
  const slipRow = document.querySelector("#michi .slips");
  if (slipRow && window.matchMedia("(hover: none)").matches) {
    let tick;
    slipRow.addEventListener("scroll", function () {
      clearTimeout(tick);
      tick = setTimeout(function () {
        const mid = slipRow.scrollLeft + slipRow.clientWidth / 2;
        let best = null, bestD = Infinity;
        slips.forEach(function (s) {
          const c = s.offsetLeft + s.offsetWidth / 2;
          const d = Math.abs(c - mid);
          if (d < bestD) { bestD = d; best = s; }
        });
        if (best) showShot(best.dataset.bg, best);
      }, 90);
    }, { passive: true });
  }

  /* ---------- 3. 出現 ---------- */
  // 各セクションの中身に .rise を自動で付ける(テンプレート側に書かないで済むように)
  const RISE = [
    "main > section > .wrap > *", ".band-txt > *", ".band-fig", ".sheet .floor",
    ".newslist li", ".qa", ".group", ".iggrid", ".igsay", ".receipt",
    ".teaser-txt > *", ".mapwrap", ".bars > *", ".coupon > *", ".wide", ".cgfig"
  ];
  RISE.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) { el.classList.add("rise"); });
  });

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const risers = document.querySelectorAll(".rise");

  if (reduce || !("IntersectionObserver" in window)) {
    risers.forEach(function (el) { el.classList.add("in"); });
  } else {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        const el = e.target;
        const sibs = Array.prototype.filter.call(
          el.parentElement ? el.parentElement.children : [],
          function (n) { return n.classList && n.classList.contains("rise"); }
        );
        const i = Math.max(0, sibs.indexOf(el));
        el.style.transitionDelay = Math.min(i * 75, 450) + "ms";
        el.classList.add("in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    risers.forEach(function (el) { io.observe(el); });
  }

  /* ヒーローは読み込んだ時点で順に出す */
  if (!reduce) {
    const hero = document.querySelectorAll(".hero h1, .hero .lede, .hero .act, .hero-cap");
    hero.forEach(function (el, i) {
      el.style.opacity = "0";
      el.style.transform = "translateY(18px)";
      el.style.transition = "opacity .52s cubic-bezier(.2,.6,.2,1) " + (i * 80) + "ms, transform .52s cubic-bezier(.2,.6,.2,1) " + (i * 80) + "ms";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          el.style.opacity = "1";
          el.style.transform = "none";
        });
      });
    });
  }

  /* ---------- 3-2. フッターが見えたら下帯を引っ込める ---------- */
  const dock = document.querySelector(".dock");
  const foot = document.querySelector("footer");
  let footIn = false;
  if (dock && foot && "IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { footIn = e.isIntersecting; if (footIn) dock.classList.remove("show"); });
    }, { rootMargin: "0px" }).observe(foot);
  }
  // 下に読み進めているあいだは引っ込め、上に戻すと出す(本文に重ならないように)
  if (dock) {
    let lastY = window.scrollY, ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        const y = window.scrollY;
        if (footIn || y < 600) dock.classList.remove("show");
        else if (y > lastY + 6) dock.classList.remove("show");
        else if (y < lastY - 6) dock.classList.add("show");
        lastY = y; ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- 4. 開業のお知らせ ---------- */
  const form = document.getElementById("signup");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const d = new FormData(form);
      const name = (d.get("name") || "").toString().trim();
      const mail = (d.get("mail") || "").toString().trim();

      let msg = form.querySelector(".wired");
      if (!msg) {
        msg = document.createElement("p");
        msg.className = "wired";
        msg.setAttribute("role", "status");
        form.appendChild(msg);
      }

      if (!SIGNUP_TO) {
        msg.textContent = "受付の準備中です。開業までに、このフォームからお送りいただけるようにします。";
        return;
      }
      if (!mail) {
        msg.textContent = "メールアドレスをご入力ください。";
        document.getElementById("f-mail").focus();
        return;
      }
      const subject = "開業のお知らせ希望（らく 相模大野店）";
      const body = [
        "お名前：" + name,
        "メールアドレス：" + mail,
        "電話番号：" + (d.get("tel") || ""),
        (d.get("want") || "")
      ].join("\n");
      window.location.href =
        "mailto:" + SIGNUP_TO + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      msg.textContent = "メールソフトが開きます。そのままお送りください。";
    });
  }
})();

/* ── トップのバナー。自動で送る・点で選ぶ・指でなぞる ───────────── */
(function () {
  var root = document.querySelector('[data-carousel]');
  if (!root) return;
  var slides = [].slice.call(root.querySelectorAll('.bn'));
  if (slides.length < 2) return;
  var dots = [].slice.call(root.querySelectorAll('.bn-dot'));
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wait = parseInt(root.getAttribute('data-auto'), 10) || 6000;
  var at = 0, timer = null;

  function show(n) {
    at = (n + slides.length) % slides.length;
    slides.forEach(function (s, i) {
      if (i === at) { s.removeAttribute('hidden'); } else { s.setAttribute('hidden', ''); }
    });
    dots.forEach(function (d, i) { d.classList.toggle('on', i === at); });
  }
  function step(d) { show(at + d); hold(); }
  function tick() { if (!document.hidden) show(at + 1); }
  function hold() {
    if (timer) { clearInterval(timer); timer = null; }
    if (!still) timer = setInterval(tick, wait);
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-step],[data-go]');
    if (!b) return;
    e.preventDefault();
    if (b.hasAttribute('data-go')) { show(parseInt(b.getAttribute('data-go'), 10)); hold(); }
    else { step(parseInt(b.getAttribute('data-step'), 10)); }
  });
  root.addEventListener('mouseenter', function () { if (timer) { clearInterval(timer); timer = null; } });
  root.addEventListener('mouseleave', hold);
  root.addEventListener('focusin', function () { if (timer) { clearInterval(timer); timer = null; } });
  root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) hold(); });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { step(1); } else if (e.key === 'ArrowLeft') { step(-1); }
  });

  var x0 = null, y0 = null;
  root.addEventListener('touchstart', function (e) {
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
  }, { passive: true });
  root.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    x0 = y0 = null;
  }, { passive: true });

  document.addEventListener('visibilitychange', function () { if (!document.hidden) hold(); });
  show(0); hold();
})();

/* ── スマホのメニュー。開いて、押したら閉じる ───────────────── */
(function () {
  var nav = document.querySelector('.sitenav');
  if (!nav) return;
  var btn = nav.querySelector('.burger');
  var links = nav.querySelector('.links');
  if (!btn || !links) return;

  function set(open) {
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    set(!nav.classList.contains('open'));
  });
  links.addEventListener('click', function (e) {
    if (e.target.closest('a')) set(false);
  });
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('open') && !nav.contains(e.target)) set(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') set(false);
  });
  // 幅が広がったら、開いたままにしない
  var mq = window.matchMedia('(min-width:861px)');
  (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(function () {
    if (mq.matches) set(false);
  });
})();

/* 動画を、画面に入ったら音なしで再生する。
   音ありの自動再生はブラウザが止めるので、音はボタンで出す。
   動きを減らす設定の人には、自動で始めない。 */
(function () {
  var vs = document.querySelectorAll('video[data-autoplay]');
  if (!vs.length) return;
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  Array.prototype.forEach.call(vs, function (v) {
    var fig = v.closest('figure') || v.parentNode;
    var btn = fig.querySelector('.film-sound');
    var touched = false;   // 本人が触ったら、こちらで勝手に操作しない

    ['play', 'pause', 'seeking'].forEach(function (ev) {
      v.addEventListener(ev, function (e) { if (e.isTrusted) touched = true; });
    });

    if (btn) {
      btn.hidden = false;
      btn.addEventListener('click', function () {
        v.muted = !v.muted;
        btn.setAttribute('aria-pressed', String(!v.muted));
        btn.textContent = v.muted ? '音を出す' : '音を消す';
        if (v.paused) v.play().catch(function () {});
      });
    }

    if (calm || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (touched) return;
        if (en.isIntersecting) {
          v.play().catch(function () {});   // 止められても何もしない
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { threshold: 0.3 });   // 画面より背の高い動画でも効くように、低めにする
    io.observe(v);
  });
})();
