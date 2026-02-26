/**
 * Glacier Air Inc. — Combined Form Enhancement
 * ===============================================
 * Script 1: Contact Status Card (Step 1)
 * Script 2: Google Places Address Autocomplete (Step 2)
 * Script 3: Service Selection Cards + Routing (Step 3)
 *
 * HL Custom JS/HTML — ONE line:
 *   <script src="https://contractorauthority.github.io/glacier-air/glacier-air-form.js"></script>
 *
 * Form IDs:
 *   Main booking:  p8g10GesfploNIoG5Vhc
 *   Callback form: PceK4fd9Nvkv8XIjec3a
 *
 * Field map (confirmed via DevTools inspection):
 *   first_name     → data-q="first_name"
 *   last_name      → data-q="last_name"
 *   phone          → data-q="phone"
 *   address        → data-q="street_address"  (name="address")
 *   city           → data-q="city"
 *   state          → data-q="state"
 *   postal_code    → data-q="postal_code"
 *   services       → name="7HJCXAup5DPPiLPBvtiS"  (no data-q)
 *   how_can_help   → name="Ze8MgRr6VZjabwguVvPp"   (data-q="how_can_we_help?")
 *
 * Routing:
 *   Path A — Spring AC Tune-Up          → green card → calendar
 *   Path B — Installation/Duct/UV/Plan  → blue card  → calendar
 *   Path C — AC Repair / 24-7 Emergency → red card   → call + callback form
 */

/* ── Load Google Maps dynamically with callback ── */
(function () {
  if (window.google && window.google.maps && window.google.maps.places) return;
  window.__gaGMReady = function () { window.__gaGMLoaded = true; };
  var s = document.createElement("script");
  s.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyAM1jRtR068AC7A5zK90RukGayTsGYxhpg&libraries=places&callback=__gaGMReady";
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
})();


/* ═══════════════════════════════════════════════════════
   SCRIPT 1 — CONTACT STATUS CARD
═══════════════════════════════════════════════════════ */
(function () {

  function byQ(q) {
    return document.querySelector('[data-q="' + q + '"]') ||
           document.querySelector('input[name="' + q + '"]');
  }

  function closestFieldWrap(el) {
    var node = el, i = 0;
    while (node && i < 12) {
      if (node.className && typeof node.className === "string") {
        if (node.className.indexOf("form-group") > -1 ||
            node.className.indexOf("field-container") > -1 ||
            node.className.indexOf("col-") > -1) return node;
      }
      node = node.parentElement;
      i++;
    }
    return el && el.parentElement ? el.parentElement : el;
  }

  function addStylesOnce() {
    if (document.getElementById("ga-contact-styles")) return;
    var css = document.createElement("style");
    css.id = "ga-contact-styles";
    css.innerHTML =
      ".ga-contact-card{margin:0 0 14px;padding:16px 18px;border-radius:12px;font-size:14px;line-height:1.55;text-align:left;border:1px solid rgba(0,0,0,0.07);box-shadow:0 10px 24px rgba(0,0,0,0.06);transition:background .25s,border-color .25s;}" +
      ".ga-contact-card.red{background:rgba(192,57,43,0.07);color:#7a2717;border-color:rgba(192,57,43,0.15);}" +
      ".ga-contact-card.green{background:rgba(30,132,73,0.08);color:#111;border-color:rgba(30,132,73,0.15);}" +
      ".ga-contact-title{font-size:20px;line-height:1.25;font-weight:800;margin:0 0 8px;letter-spacing:-.2px;color:#111;}" +
      ".ga-contact-body{font-size:14px;line-height:1.65;margin:0;color:#333;}" +
      ".ga-link-btn{background:transparent;border:0;padding:0;color:#1B4F72;cursor:pointer;font-weight:700;border-bottom:1px solid rgba(27,79,114,.3);font-size:13px;}" +
      ".ga-link-btn:hover{border-bottom-color:rgba(27,79,114,.6);}" +
      ".ga-contact-helper{opacity:.75;font-size:12px;line-height:1.35;margin-top:3px;}" +
      ".ga-contact-collapsed{display:none !important;}" +
      ".ga-continue-under{margin-top:10px;display:none;}" +
      ".ga-continue-btn{background:transparent;border:0;padding:0;cursor:pointer;font-size:13px;font-weight:700;color:#1B4F72;border-bottom:1px solid rgba(27,79,114,.3);}";
    document.head.appendChild(css);
  }

  function val(el) { return el && el.value ? el.value.replace(/^\s+|\s+$/g, "") : ""; }
  function hasVal(el) { return val(el).length > 0; }
  function digits(s) { return (s || "").replace(/\D+/g, ""); }
  function fmtPhone(raw) {
    var d = digits(raw);
    if (d.length === 11 && d[0] === "1") d = d.substring(1);
    if (d.length < 10) return raw || "";
    return "(" + d.substring(0, 3) + ") " + d.substring(3, 6) + "-" + d.substring(6, 10);
  }

  function initContactStatus() {
    var first = byQ("first_name"), last = byQ("last_name"), phone = byQ("phone");
    if (!first || !last || !phone) return false;
    addStylesOnce();

    var firstWrap = closestFieldWrap(first);
    var lastWrap  = closestFieldWrap(last);
    var phoneWrap = closestFieldWrap(phone);

    // Insert card before first field
    var bar = document.getElementById("ga-contact-card");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "ga-contact-card";
      bar.className = "ga-contact-card red";
      if ((firstWrap || first).parentNode) {
        (firstWrap || first).parentNode.insertBefore(bar, firstWrap || first);
      }
    }

    // Continue-under link (shown when editing after collapse)
    if (!document.getElementById("ga-contact-continue-under") && phoneWrap) {
      var cw = document.createElement("div");
      cw.id = "ga-contact-continue-under";
      cw.className = "ga-continue-under";
      cw.innerHTML = '<button type="button" class="ga-continue-btn" id="ga-contact-continue-btn">✓ Done — continue to address →</button>';
      if (phoneWrap.nextSibling) phoneWrap.parentNode.insertBefore(cw, phoneWrap.nextSibling);
      else phoneWrap.parentNode.appendChild(cw);
    }

    var expandedByUser = false, lastSnap = "", savedTimer = null;

    function collapse() { [firstWrap, lastWrap, phoneWrap].forEach(function (w) { if (w) w.classList.add("ga-contact-collapsed"); }); }
    function expand()   { [firstWrap, lastWrap, phoneWrap].forEach(function (w) { if (w) w.classList.remove("ga-contact-collapsed"); }); }
    function showCont(v) { var el = document.getElementById("ga-contact-continue-under"); if (el) el.style.display = v ? "block" : "none"; }
    function phoneOk() { var d = digits(val(phone)); if (d.length === 11 && d[0] === "1") d = d.substring(1); return d.length >= 10; }
    function allOk() { return hasVal(first) && hasVal(last) && phoneOk(); }
    function snap() { return val(first) + "|" + val(last) + "|" + digits(val(phone)); }
    function missing() {
      var m = [];
      if (!hasVal(first)) m.push("first name");
      if (!hasVal(last)) m.push("last name");
      if (!phoneOk()) m.push("phone number");
      return m.length === 1 ? m[0] : m.length === 2 ? m[0] + " and " + m[1] : m[0] + ", " + m[1] + ", and " + m[2];
    }

    function wireContinue() {
      var btn = document.getElementById("ga-contact-continue-btn");
      if (!btn) return;
      btn.onclick = function () {
        if (!allOk()) return;
        if (savedTimer) clearTimeout(savedTimer);
        expandedByUser = false;
        showCont(false);
        collapse();
        renderGreen(false);
        // Trigger Step 2 visibility check
        window.__gaStep2Check && window.__gaStep2Check();
      };
    }

    function renderGreen(saved) {
      bar.className = "ga-contact-card green";
      bar.innerHTML =
        '<div class="ga-contact-title">👋 Nice to meet you, ' + val(first) + '!</div>' +
        '<div class="ga-contact-body">Your Glacier Air technician will contact you at <b>' + fmtPhone(val(phone)) + '</b> to confirm your appointment window.<br><br>' +
        '<button type="button" class="ga-link-btn" id="ga-change-contact">→ Update contact info</button>' +
        '<div class="ga-contact-helper">(person who will be at the property)</div>' +
        (saved ? '<div style="margin-top:8px;font-size:13px;font-weight:600;color:#1E8449;">✅ Contact updated.</div>' : "") +
        '</div>';
      var btn = document.getElementById("ga-change-contact");
      if (btn) btn.onclick = function () {
        if (savedTimer) clearTimeout(savedTimer);
        expandedByUser = true;
        expand();
        showCont(true);
        wireContinue();
        lastSnap = snap();
        try { first.focus(); } catch (e) {}
      };
    }

    function renderRed() {
      bar.className = "ga-contact-card red";
      showCont(false);
      bar.innerHTML = "📞 <b>Please add your " + missing() + " so your technician can reach you.</b>";
    }

    function update() {
      var ok = allOk(), s = snap(), changed = s !== lastSnap;
      if (!ok) {
        if (savedTimer) clearTimeout(savedTimer);
        expandedByUser = false; expand(); renderRed(); lastSnap = s; return;
      }
      if (expandedByUser) {
        showCont(true); wireContinue();
        if (changed) {
          renderGreen(true);
          if (savedTimer) clearTimeout(savedTimer);
          savedTimer = setTimeout(function () { if (expandedByUser) { renderGreen(false); showCont(true); wireContinue(); } }, 1400);
          lastSnap = s;
        } else renderGreen(false);
        return;
      }
      showCont(false); collapse(); renderGreen(false); lastSnap = s;
      window.__gaStep2Check && window.__gaStep2Check();
    }

    update();
    first.addEventListener("input", update);
    last.addEventListener("input", update);
    phone.addEventListener("input", update);
    return true;
  }

  (function boot() {
    var t = 0;
    (function retry() { t++; if (initContactStatus()) return; if (t < 80) setTimeout(retry, 100); })();
  })();
})();


/* ═══════════════════════════════════════════════════════
   SCRIPT 2 — GOOGLE PLACES ADDRESS AUTOCOMPLETE
═══════════════════════════════════════════════════════ */
(function () {

  function byQ(q) {
    return document.querySelector('[data-q="' + q + '"]') ||
           document.querySelector('input[name="' + q + '"]');
  }

  function closestFieldWrap(el) {
    var node = el, i = 0;
    while (node && i < 12) {
      if (node.className && typeof node.className === "string") {
        if (node.className.indexOf("form-group") > -1 ||
            node.className.indexOf("field-container") > -1 ||
            node.className.indexOf("col-") > -1) return node;
      }
      node = node.parentElement;
      i++;
    }
    return el && el.parentElement ? el.parentElement : el;
  }

  function findInsertWrap(el) {
    var node = el, i = 0;
    while (node && i < 14) {
      if (node.className && typeof node.className === "string") {
        if (node.className.indexOf("form-field-wrapper") > -1) return node;
      }
      node = node.parentElement;
      i++;
    }
    return closestFieldWrap(el);
  }

  function addStylesOnce() {
    if (document.getElementById("ga-address-styles")) return;
    var css = document.createElement("style");
    css.id = "ga-address-styles";
    css.innerHTML =
      "#ga-addr-section{display:none;margin-bottom:14px;}" +
      ".ga-addr-card{padding:16px 18px;border-radius:12px;font-size:14px;line-height:1.5;text-align:left;border:1px solid rgba(0,0,0,.07);box-shadow:0 10px 24px rgba(0,0,0,.06);transition:background .25s,border-color .25s;}" +
      ".ga-addr-card.red{background:rgba(192,57,43,.07);color:#111;border-color:rgba(192,57,43,.14);}" +
      ".ga-addr-card.green{background:rgba(30,132,73,.08);color:#111;border-color:rgba(30,132,73,.15);}" +
      ".ga-addr-title{font-weight:800;margin:0 0 6px;font-size:15px;color:#111;}" +
      ".ga-addr-sub{opacity:.85;margin:0;font-size:13px;line-height:1.45;}" +
      ".ga-addr-confirmed{margin:12px 0 0;padding:10px 12px;border-radius:10px;background:#fff;color:#111;border:1px solid rgba(0,0,0,.10);font-weight:700;font-size:13px;}" +
      ".ga-addr-actions{margin:10px 0 0;display:flex;gap:10px;flex-wrap:wrap;align-items:center;font-size:13px;}" +
      ".ga-addr-btn{display:block;width:100%;margin:12px 0 0;padding:12px 14px;border-radius:12px;border:1px solid rgba(192,57,43,.26);background:rgba(192,57,43,.10);color:#111;font-size:14px;font-weight:800;cursor:pointer;text-align:center;box-shadow:0 8px 20px rgba(0,0,0,.08);transition:background .2s,transform .06s;}" +
      ".ga-addr-btn:hover{background:rgba(192,57,43,.16);transform:translateY(-1px);}" +
      ".ga-link-btn2{background:transparent;border:0;padding:0;color:#1B4F72;cursor:pointer;font-weight:700;border-bottom:1px solid rgba(27,79,114,.3);font-size:13px;}" +
      ".ga-link-btn2:hover{border-bottom-color:rgba(27,79,114,.6);}" +
      "[data-q='street_address']{background:#fff !important;color:#111 !important;}" +
      ".ga-addr-empty{border:2px solid rgba(30,132,73,.4) !important;border-radius:12px !important;}" +
      ".ga-addr-pulse{animation:gaPulse 1.25s ease-in-out infinite;border:2px solid rgba(192,57,43,.45) !important;}" +
      "@keyframes gaPulse{0%{box-shadow:0 0 0 0 rgba(192,57,43,.22);}70%{box-shadow:0 0 0 10px rgba(192,57,43,0);}100%{box-shadow:0 0 0 0 rgba(192,57,43,0);}}" +
      ".ga-addr-collapsed [data-q='street_address']{display:none !important;}" +
      ".ga-addr-collapsed label{display:none !important;}";
    document.head.appendChild(css);
  }

  function hideAddressParts() {
    ["city", "state", "postal_code"].forEach(function (q) {
      var el = byQ(q);
      if (!el) return;
      var wrap = closestFieldWrap(el);
      if (wrap) wrap.style.display = "none";
    });
  }

  function tryEnable(el) {
    try { el.removeAttribute("readonly"); } catch (e) {}
    try { el.removeAttribute("disabled"); } catch (e) {}
  }

  function contactIsGreen() {
    var c = document.getElementById("ga-contact-card");
    return c && c.className.indexOf("green") > -1;
  }

  function initAddressStep() {
    var input = byQ("street_address");
    if (!input) return false;
    addStylesOnce();
    hideAddressParts();
    tryEnable(input);

    var addrWrap = closestFieldWrap(input);
    if (!addrWrap) return false;
    var cardWrap = findInsertWrap(input);

    // Wrap in section div for show/hide control
    if (!document.getElementById("ga-addr-section")) {
      var section = document.createElement("div");
      section.id = "ga-addr-section";
      cardWrap.parentNode.insertBefore(section, cardWrap);
      section.appendChild(cardWrap);
    }

    var section = document.getElementById("ga-addr-section");

    // Build card
    if (!document.getElementById("ga-addr-card")) {
      var card = document.createElement("div");
      card.id = "ga-addr-card";
      card.className = "ga-addr-card red";
      card.innerHTML =
        '<div class="ga-addr-title" id="ga-addr-title"></div>' +
        '<div class="ga-addr-sub" id="ga-addr-sub"></div>' +
        '<button type="button" id="ga-addr-btn" class="ga-addr-btn" style="display:none"></button>' +
        '<div id="ga-addr-confirmed" class="ga-addr-confirmed" style="display:none"></div>' +
        '<div id="ga-addr-actions" class="ga-addr-actions" style="display:none">' +
          '<button type="button" class="ga-link-btn2" id="ga-change-address">Change address</button>' +
        '</div>';
      cardWrap.parentNode.insertBefore(card, cardWrap);
    }

    var confirmed = false;

    // Expose step 2 check so step 1 can trigger it
    window.__gaStep2Check = function () {
      if (contactIsGreen()) {
        section.style.display = "block";
      }
    };

    // Run check immediately in case contact already green on load
    window.__gaStep2Check();

    function fullAddr() {
      var street = (input.value || "").trim();
      var c = byQ("city"), st = byQ("state"), z = byQ("postal_code");
      var parts = [street];
      if (c && c.value.trim()) parts.push(c.value.trim());
      if (st && st.value.trim()) parts.push(st.value.trim());
      if (z && z.value.trim()) parts.push(z.value.trim());
      return parts.filter(Boolean).join(", ");
    }

    function setCard(state, title, sub, btnLabel, showBtn) {
      var card = document.getElementById("ga-addr-card"); if (!card) return;
      card.classList.remove("red", "green"); card.classList.add(state);
      var t = document.getElementById("ga-addr-title");
      var s = document.getElementById("ga-addr-sub");
      var b = document.getElementById("ga-addr-btn");
      var a = document.getElementById("ga-addr-confirmed");
      var ac = document.getElementById("ga-addr-actions");
      if (t) t.innerHTML = title || "";
      if (s) s.innerHTML = sub || "";
      if (b) { if (btnLabel) b.innerHTML = btnLabel; b.style.display = showBtn ? "block" : "none"; }
      if (a) a.style.display = "none";
      if (ac) ac.style.display = "none";
    }

    function showEmpty() {
      confirmed = false;
      addrWrap.classList.remove("ga-addr-collapsed");
      input.classList.remove("ga-addr-pulse");
      input.classList.add("ga-addr-empty");
      setCard("red", "📍 Enter your service address", "Start typing and select your property from the dropdown.", "", false);
    }

    function showNeedsConfirm(prefill) {
      confirmed = false;
      addrWrap.classList.remove("ga-addr-collapsed");
      input.classList.remove("ga-addr-empty");
      input.classList.add("ga-addr-pulse");
      if (prefill) setCard("red", "Confirm your property address", "Your address was pre-filled. Click below to open the Google Maps dropdown and select your property to confirm. 👇", "📍 Open Google Maps dropdown", true);
      else setCard("red", "Select your address from the dropdown", "Choose your property from the dropdown list to confirm.", "", false);
    }

    function showConfirmed() {
      confirmed = true;
      input.classList.remove("ga-addr-pulse", "ga-addr-empty");
      addrWrap.classList.add("ga-addr-collapsed");
      var card = document.getElementById("ga-addr-card"); if (!card) return;
      card.classList.remove("red"); card.classList.add("green");
      var t = document.getElementById("ga-addr-title");
      var s = document.getElementById("ga-addr-sub");
      var b = document.getElementById("ga-addr-btn");
      var a = document.getElementById("ga-addr-confirmed");
      var ac = document.getElementById("ga-addr-actions");
      if (t) t.innerHTML = "👍 Address confirmed";
      if (s) s.innerHTML = "Great — now select your service below.";
      if (b) b.style.display = "none";
      if (a) { a.textContent = fullAddr() || input.value || ""; a.style.display = "block"; }
      if (ac) ac.style.display = "flex";
      // Trigger Step 3
      window.__gaStep3Check && window.__gaStep3Check();
    }

    setTimeout(function () {
      var chg = document.getElementById("ga-change-address");
      if (chg) chg.addEventListener("click", function () {
        confirmed = false;
        addrWrap.classList.remove("ga-addr-collapsed");
        setTimeout(function () { try { input.focus(); } catch (e) {} showNeedsConfirm(false); }, 150);
      });
      var btn = document.getElementById("ga-addr-btn");
      if (btn) btn.addEventListener("click", function () {
        tryEnable(input);
        setTimeout(function () {
          try { input.focus(); } catch (e) {}
          try {
            var v = input.value || "";
            input.value = v + " ";
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.value = v;
            input.dispatchEvent(new Event("input", { bubbles: true }));
          } catch (e2) {}
        }, 120);
      });
    }, 150);

    // Wait for Google Maps
    var gmTries = 0;
    (function waitGM() {
      gmTries++;
      if (window.__gaGMLoaded || (window.google && google.maps && google.maps.places)) {
        var ac = new google.maps.places.Autocomplete(input, { types: ["address"] });
        if (ac.setFields) ac.setFields(["address_component"]);
        ac.addListener("place_changed", function () {
          var place = ac.getPlace();
          if (!place || !place.address_components) return;
          var c = byQ("city"), st = byQ("state"), z = byQ("postal_code"), street = "";
          place.address_components.forEach(function (comp) {
            var type = comp.types && comp.types[0];
            if (type === "street_number") street = comp.short_name;
            else if (type === "route") street = (street ? street + " " : "") + comp.long_name;
            else if (type === "locality" && c) c.value = comp.long_name;
            else if (type === "administrative_area_level_1" && st) st.value = comp.short_name;
            else if (type === "postal_code" && z) z.value = comp.short_name;
          });
          if (street) input.value = street;
          var ev = new Event("input", { bubbles: true });
          input.dispatchEvent(ev);
          if (c) c.dispatchEvent(ev);
          if (st) st.dispatchEvent(ev);
          if (z) z.dispatchEvent(ev);
          showConfirmed();
          setTimeout(function () { var p = document.querySelector(".pac-container"); if (p) p.style.display = "none"; }, 300);
        });
        if (!input.value.trim()) showEmpty();
        else showNeedsConfirm(true);
        return;
      }
      if (gmTries < 80) setTimeout(waitGM, 150);
    })();

    input.addEventListener("focus", function () { tryEnable(input); if (!input.value.trim()) showEmpty(); else if (!confirmed) showNeedsConfirm(false); });
    input.addEventListener("input", function () { tryEnable(input); if (!input.value.trim()) showEmpty(); else if (!confirmed) showNeedsConfirm(false); });

    return true;
  }

  (function boot() {
    hideAddressParts();
    var t = 0;
    (function retry() { t++; if (byQ("street_address") && initAddressStep()) return; if (t < 80) setTimeout(retry, 100); })();
  })();
})();


/* ═══════════════════════════════════════════════════════
   SCRIPT 3 — SERVICE SELECTION CARDS + ROUTING
═══════════════════════════════════════════════════════ */
(function () {

  var SERVICES_NAME = "7HJCXAup5DPPiLPBvtiS";
  var HELP_NAME     = "Ze8MgRr6VZjabwguVvPp";
  var CALLBACK_URL  = "https://api.leadconnectorhq.com/widget/form/PceK4fd9Nvkv8XIjec3a";
  var EMERGENCY_PHONE = "(352) 554-8633";
  var EMERGENCY_TEL   = "tel:3525548633";

  // PATH A — green → calendar
  var PATH_A = ["Spring AC Tune-Up"];
  // PATH B — blue → calendar
  var PATH_B = ["New System Installation", "Duct Cleaning", "UV Light Installation", "HVAC Membership Plan"];
  // PATH C — emergency → call + callback
  var PATH_C = ["AC Repair & Maintenance", "24/7 Emergency Service"];

  var SERVICE_CARDS = [
    { label: "🌿 Spring AC Tune-Up",       value: "Spring AC Tune-Up" },
    { label: "🏠 New System Installation",  value: "New System Installation" },
    { label: "🔧 AC Repair & Maintenance",  value: "AC Repair & Maintenance" },
    { label: "🌀 Duct Cleaning",            value: "Duct Cleaning" },
    { label: "☀️ UV Light Installation",    value: "UV Light Installation" },
    { label: "💳 HVAC Membership Plan",     value: "HVAC Membership Plan" },
    { label: "🚨 24/7 Emergency Service",   value: "24/7 Emergency Service" }
  ];

  function byQ(q) {
    return document.querySelector('[data-q="' + q + '"]') ||
           document.querySelector('input[name="' + q + '"]');
  }
  function byName(n) { return document.querySelector('[name="' + n + '"]'); }
  function closestFieldWrap(el) {
    var node = el, i = 0;
    while (node && i < 12) {
      if (node.className && typeof node.className === "string") {
        if (node.className.indexOf("form-group") > -1 ||
            node.className.indexOf("field-container") > -1 ||
            node.className.indexOf("col-") > -1) return node;
      }
      node = node.parentElement;
      i++;
    }
    return el && el.parentElement ? el.parentElement : el;
  }

  function addStylesOnce() {
    if (document.getElementById("ga-service-styles")) return;
    var css = document.createElement("style");
    css.id = "ga-service-styles";
    css.innerHTML =
      /* Section wrapper */
      "#ga-service-section{display:none;margin-top:14px;}" +

      /* Service cards grid */
      ".ga-service-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;}" +
      "@media(max-width:480px){.ga-service-grid{grid-template-columns:1fr;}}" +
      ".ga-service-card{padding:14px 16px;border-radius:12px;border:2px solid rgba(0,0,0,.10);background:#fff;cursor:pointer;font-size:14px;font-weight:700;color:#111;text-align:left;transition:border-color .18s,background .18s,box-shadow .18s,transform .1s;box-shadow:0 4px 12px rgba(0,0,0,.05);line-height:1.4;}" +
      ".ga-service-card:hover{border-color:#1B4F72;background:rgba(27,79,114,.04);box-shadow:0 8px 20px rgba(0,0,0,.09);transform:translateY(-1px);}" +
      ".ga-service-card.selected-a{border-color:#1E8449;background:rgba(30,132,73,.08);box-shadow:0 8px 20px rgba(30,132,73,.15);}" +
      ".ga-service-card.selected-b{border-color:#1B4F72;background:rgba(27,79,114,.08);box-shadow:0 8px 20px rgba(27,79,114,.15);}" +
      ".ga-service-card.selected-c{border-color:#C0392B;background:rgba(192,57,43,.08);box-shadow:0 8px 20px rgba(192,57,43,.15);}" +

      /* Path confirmation cards */
      ".ga-path-card{margin-bottom:14px;padding:16px 18px;border-radius:12px;font-size:14px;line-height:1.55;border:1px solid rgba(0,0,0,.07);box-shadow:0 10px 24px rgba(0,0,0,.06);}" +
      ".ga-path-card.green{background:rgba(30,132,73,.08);border-color:rgba(30,132,73,.18);color:#111;}" +
      ".ga-path-card.blue{background:rgba(27,79,114,.07);border-color:rgba(27,79,114,.15);color:#111;}" +
      ".ga-path-card.red{background:rgba(192,57,43,.07);border-color:rgba(192,57,43,.15);color:#111;}" +
      ".ga-path-title{font-size:17px;font-weight:800;margin:0 0 6px;}" +
      ".ga-path-sub{font-size:13px;opacity:.85;margin:0;line-height:1.5;}" +

      /* How can we help textarea */
      "#ga-help-section{margin-bottom:14px;}" +
      "#ga-help-section label{display:block;font-size:13px;font-weight:700;color:#333;margin-bottom:6px;}" +
      "#ga-help-textarea{width:100%;min-height:90px;padding:12px 14px;border-radius:12px;border:2px solid rgba(0,0,0,.12);font-size:14px;line-height:1.55;color:#111;background:#fff;resize:vertical;font-family:inherit;box-sizing:border-box;transition:border-color .2s;outline:none;}" +
      "#ga-help-textarea:focus{border-color:#1B4F72;}" +

      /* Submit buttons */
      ".ga-submit-btn{display:block;width:100%;padding:16px 20px;border-radius:12px;border:none;font-size:16px;font-weight:800;cursor:pointer;text-align:center;letter-spacing:.2px;transition:background .2s,transform .1s,box-shadow .2s;margin-bottom:10px;}" +
      ".ga-submit-btn.green{background:#1E8449;color:#fff;box-shadow:0 8px 22px rgba(30,132,73,.35);}" +
      ".ga-submit-btn.green:hover{background:#176339;transform:translateY(-1px);box-shadow:0 12px 28px rgba(30,132,73,.4);}" +
      ".ga-submit-btn.blue{background:#1B4F72;color:#fff;box-shadow:0 8px 22px rgba(27,79,114,.35);}" +
      ".ga-submit-btn.blue:hover{background:#154060;transform:translateY(-1px);box-shadow:0 12px 28px rgba(27,79,114,.4);}" +
      ".ga-submit-btn:active{transform:translateY(0) scale(.99);}" +

      /* Emergency path */
      ".ga-emergency-wrap{text-align:center;margin-bottom:14px;}" +
      ".ga-call-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:20px;border-radius:14px;background:#C0392B;color:#fff;font-size:20px;font-weight:900;text-decoration:none;letter-spacing:.3px;box-shadow:0 10px 28px rgba(192,57,43,.4);animation:gaPulseRed 1.6s ease-in-out infinite;margin-bottom:14px;}" +
      "@keyframes gaPulseRed{0%,100%{box-shadow:0 10px 28px rgba(192,57,43,.4);}50%{box-shadow:0 10px 40px rgba(192,57,43,.65);}}" +
      ".ga-call-btn:hover{background:#a93226;}" +

      /* Callback form */
      ".ga-callback-wrap{padding:18px;border-radius:12px;background:rgba(142,68,173,.06);border:1px solid rgba(142,68,173,.18);box-shadow:0 8px 20px rgba(0,0,0,.06);margin-bottom:14px;}" +
      ".ga-callback-title{font-size:15px;font-weight:800;color:#111;margin:0 0 14px;}" +
      ".ga-callback-field{margin-bottom:10px;}" +
      ".ga-callback-field label{display:block;font-size:12px;font-weight:700;color:#555;margin-bottom:4px;}" +
      ".ga-callback-input{width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid rgba(0,0,0,.14);font-size:14px;color:#111;background:#fff;box-sizing:border-box;font-family:inherit;outline:none;transition:border-color .2s;}" +
      ".ga-callback-input:focus{border-color:#8E44AD;}" +
      ".ga-callback-textarea{width:100%;min-height:75px;padding:10px 12px;border-radius:10px;border:1.5px solid rgba(0,0,0,.14);font-size:14px;color:#111;background:#fff;box-sizing:border-box;resize:vertical;font-family:inherit;outline:none;transition:border-color .2s;}" +
      ".ga-callback-textarea:focus{border-color:#8E44AD;}" +
      ".ga-callback-btn{display:block;width:100%;padding:14px 18px;border-radius:12px;border:none;background:#8E44AD;color:#fff;font-size:15px;font-weight:800;cursor:pointer;text-align:center;box-shadow:0 8px 22px rgba(142,68,173,.35);transition:background .2s,transform .1s;}" +
      ".ga-callback-btn:hover{background:#7d3c98;transform:translateY(-1px);}" +
      ".ga-callback-btn:active{transform:translateY(0);}" +

      /* Success card */
      ".ga-success-card{padding:18px;border-radius:12px;background:rgba(30,132,73,.08);border:1px solid rgba(30,132,73,.18);text-align:center;font-size:15px;font-weight:700;color:#111;box-shadow:0 8px 20px rgba(0,0,0,.06);}";

    document.head.appendChild(css);
  }

  function addrIsGreen() {
    var c = document.getElementById("ga-addr-card");
    return c && c.className.indexOf("green") > -1;
  }

  function getContactVals() {
    var fn = document.querySelector('[data-q="first_name"]') || document.querySelector('input[name="first_name"]');
    var ln = document.querySelector('[data-q="last_name"]')  || document.querySelector('input[name="last_name"]');
    var ph = document.querySelector('[data-q="phone"]')      || document.querySelector('input[name="phone"]');
    return {
      first: fn ? fn.value : "",
      last:  ln ? ln.value : "",
      phone: ph ? ph.value : ""
    };
  }

  function fillNativeField(nameAttr, value) {
    var el = document.querySelector('[name="' + nameAttr + '"]');
    if (!el) return;
    var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value") ||
                       Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");
    if (nativeSetter && nativeSetter.set) {
      nativeSetter.set.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event("input",  { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function submitMainForm(serviceValue, helpValue) {
    // Fill native HL fields
    var fn = document.querySelector('[data-q="first_name"]') || document.querySelector('input[name="first_name"]');
    var ln = document.querySelector('[data-q="last_name"]')  || document.querySelector('input[name="last_name"]');
    var ph = document.querySelector('[data-q="phone"]')      || document.querySelector('input[name="phone"]');
    var addr = byQ("street_address");
    var city = byQ("city"), state = byQ("state"), zip = byQ("postal_code");

    [fn, ln, ph, addr, city, state, zip].forEach(function (el) {
      if (el) {
        el.dispatchEvent(new Event("input",  { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    fillNativeField(SERVICES_NAME, serviceValue);
    fillNativeField(HELP_NAME, helpValue);

    // Find and click the native HL submit button
    setTimeout(function () {
      var submitBtn =
        document.querySelector('button[type="submit"]') ||
        document.querySelector('input[type="submit"]') ||
        document.querySelector('.submit-btn') ||
        document.querySelector('[data-testid="submit"]');
      if (submitBtn) {
        submitBtn.click();
      }
    }, 200);
  }

  function postCallback(data, onSuccess, onError) {
    var formData = new FormData();
    formData.append("first_name", data.first);
    formData.append("last_name",  data.last);
    formData.append("phone",      data.phone);
    formData.append(SERVICES_NAME, data.service);
    formData.append(HELP_NAME,    data.help);

    fetch(CALLBACK_URL, {
      method: "POST",
      body: formData,
      mode: "no-cors"
    }).then(function () {
      onSuccess();
    }).catch(function (e) {
      // no-cors will always resolve, so this is a true network error
      onError(e);
    });
  }

  function renderPathA(container, serviceValue) {
    container.innerHTML =
      '<div class="ga-path-card green">' +
        '<div class="ga-path-title">✅ Great — let\'s get you scheduled for your Spring Tune-Up!</div>' +
        '<div class="ga-path-sub">Pick a time that works for you and your Glacier Air tech will be there ready to go.</div>' +
      '</div>' +
      '<div id="ga-help-section">' +
        '<label for="ga-help-textarea">Anything we should know before we arrive? <span style="font-weight:400;opacity:.7">(optional)</span></label>' +
        '<textarea id="ga-help-textarea" class="" placeholder="e.g. System age, last service date, any issues you\'ve noticed..."></textarea>' +
      '</div>' +
      '<button type="button" class="ga-submit-btn green" id="ga-submit-a">🌿 Book My Spring Tune-Up →</button>';

    document.getElementById("ga-submit-a").onclick = function () {
      var help = document.getElementById("ga-help-textarea");
      submitMainForm(serviceValue, help ? help.value : "");
    };
  }

  function renderPathB(container, serviceValue) {
    container.innerHTML =
      '<div class="ga-path-card blue">' +
        '<div class="ga-path-title">✅ Perfect — let\'s schedule your Pro Consultation</div>' +
        '<div class="ga-path-sub">A Glacier Air comfort advisor will visit your property, assess your needs, and provide honest recommendations.</div>' +
      '</div>' +
      '<div id="ga-help-section">' +
        '<label for="ga-help-textarea">Tell us a bit more so we arrive prepared: <span style="font-weight:400;opacity:.7">(optional)</span></label>' +
        '<textarea id="ga-help-textarea" class="" placeholder="e.g. Current system age, areas of concern, goals for the project..."></textarea>' +
      '</div>' +
      '<button type="button" class="ga-submit-btn blue" id="ga-submit-b">🏠 Book My Pro Consultation →</button>';

    document.getElementById("ga-submit-b").onclick = function () {
      var help = document.getElementById("ga-help-textarea");
      submitMainForm(serviceValue, help ? help.value : "");
    };
  }

  function renderPathC(container, serviceValue) {
    var contact = getContactVals();
    container.innerHTML =
      '<div class="ga-path-card red">' +
        '<div class="ga-path-title">🚨 Don\'t wait — we\'re available 24/7</div>' +
        '<div class="ga-path-sub">For repairs and emergency service, the fastest way to get help is to call us directly right now.</div>' +
      '</div>' +

      '<div class="ga-emergency-wrap">' +
        '<a href="' + EMERGENCY_TEL + '" class="ga-call-btn">📞 ' + EMERGENCY_PHONE + ' — Call Now</a>' +
      '</div>' +

      '<div class="ga-callback-wrap" id="ga-callback-form-wrap">' +
        '<div class="ga-callback-title">☎️ Or request a callback within 5 minutes:</div>' +
        '<div class="ga-callback-field"><label>First Name</label><input type="text" class="ga-callback-input" id="ga-cb-first" value="' + contact.first + '"></div>' +
        '<div class="ga-callback-field"><label>Last Name</label><input type="text" class="ga-callback-input" id="ga-cb-last" value="' + contact.last + '"></div>' +
        '<div class="ga-callback-field"><label>Best Phone Number</label><input type="tel" class="ga-callback-input" id="ga-cb-phone" value="' + contact.phone + '"></div>' +
        '<div class="ga-callback-field"><label>How can we help?</label><textarea class="ga-callback-textarea" id="ga-cb-help" placeholder="Describe what\'s happening with your system..."></textarea></div>' +
        '<button type="button" class="ga-callback-btn" id="ga-callback-submit">☎️ Get a Call Back Within 5 Minutes</button>' +
      '</div>';

    document.getElementById("ga-callback-submit").onclick = function () {
      var btn = document.getElementById("ga-callback-submit");
      btn.disabled = true;
      btn.textContent = "Sending...";

      var data = {
        first:   (document.getElementById("ga-cb-first")  || {}).value || contact.first,
        last:    (document.getElementById("ga-cb-last")   || {}).value || contact.last,
        phone:   (document.getElementById("ga-cb-phone")  || {}).value || contact.phone,
        service: serviceValue,
        help:    (document.getElementById("ga-cb-help")   || {}).value || ""
      };

      postCallback(data,
        function () {
          var wrap = document.getElementById("ga-callback-form-wrap");
          if (wrap) wrap.innerHTML = '<div class="ga-success-card">✅ Got it — someone from Glacier Air will call you within 5 minutes.</div>';
        },
        function () {
          btn.disabled = false;
          btn.textContent = "☎️ Get a Call Back Within 5 Minutes";
          alert("Something went wrong. Please call us directly at " + EMERGENCY_PHONE);
        }
      );
    };
  }

  function initServiceStep() {
    var servicesField = byName(SERVICES_NAME);
    if (!servicesField) return false;

    addStylesOnce();

    // Hide native services field and its wrapper
    var servWrap = closestFieldWrap(servicesField);
    if (servWrap) servWrap.style.display = "none";

    // Also hide native how_can_we_help (we render our own)
    var helpField = byName(HELP_NAME);
    if (helpField) {
      var helpWrap = closestFieldWrap(helpField);
      if (helpWrap) helpWrap.style.display = "none";
    }

    // Build section
    if (!document.getElementById("ga-service-section")) {
      var section = document.createElement("div");
      section.id = "ga-service-section";

      // Service cards grid
      var gridHTML = '<div class="ga-service-grid" id="ga-service-grid">';
      SERVICE_CARDS.forEach(function (svc) {
        gridHTML += '<button type="button" class="ga-service-card" data-value="' + svc.value + '">' + svc.label + '</button>';
      });
      gridHTML += '</div>';

      // Path output container
      var pathHTML = '<div id="ga-path-output"></div>';

      section.innerHTML = gridHTML + pathHTML;

      // Insert after help wrap or services wrap
      var insertAfter = helpWrap || servWrap;
      if (insertAfter && insertAfter.parentNode) {
        if (insertAfter.nextSibling) insertAfter.parentNode.insertBefore(section, insertAfter.nextSibling);
        else insertAfter.parentNode.appendChild(section);
      }
    }

    var section = document.getElementById("ga-service-section");
    var selectedValue = null;

    // Expose step 3 check so step 2 can trigger it
    window.__gaStep3Check = function () {
      if (addrIsGreen()) {
        section.style.display = "block";
        setTimeout(function () {
          try { section.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) {}
        }, 200);
      }
    };

    // Run check in case address already green
    window.__gaStep3Check();

    // Card click handlers
    var grid = document.getElementById("ga-service-grid");
    if (grid) {
      grid.addEventListener("click", function (e) {
        var card = e.target.closest ? e.target.closest(".ga-service-card") : e.target;
        if (!card || !card.classList.contains("ga-service-card")) return;

        selectedValue = card.getAttribute("data-value");

        // Update card selection style
        grid.querySelectorAll(".ga-service-card").forEach(function (c) {
          c.classList.remove("selected-a", "selected-b", "selected-c");
        });

        var pathClass = "selected-b";
        if (PATH_A.indexOf(selectedValue) > -1) pathClass = "selected-a";
        if (PATH_C.indexOf(selectedValue) > -1) pathClass = "selected-c";
        card.classList.add(pathClass);

        // Write value to native HL field
        fillNativeField(SERVICES_NAME, selectedValue);

        // Render path output
        var output = document.getElementById("ga-path-output");
        if (!output) return;
        output.innerHTML = "";

        if (PATH_A.indexOf(selectedValue) > -1) {
          renderPathA(output, selectedValue);
        } else if (PATH_B.indexOf(selectedValue) > -1) {
          renderPathB(output, selectedValue);
        } else if (PATH_C.indexOf(selectedValue) > -1) {
          renderPathC(output, selectedValue);
        }

        // Smooth scroll to path output
        setTimeout(function () {
          try { output.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) {}
        }, 100);
      });
    }

    return true;
  }

  (function boot() {
    var t = 0;
    (function retry() { t++; if (byName(SERVICES_NAME) && initServiceStep()) return; if (t < 80) setTimeout(retry, 100); })();
  })();

})();
