(function () {
  "use strict";

  /* Prices and labels taken from /workspace/sudgreeek/index.html builder:
     size 80g / 120g, base Plain (69 / 89) and Biscoff (89 / 119),
     toppings with data-price as listed on the shop page. */
  var BASES = [
    { id: "plain-80", type: "base", flavor: "plain", size: "80g", name: "Plain 80g", nameTh: "เพลน", price: 69, img: "img/plain.jpg" },
    { id: "plain-120", type: "base", flavor: "plain", size: "120g", name: "Plain 120g", nameTh: "เพลน", price: 89, img: "img/plain.jpg" },
    { id: "biscoff-80", type: "base", flavor: "biscoff", size: "80g", name: "Biscoff 80g", nameTh: "บิสกิต", price: 89, img: "img/biscoff.jpg" },
    { id: "biscoff-120", type: "base", flavor: "biscoff", size: "120g", name: "Biscoff 120g", nameTh: "บิสกิต", price: 119, img: "img/biscoff.jpg" }
  ];

  var TOPPINGS = [
    { id: "strawberry", type: "topping", name: "Strawberry", nameTh: "สตรอว์เบอร์รี่", price: 30, img: "img/strawberry.jpg", art: "strawberry", emoji: "🍓" },
    { id: "blueberry", type: "topping", name: "Blueberry", nameTh: "บลูเบอร์รี่", price: 20, img: "img/blueberry.jpg", art: "blueberry", emoji: "🫐" },
    { id: "banana", type: "topping", name: "Banana", nameTh: "กล้วย", price: 10, img: "img/banana.jpg", art: "banana", emoji: "🍌" },
    { id: "shinemuscat", type: "topping", name: "Shine Muscat", nameTh: "ไชน์มัสคัต", price: 20, img: "img/shinemuscat.jpg", art: "shinemuscat", emoji: "🍇" },
    { id: "kiwi", type: "topping", name: "Kiwi", nameTh: "กีวี่", price: 20, img: null, art: "kiwi", emoji: "🥝" },
    { id: "honey", type: "topping", name: "Honey", nameTh: "น้ำผึ้ง", price: 10, img: null, art: "honey", emoji: "🍯" },
    { id: "oreo", type: "topping", name: "Oreo", nameTh: "โอรีโอ", price: 10, img: null, art: "oreo", emoji: "🍪" },
    { id: "cornflakes", type: "topping", name: "Cornflakes", nameTh: "คอร์นเฟลก", price: 10, img: null, art: "cornflakes", emoji: "🥣" },
    { id: "mixnuts", type: "topping", name: "Mix Nuts", nameTh: "มิกซ์นัท", price: 20, img: null, art: "mixnuts", emoji: "🥜" },
    { id: "biscoff-topping", type: "topping", name: "Biscoff", nameTh: "บิสกิต", price: 20, img: null, art: "biscoff", emoji: "🍪" }
  ];

  var ALL = BASES.concat(TOPPINGS);
  var BY_ID = {};
  ALL.forEach(function (item) { BY_ID[item.id] = item; });

  var els = {
    listBase: document.getElementById("list-base"),
    listTopping: document.getElementById("list-topping"),
    menuScroll: document.getElementById("menu-scroll"),
    tabs: Array.prototype.slice.call(document.querySelectorAll(".cat")),
    hint: document.getElementById("hint"),
    heldChip: document.getElementById("held-chip"),
    bowl: document.getElementById("bowl"),
    cupWell: document.getElementById("cup-well"),
    yogurt: document.getElementById("yogurt"),
    toppingLayer: document.getElementById("topping-layer"),
    emptyMsg: document.getElementById("empty-msg"),
    emptySub: document.getElementById("empty-sub"),
    sizePill: document.getElementById("size-pill"),
    lines: document.getElementById("lines"),
    receiptEmpty: document.getElementById("receipt-empty"),
    total: document.getElementById("total"),
    confirm: document.getElementById("confirm"),
    reset: document.getElementById("reset"),
    modal: document.getElementById("modal"),
    modalLines: document.getElementById("modal-lines"),
    modalTotal: document.getElementById("modal-total"),
    modalReset: document.getElementById("modal-reset"),
    modalClose: document.getElementById("modal-close"),
    toast: document.getElementById("toast"),
    cursor: document.getElementById("cursor"),
    cursorItem: document.getElementById("cursor-item"),
    flyLayer: document.getElementById("fly-layer")
  };

  var state = {
    held: null,
    base: null,
    toppings: [],
    busy: false
  };
  var toastTimer = 0;
  var finePointer = false;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, root) { return (root || document).querySelector(sel); }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function money(n) {
    return "฿" + Number(n).toLocaleString("en-US");
  }

  function totalPrice() {
    var n = state.base ? state.base.price : 0;
    state.toppings.forEach(function (t) { n += t.price; });
    return n;
  }

  function artEl(item, tag) {
    var node = document.createElement(tag || "div");
    node.className = "art art-" + item.art;
    node.textContent = item.emoji;
    node.setAttribute("aria-hidden", "true");
    return node;
  }

  function thumbHTML(item) {
    if (item.img) {
      return '<span class="item-photo"><img src="' + esc(item.img) + '" alt="" width="1080" height="1080"></span>';
    }
    return '<span class="item-art">' +
      '<span class="art art-' + esc(item.art) + '">' + esc(item.emoji) + "</span></span>";
  }

  function fillThumb(target, item) {
    target.innerHTML = "";
    if (item.type === "base" && item.img) {
      var img = document.createElement("img");
      img.src = item.img;
      img.alt = "";
      target.appendChild(img);
    } else if (item.art) {
      target.appendChild(artEl(item));
    } else if (item.img) {
      var photo = document.createElement("img");
      photo.src = item.img;
      photo.alt = "";
      target.appendChild(photo);
    } else {
      target.appendChild(artEl(item));
    }
  }

  function renderMenu() {
    els.listBase.innerHTML = BASES.map(function (item) {
      return '<button type="button" class="item" data-id="' + esc(item.id) + '">' +
        thumbHTML(item) +
        '<span class="item-copy"><span class="item-name">' + esc(item.name) + "</span>" +
        '<span class="item-meta">' + esc(item.nameTh) + " · " + esc(item.size) + "</span></span>" +
        '<span class="price">' + money(item.price) + "</span></button>";
    }).join("");
    els.listTopping.innerHTML = TOPPINGS.map(function (item) {
      return '<button type="button" class="item" data-id="' + esc(item.id) + '">' +
        thumbHTML(item) +
        '<span class="item-copy"><span class="item-name">' + esc(item.name) + "</span>" +
        '<span class="item-meta">' + esc(item.nameTh) + "</span></span>" +
        '<span class="price">+' + money(item.price) + "</span></button>";
    }).join("");
  }

  function isNarrow() {
    return window.innerWidth <= 900;
  }

  function hintText() {
    if (state.held) {
      var verb = isNarrow() ? "แตะที่ถ้วยเพื่อใส่" : "คลิกที่ถ้วยเพื่อใส่";
      return "กำลังถือ " + state.held.name + " — " + verb;
    }
    if (isNarrow()) return "แตะเมนู แล้วแตะที่ถ้วยเพื่อใส่";
    return "เลือกเมนู แล้วคลิกที่ถ้วยเพื่อใส่";
  }

  function updateHints() {
    els.hint.textContent = hintText();
    if (els.emptySub) els.emptySub.textContent = isNarrow() ? "แตะที่นี่" : "คลิกที่นี่";
    if (state.held) {
      els.heldChip.hidden = false;
      els.heldChip.textContent = "ถืออยู่: " + state.held.name;
    } else {
      els.heldChip.hidden = true;
    }
    els.bowl.classList.toggle("ready", !!state.held && !state.busy);
    syncItemClasses();
    updateCursorItem();
  }

  function syncItemClasses() {
    Array.prototype.forEach.call(document.querySelectorAll(".item"), function (btn) {
      var id = btn.getAttribute("data-id");
      btn.classList.toggle("held", !!(state.held && state.held.id === id));
      var inBowl = (state.base && state.base.id === id) ||
        state.toppings.some(function (t) { return t.id === id; });
      btn.classList.toggle("in-bowl", inBowl);
    });
  }

  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.classList.remove("show"); }, 1800);
  }

  function toppingSlots(n) {
    if (n <= 0) return [];
    if (n === 1) return [{ x: 50, y: 44, s: 38 }];
    if (n === 2) return [{ x: 35, y: 44, s: 32 }, { x: 66, y: 48, s: 32 }];
    if (n === 3) return [{ x: 50, y: 32, s: 30 }, { x: 32, y: 58, s: 30 }, { x: 68, y: 58, s: 30 }];
    var arr = [];
    var r = n > 6 ? 26 : 28;
    var s = n > 6 ? 24 : 26;
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + (i * 2 * Math.PI / n);
      arr.push({ x: 50 + r * Math.cos(a), y: 48 + r * Math.sin(a), s: s });
    }
    return arr;
  }

  function layoutToppings(animate) {
    var slots = toppingSlots(state.toppings.length);
    var nodes = els.toppingLayer.children;
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var pos = slots[i];
      if (!pos) continue;
      if (!animate || reduceMotion) node.style.transition = "none";
      else node.style.transition = "left 0.4s ease, top 0.4s ease, width 0.4s ease, height 0.4s ease, transform 0.45s cubic-bezier(.2,1.15,.3,1), opacity 0.3s ease";
      node.style.left = pos.x + "%";
      node.style.top = pos.y + "%";
      if (pos.s) {
        node.style.width = pos.s + "%";
        node.style.height = pos.s + "%";
      }
    }
  }

  function renderBowl(opts) {
    opts = opts || {};
    var yogurt = els.yogurt;
    if (state.base) {
      yogurt.hidden = false;
      yogurt.className = "yogurt " + state.base.flavor + " size-" + (state.base.size === "80g" ? "80" : "120");
      if (opts.instant || reduceMotion) {
        yogurt.classList.add("in");
        yogurt.style.transition = "none";
      } else if (!yogurt.classList.contains("in")) {
        yogurt.style.transition = "transform 0.55s cubic-bezier(.2,1.15,.3,1), opacity 0.35s ease, width 0.4s ease, height 0.4s ease";
        requestAnimationFrame(function () { yogurt.classList.add("in"); });
      }
      els.cupWell.classList.add("has-base");
      els.sizePill.hidden = false;
      els.sizePill.textContent = state.base.size;
    } else {
      yogurt.classList.remove("in");
      yogurt.hidden = true;
      yogurt.className = "yogurt";
      els.cupWell.classList.remove("has-base");
      els.sizePill.hidden = true;
    }

    var existing = {};
    Array.prototype.forEach.call(els.toppingLayer.children, function (node) {
      existing[node.getAttribute("data-id")] = node;
    });
    els.toppingLayer.innerHTML = "";
    state.toppings.forEach(function (item) {
      var slot = document.createElement("div");
      slot.className = "top-slot";
      slot.setAttribute("data-id", item.id);
      slot.appendChild(artEl(item));
      if (existing[item.id] && existing[item.id].classList.contains("in")) slot.classList.add("in");
      els.toppingLayer.appendChild(slot);
    });
    layoutToppings(!opts.instant);
    if (opts.instant || reduceMotion) {
      Array.prototype.forEach.call(els.toppingLayer.children, function (node) {
        node.classList.add("in");
        node.style.transition = "none";
      });
    }
  }

  function renderReceipt() {
    var items = [];
    if (state.base) items.push(state.base);
    items = items.concat(state.toppings);
    els.receiptEmpty.hidden = items.length !== 0;
    els.lines.innerHTML = items.map(function (item) {
      var price = item.type === "topping" ? "+" + money(item.price) : money(item.price);
      var meta = item.type === "base" ? item.nameTh + " · " + item.size : item.nameTh;
      return "<li><span><span class=\"line-name\">" + esc(item.name) + "</span>" +
        "<span class=\"line-meta\">" + esc(meta) + "</span></span>" +
        "<span class=\"line-price\">" + price + "</span>" +
        "<button type=\"button\" class=\"text-btn\" data-remove=\"" + esc(item.id) + "\">ลบ</button></li>";
    }).join("");
    els.total.textContent = money(totalPrice());
    els.confirm.disabled = !state.base;
    syncItemClasses();
  }

  function hold(item) {
    if (state.busy) return;
    if (state.held && state.held.id === item.id) {
      state.held = null;
    } else {
      state.held = item;
    }
    updateHints();
  }

  function ghostContent(item) {
    if (item.type === "base" && item.img) {
      var img = document.createElement("img");
      img.src = item.img;
      img.alt = "";
      return img;
    }
    if (item.art) return artEl(item);
    if (item.img) {
      var photo = document.createElement("img");
      photo.src = item.img;
      photo.alt = "";
      return photo;
    }
    return artEl(item);
  }

  function flyFromTo(fromRect, toRect, item, done) {
    if (reduceMotion) {
      done();
      return;
    }
    var ghost = document.createElement("div");
    ghost.className = "ghost";
    ghost.style.left = fromRect.left + "px";
    ghost.style.top = fromRect.top + "px";
    ghost.style.width = fromRect.width + "px";
    ghost.style.height = fromRect.height + "px";
    ghost.style.borderRadius = Math.min(fromRect.width, fromRect.height) * 0.25 + "px";
    ghost.appendChild(ghostContent(item));
    els.flyLayer.appendChild(ghost);
    var started = ghost.getBoundingClientRect();
    void started.width;
    requestAnimationFrame(function () {
      ghost.style.transition = "left 0.55s cubic-bezier(.2,.8,.2,1), top 0.55s cubic-bezier(.2,.8,.2,1), width 0.55s cubic-bezier(.2,.8,.2,1), height 0.55s cubic-bezier(.2,.8,.2,1), border-radius 0.55s cubic-bezier(.2,.8,.2,1), transform 0.55s cubic-bezier(.2,.8,.2,1)";
      ghost.style.left = toRect.left + "px";
      ghost.style.top = toRect.top + "px";
      ghost.style.width = toRect.width + "px";
      ghost.style.height = toRect.height + "px";
      ghost.style.borderRadius = "50%";
    });
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
      done();
    }
    ghost.addEventListener("transitionend", finish);
    setTimeout(finish, 700);
  }

  function sourceRect() {
    if (state.held) {
      var btn = document.querySelector('.item[data-id="' + state.held.id + '"]');
      if (btn) {
        var photo = btn.querySelector(".item-photo, .item-art") || btn;
        return photo.getBoundingClientRect();
      }
    }
    var c = els.cursor.getBoundingClientRect();
    if (c.width) return c;
    return els.bowl.getBoundingClientRect();
  }

  function yogurtTargetRect() {
    var well = els.cupWell.getBoundingClientRect();
    var inset = state.base && state.base.size === "80g" ? 0.09 : 0;
    var size = well.width * (1 - inset * 2);
    return {
      left: well.left + (well.width - size) / 2,
      top: well.top + (well.height - size) / 2,
      width: size,
      height: size
    };
  }

  function slotTargetRect(index, count) {
    var well = els.cupWell.getBoundingClientRect();
    var pos = toppingSlots(count)[index];
    var size = well.width * ((pos && pos.s ? pos.s : 30) / 100);
    return {
      left: well.left + (pos.x / 100) * well.width - size / 2,
      top: well.top + (pos.y / 100) * well.height - size / 2,
      width: size,
      height: size
    };
  }

  function revealNewTopping(id) {
    var node = els.toppingLayer.querySelector('[data-id="' + id + '"]');
    if (!node) return;
    layoutToppings(true);
    requestAnimationFrame(function () { node.classList.add("in"); });
  }

  function dropHeld() {
    if (state.busy || !state.held) return;
    var item = state.held;

    if (item.type === "topping" && !state.base) {
      toast("เลือกเนื้อกรีกใส่ถ้วยก่อนนะ");
      return;
    }
    if (item.type === "topping" && state.toppings.some(function (t) { return t.id === item.id; })) {
      toast("มีท็อปปิ้งนี้อยู่ในถ้วยแล้ว");
      return;
    }

    state.busy = true;
    var from = sourceRect();

    if (item.type === "base") {
      var replacing = state.base && state.base.id !== item.id;
      state.base = item;
      var to = yogurtTargetRect();
      flyFromTo(from, to, item, function () {
        renderBowl();
        renderReceipt();
        els.bowl.classList.add("drop-pulse");
        setTimeout(function () { els.bowl.classList.remove("drop-pulse"); }, 450);
        state.held = null;
        state.busy = false;
        updateHints();
        if (replacing) toast("เปลี่ยนเป็น " + item.name + " แล้ว");
      });
      return;
    }

    var nextCount = state.toppings.length + 1;
    var to = slotTargetRect(state.toppings.length, nextCount);
    flyFromTo(from, to, item, function () {
      state.toppings.push(item);
      renderBowl();
      revealNewTopping(item.id);
      renderReceipt();
      els.bowl.classList.add("drop-pulse");
      setTimeout(function () { els.bowl.classList.remove("drop-pulse"); }, 450);
      state.held = null;
      state.busy = false;
      updateHints();
    });
  }

  function removeItem(id) {
    if (state.base && state.base.id === id) state.base = null;
    state.toppings = state.toppings.filter(function (t) { return t.id !== id; });
    renderBowl({ instant: true });
    Array.prototype.forEach.call(els.toppingLayer.children, function (node) {
      node.classList.add("in");
    });
    renderReceipt();
    updateHints();
  }

  function resetAll() {
    state.held = null;
    state.base = null;
    state.toppings = [];
    state.busy = false;
    renderBowl({ instant: true });
    renderReceipt();
    updateHints();
    closeModal();
  }

  function openModal() {
    if (!state.base) return;
    var items = [state.base].concat(state.toppings);
    els.modalLines.innerHTML = items.map(function (item) {
      var price = item.type === "topping" ? "+" + money(item.price) : money(item.price);
      return "<li><span>" + esc(item.name) + "</span><span>" + price + "</span></li>";
    }).join("");
    els.modalTotal.textContent = money(totalPrice());
    els.modal.hidden = false;
    els.modalClose.focus();
  }

  function closeModal() {
    els.modal.hidden = true;
  }

  /* Category tabs + scroll spy */
  function scrollToSection(id) {
    var section = document.getElementById(id);
    if (!section) return;
    var top = section.offsetTop - 6;
    els.menuScroll.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function setActiveTab(id) {
    els.tabs.forEach(function (tab) {
      var on = tab.getAttribute("data-target") === id;
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function onMenuScroll() {
    var topping = document.getElementById("cat-topping");
    var start = topping.offsetTop - 48;
    setActiveTab(els.menuScroll.scrollTop >= start ? "cat-topping" : "cat-base");
  }

  /* Custom cursor — desktop with a fine pointer only */
  function setupCursor() {
    var query = window.matchMedia("(hover: hover) and (pointer: fine)");
    function apply(on) {
      finePointer = on;
      if (on) {
        document.body.classList.add("custom-cursor");
        els.cursor.hidden = false;
      } else {
        document.body.classList.remove("custom-cursor");
        els.cursor.hidden = true;
      }
      updateHints();
    }
    apply(query.matches);
    if (query.addEventListener) query.addEventListener("change", function (e) { apply(e.matches); });
    else if (query.addListener) query.addListener(function (e) { apply(e.matches); });

    els.cursor.style.opacity = "0";
    document.addEventListener("mousemove", function (e) {
      if (!finePointer) return;
      els.cursor.style.left = e.clientX + "px";
      els.cursor.style.top = e.clientY + "px";
      els.cursor.style.opacity = "1";
    });
    document.addEventListener("mouseleave", function () {
      if (finePointer) els.cursor.style.opacity = "0";
    });
  }

  function updateCursorItem() {
    els.cursor.classList.toggle("holding", !!(finePointer && state.held));
    if (state.held) fillThumb(els.cursorItem, state.held);
    else els.cursorItem.innerHTML = "";
  }

  function onMenuClick(e) {
    var btn = e.target.closest(".item");
    if (!btn) return;
    var item = BY_ID[btn.getAttribute("data-id")];
    if (item) hold(item);
  }

  function applyShot() {
    try {
      var params = new URLSearchParams(location.search);
      var shot = params.get("shot");
      if (shot !== "filled" && shot !== "confirm") return;
      state.base = BY_ID["plain-120"];
      state.toppings = [BY_ID.strawberry];
      state.held = null;
      renderBowl({ instant: true });
      renderReceipt();
      updateHints();
      if (shot === "confirm") openModal();
    } catch (err) {}
  }

  /* Events */
  els.listBase.addEventListener("click", onMenuClick);
  els.listTopping.addEventListener("click", onMenuClick);

  els.bowl.addEventListener("click", function () { dropHeld(); });
  els.bowl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      dropHeld();
    }
  });

  els.lines.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-remove]");
    if (!btn) return;
    removeItem(btn.getAttribute("data-remove"));
  });

  els.confirm.addEventListener("click", function () {
    if (!state.base) {
      toast("เลือกขนาดและเนื้อกรีกก่อน");
      return;
    }
    openModal();
  });
  els.reset.addEventListener("click", resetAll);
  els.modalReset.addEventListener("click", resetAll);
  els.modalClose.addEventListener("click", closeModal);
  els.modal.addEventListener("click", function (e) {
    if (e.target === els.modal) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (!els.modal.hidden) closeModal();
      else if (state.held) {
        state.held = null;
        updateHints();
      }
    }
  });

  els.tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var id = tab.getAttribute("data-target");
      setActiveTab(id);
      scrollToSection(id);
    });
  });
  els.menuScroll.addEventListener("scroll", onMenuScroll, { passive: true });

  renderMenu();
  setupCursor();
  renderBowl({ instant: true });
  renderReceipt();
  updateHints();
  applyShot();
})();
