/**
 * Glacier Air Inc. — Combined Form Enhancement
 * ===============================================
 * Script 1: Contact Status Card (Step 1)
 * Script 2: Google Places Address Autocomplete (Step 2)
 * Script 3: Service Selection Cards + Routing (Step 3)
 *
 * HL Custom JS/HTML — paste into form's Custom JavaScript field:
 *   <script src="https://contractorauthority.github.io/glacier-air/glacier-air-form.js"></script>
 *
 * Works in tandem with glacier-air-page.js on the WordPress page.
 * postMessage events sent to parent:
 *   ga:submit_continue  → parent clicks #schedule-meeting-button
 *   ga:emergency        → parent hides booking widget, shows emergency overlay
 *
 * Field map (confirmed via DevTools):
 *   first_name    data-q="first_name"
 *   last_name     data-q="last_name"
 *   phone         data-q="phone"
 *   address       data-q="street_address"
 *   city          data-q="city"
 *   state         data-q="state"
 *   postal_code   data-q="postal_code"
 *   services      name="7HJCXAup5DPPiLPBvtiS"
 *   how_can_help  name="Ze8MgRr6VZjabwguVvPp"
 */

/* ── Load Google Maps dynamically ── */
(function () {
  if (window.google && window.google.maps && window.google.maps.places) return;
  window.__gaGMReady = function () { window.__gaGMLoaded = true; };
  var s = document.createElement("script");
  s.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyAM1jRtR068AC7A5zK90RukGayTsGYxhpg&libraries=places&callback=__gaGMReady";
  s.async = true; s.defer = true;
  document.head.appendChild(s);
})();

/* ── Shared postMessage helper ── */
function gaSendToParent(type, payload) {
  try {
    window.parent.postMessage({ source: "glacier-air-form", type: type, payload: payload || {} }, "*");
  } catch (e) {}
}

/* ── Shared styles ── */
(function () {
  if (document.getElementById("ga-shared-styles")) return;
  var css = document.createElement("style");
  css.id = "ga-shared-styles";
  css.innerHTML =
    ".ga-step-label{display:inline-flex;align-items:center;gap:7px;margin:0 0 10px;padding:5px 13px 5px 8px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;}" +
    ".ga-step-label.active{background:#1B4F72;color:#fff;}" +
    ".ga-step-label.done{background:rgba(30,132,73,.12);color:#1E8449;border:1px solid rgba(30,132,73,.2);}" +
    ".ga-step-dot{width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;}" +
    ".ga-step-label.active .ga-step-dot{background:rgba(255,255,255,.25);}" +
    ".ga-step-label.done .ga-step-dot{background:#1E8449;color:#fff;}" +
    ".ga-step-section{margin-bottom:4px;}" +
    ".ga-instruction{margin:0 0 12px;padding:11px 14px;border-radius:10px;background:rgba(27,79,114,.05);border:1px solid rgba(27,79,114,.12);font-size:13px;line-height:1.6;color:#1B4F72;font-weight:600;}" +
    ".ga-card{margin:0 0 14px;padding:16px 18px;border-radius:12px;font-size:14px;line-height:1.55;text-align:left;border:1px solid rgba(0,0,0,.07);box-shadow:0 10px 24px rgba(0,0,0,.06);transition:background .25s,border-color .25s;}" +
    ".ga-card.red{background:rgba(192,57,43,.07);color:#111;border-color:rgba(192,57,43,.15);}" +
    ".ga-card.green{background:rgba(30,132,73,.08);color:#111;border-color:rgba(30,132,73,.15);}" +
    ".ga-card.blue{background:rgba(27,79,114,.07);color:#111;border-color:rgba(27,79,114,.15);}" +
    ".ga-card-title{font-size:16px;font-weight:800;margin:0 0 7px;color:#111;}" +
    ".ga-card-body{font-size:14px;line-height:1.65;margin:0;color:#333;}" +
    ".ga-link{background:transparent;border:0;padding:0;color:#1B4F72;cursor:pointer;font-weight:700;border-bottom:1px solid rgba(27,79,114,.3);font-size:13px;}" +
    ".ga-link:hover{border-bottom-color:rgba(27,79,114,.6);}" +
    ".ga-collapsed{display:none !important;}";
  document.head.appendChild(css);
})();


/* ═══════════════════════════════════════════════════════
   SCRIPT 1 — CONTACT STATUS CARD (STEP 1)
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
      node = node.parentElement; i++;
    }
    return el && el.parentElement ? el.parentElement : el;
  }
  function addStylesOnce() {
    if (document.getElementById("ga-contact-styles")) return;
    var css = document.createElement("style");
    css.id = "ga-contact-styles";
    css.innerHTML =
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
    var parent    = (firstWrap || first).parentNode;
    if (!parent) return false;

    /* Step 1 label + instruction */
    if (!document.getElementById("ga-step1-wrap")) {
      var wrap = document.createElement("div");
      wrap.id = "ga-step1-wrap";
      wrap.innerHTML =
        '<div class="ga-step-section">' +
          '<div class="ga-step-label active" id="ga-step1-badge"><span class="ga-step-dot">1</span>Your Contact Info</div>' +
          '<div class="ga-instruction" id="ga-step1-instruction">👇 Enter your name and best phone number below so your technician knows how to reach you.</div>' +
        '</div>';
      parent.insertBefore(wrap, firstWrap || first);
    }

    /* Status card */
    if (!document.getElementById("ga-contact-card")) {
      var bar = document.createElement("div");
      bar.id = "ga-contact-card";
      bar.className = "ga-card red";
      parent.insertBefore(bar, firstWrap || first);
    }

    /* Continue-under link */
    if (!document.getElementById("ga-contact-continue-under") && phoneWrap) {
      var cw = document.createElement("div");
      cw.id = "ga-contact-continue-under";
      cw.className = "ga-continue-under";
      cw.innerHTML = '<button type="button" class="ga-continue-btn" id="ga-contact-continue-btn">✓ Done — continue to address →</button>';
      if (phoneWrap.nextSibling) phoneWrap.parentNode.insertBefore(cw, phoneWrap.nextSibling);
      else phoneWrap.parentNode.appendChild(cw);
    }

    var bar = document.getElementById("ga-contact-card");
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
    function setBadge(state) {
      var b = document.getElementById("ga-step1-badge"); if (!b) return;
      b.className = "ga-step-label " + state;
      b.innerHTML = state === "done"
        ? '<span class="ga-step-dot">✓</span>Contact Info'
        : '<span class="ga-step-dot">1</span>Your Contact Info';
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
        window.__gaStep2Show && window.__gaStep2Show();
      };
    }

    function renderGreen(saved) {
      bar.className = "ga-card green";
      bar.innerHTML =
        '<div class="ga-card-title">👋 Nice to meet you, ' + val(first) + '!</div>' +
        '<div class="ga-card-body">Your Glacier Air technician will contact you at <b>' + fmtPhone(val(phone)) + '</b> to confirm your appointment window.' +
        '<br><br><button type="button" class="ga-link" id="ga-change-contact">→ Update contact info</button>' +
        '<div style="opacity:.7;font-size:12px;margin-top:3px;">(person who will be at the property)</div>' +
        (saved ? '<div style="margin-top:8px;font-size:13px;font-weight:700;color:#1E8449;">✅ Contact updated.</div>' : "") +
        '</div>';
      setBadge("done");
      var ins = document.getElementById("ga-step1-instruction");
      if (ins) ins.style.display = "none";
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
      bar.className = "ga-card red";
      showCont(false);
      bar.innerHTML = '📞 <b>Please add your ' + missing() + '</b> so your technician can reach you.';
      setBadge("active");
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
      window.__gaStep2Show && window.__gaStep2Show();
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
   SCRIPT 2 — GOOGLE PLACES ADDRESS AUTOCOMPLETE (STEP 2)
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
      node = node.parentElement; i++;
    }
    return el && el.parentElement ? el.parentElement : el;
  }
  function findInsertWrap(el) {
    var node = el, i = 0;
    while (node && i < 14) {
      if (node.className && typeof node.className === "string") {
        if (node.className.indexOf("form-field-wrapper") > -1) return node;
      }
      node = node.parentElement; i++;
    }
    return closestFieldWrap(el);
  }
  function addStylesOnce() {
    if (document.getElementById("ga-address-styles")) return;
    var css = document.createElement("style");
    css.id = "ga-address-styles";
    css.innerHTML =
      "#ga-addr-section{display:none;margin-bottom:4px;}" +
      ".ga-addr-confirmed-box{margin:10px 0 0;padding:10px 12px;border-radius:10px;background:#fff;color:#111;border:1px solid rgba(0,0,0,.10);font-weight:700;font-size:13px;}" +
      ".ga-addr-actions{margin:10px 0 0;display:flex;gap:10px;align-items:center;font-size:13px;}" +
      ".ga-addr-open-btn{display:block;width:100%;margin:10px 0 0;padding:11px 14px;border-radius:10px;border:1px solid rgba(192,57,43,.26);background:rgba(192,57,43,.10);color:#111;font-size:14px;font-weight:800;cursor:pointer;text-align:center;transition:background .2s;}" +
      ".ga-addr-open-btn:hover{background:rgba(192,57,43,.18);}" +
      "[data-q='street_address']{background:#fff !important;color:#111 !important;}" +
      ".ga-addr-input-empty{border:2px solid rgba(30,132,73,.5) !important;border-radius:10px !important;}" +
      ".ga-addr-input-pulse{animation:gaAddrPulse 1.3s ease-in-out infinite;border:2px solid rgba(192,57,43,.5) !important;border-radius:10px !important;}" +
      "@keyframes gaAddrPulse{0%{box-shadow:0 0 0 0 rgba(192,57,43,.2);}70%{box-shadow:0 0 0 9px rgba(192,57,43,0);}100%{box-shadow:0 0 0 0 rgba(192,57,43,0);}}" +
      ".ga-addr-collapsed [data-q='street_address']{display:none !important;}" +
      ".ga-addr-collapsed label{display:none !important;}";
    document.head.appendChild(css);
  }
  function hideAddressParts() {
    ["city", "state", "postal_code"].forEach(function (q) {
      var el = byQ(q); if (!el) return;
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

    if (!document.getElementById("ga-addr-section")) {
      var section = document.createElement("div");
      section.id = "ga-addr-section";
      cardWrap.parentNode.insertBefore(section, cardWrap);
      section.appendChild(cardWrap);
    }
    var section = document.getElementById("ga-addr-section");

    /* Step 2 label + instruction + card */
    if (!document.getElementById("ga-step2-wrap")) {
      var stepWrap = document.createElement("div");
      stepWrap.id = "ga-step2-wrap";
      stepWrap.innerHTML =
        '<div class="ga-step-section">' +
          '<div class="ga-step-label active" id="ga-step2-badge"><span class="ga-step-dot">2</span>Your Service Address</div>' +
          '<div class="ga-instruction" id="ga-addr-instruction">👇 Type your street address in the field below — then <strong>select your exact property from the Google dropdown</strong> that appears to confirm it.</div>' +
        '</div>';
      section.insertBefore(stepWrap, cardWrap);
    }

    if (!document.getElementById("ga-addr-card")) {
      var card = document.createElement("div");
      card.id = "ga-addr-card";
      card.className = "ga-card red";
      card.innerHTML =
        '<div id="ga-addr-title" class="ga-card-title">📍 Enter your service address</div>' +
        '<div id="ga-addr-body" class="ga-card-body">Type your street address above, then <strong>tap your property in the Google dropdown</strong> to confirm it.</div>' +
        '<button type="button" id="ga-addr-open-btn" class="ga-addr-open-btn" style="display:none">📍 Tap here to open Google Maps dropdown</button>' +
        '<div id="ga-addr-confirmed-box" class="ga-addr-confirmed-box" style="display:none"></div>' +
        '<div id="ga-addr-actions" class="ga-addr-actions" style="display:none">' +
          '<button type="button" class="ga-link" id="ga-change-address">Change address</button>' +
        '</div>';
      section.insertBefore(card, cardWrap);
    }

    var confirmed = false;

    window.__gaStep2Show = function () {
      if (contactIsGreen()) {
        section.style.display = "block";
        setTimeout(function () {
          try { section.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) {}
        }, 200);
      }
    };
    window.__gaStep2Show();

    function fullAddr() {
      var street = (input.value || "").trim();
      var c = byQ("city"), st = byQ("state"), z = byQ("postal_code");
      var parts = [street];
      if (c && c.value.trim()) parts.push(c.value.trim());
      if (st && st.value.trim()) parts.push(st.value.trim());
      if (z && z.value.trim()) parts.push(z.value.trim());
      return parts.filter(Boolean).join(", ");
    }
    function setBadge(state) {
      var b = document.getElementById("ga-step2-badge"); if (!b) return;
      b.className = "ga-step-label " + state;
      b.innerHTML = state === "done"
        ? '<span class="ga-step-dot">✓</span>Service Address'
        : '<span class="ga-step-dot">2</span>Your Service Address';
    }
    function setCard(state, title, body, showOpenBtn) {
      var card = document.getElementById("ga-addr-card"); if (!card) return;
      card.classList.remove("red", "green"); card.classList.add(state);
      var t = document.getElementById("ga-addr-title"),
          b = document.getElementById("ga-addr-body"),
          ob = document.getElementById("ga-addr-open-btn"),
          cb = document.getElementById("ga-addr-confirmed-box"),
          ac = document.getElementById("ga-addr-actions");
      if (t) t.innerHTML = title;
      if (b) b.innerHTML = body;
      if (ob) ob.style.display = showOpenBtn ? "block" : "none";
      if (cb) cb.style.display = "none";
      if (ac) ac.style.display = "none";
    }

    function showEmpty() {
      confirmed = false;
      addrWrap.classList.remove("ga-addr-collapsed");
      input.classList.remove("ga-addr-input-pulse");
      input.classList.add("ga-addr-input-empty");
      setCard("red",
        "📍 Step 2 — Enter your service address",
        "👇 Start typing your street address in the field below, then <strong>select your property from the Google dropdown</strong> to confirm.",
        false);
      setBadge("active");
    }
    function showNeedsConfirm(prefill) {
      confirmed = false;
      addrWrap.classList.remove("ga-addr-collapsed");
      input.classList.remove("ga-addr-input-empty");
      input.classList.add("ga-addr-input-pulse");
      if (prefill) {
        setCard("red",
          "⚠️ One more step — confirm your address",
          "Tap the button below to open the Google dropdown, then <strong>select your exact property</strong> from the list to confirm.",
          true);
      } else {
        setCard("red",
          "⚠️ Select your property from the dropdown to confirm",
          "👆 Choose your <strong>exact property</strong> from the Google dropdown list that appeared above.",
          false);
      }
      setBadge("active");
    }
    function showConfirmed() {
      confirmed = true;
      input.classList.remove("ga-addr-input-pulse", "ga-addr-input-empty");
      addrWrap.classList.add("ga-addr-collapsed");
      var card = document.getElementById("ga-addr-card"); if (!card) return;
      card.classList.remove("red"); card.classList.add("green");
      var t  = document.getElementById("ga-addr-title"),
          b  = document.getElementById("ga-addr-body"),
          ob = document.getElementById("ga-addr-open-btn"),
          cb = document.getElementById("ga-addr-confirmed-box"),
          ac = document.getElementById("ga-addr-actions"),
          ins = document.getElementById("ga-addr-instruction");
      if (t) t.innerHTML = "👍 Address confirmed";
      if (b) b.innerHTML = "Now select your service below to continue.";
      if (ob) ob.style.display = "none";
      if (cb) { cb.textContent = fullAddr() || input.value || ""; cb.style.display = "block"; }
      if (ac) ac.style.display = "flex";
      if (ins) ins.style.display = "none";
      setBadge("done");
      window.__gaStep3Show && window.__gaStep3Show();
    }

    setTimeout(function () {
      var chg = document.getElementById("ga-change-address");
      if (chg) chg.addEventListener("click", function () {
        confirmed = false;
        addrWrap.classList.remove("ga-addr-collapsed");
        setTimeout(function () { try { input.focus(); } catch (e) {} showNeedsConfirm(false); }, 150);
      });
      var openBtn = document.getElementById("ga-addr-open-btn");
      if (openBtn) openBtn.addEventListener("click", function () {
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
   SCRIPT 3 — SERVICE SELECTION CARDS + ROUTING (STEP 3)
═══════════════════════════════════════════════════════ */
(function () {

  var SERVICES_NAME   = "7HJCXAup5DPPiLPBvtiS";
  var HELP_NAME       = "Ze8MgRr6VZjabwguVvPp";

  var PATH_A = ["Spring AC Tune-Up"];
  var PATH_B = ["New System Installation", "Duct Cleaning", "UV Light Installation", "HVAC Membership Plan"];
  var PATH_C = ["AC Repair & Maintenance", "24/7 Emergency Service"];

  var SERVICE_CARDS = [
    { label: "🌿 Spring AC Tune-Up",      value: "Spring AC Tune-Up",      path: "a" },
    { label: "🏠 New System Installation", value: "New System Installation", path: "b" },
    { label: "🔧 AC Repair & Maintenance", value: "AC Repair & Maintenance", path: "c" },
    { label: "🌀 Duct Cleaning",           value: "Duct Cleaning",           path: "b" },
    { label: "☀️ UV Light Installation",   value: "UV Light Installation",   path: "b" },
    { label: "💳 HVAC Membership Plan",    value: "HVAC Membership Plan",    path: "b" },
    { label: "🚨 24/7 Emergency Service",  value: "24/7 Emergency Service",  path: "c" }
  ];

  function byName(n) { return document.querySelector('[name="' + n + '"]'); }
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
      node = node.parentElement; i++;
    }
    return el && el.parentElement ? el.parentElement : el;
  }

  function addStylesOnce() {
    if (document.getElementById("ga-service-styles")) return;
    var css = document.createElement("style");
    css.id = "ga-service-styles";
    css.innerHTML =
      "#ga-service-section{display:none;margin-top:4px;}" +
      ".ga-svc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;}" +
      "@media(max-width:480px){.ga-svc-grid{grid-template-columns:1fr;}}" +
      ".ga-svc-card{padding:14px 16px;border-radius:12px;border:2px solid rgba(0,0,0,.10);background:#fff;cursor:pointer;font-size:14px;font-weight:700;color:#111;text-align:left;transition:all .18s;box-shadow:0 4px 12px rgba(0,0,0,.05);line-height:1.4;}" +
      ".ga-svc-card:hover{border-color:#1B4F72;background:rgba(27,79,114,.04);box-shadow:0 8px 20px rgba(0,0,0,.09);transform:translateY(-1px);}" +
      ".ga-svc-card.sel-a{border-color:#1E8449 !important;background:rgba(30,132,73,.08) !important;}" +
      ".ga-svc-card.sel-b{border-color:#1B4F72 !important;background:rgba(27,79,114,.08) !important;}" +
      ".ga-svc-card.sel-c{border-color:#C0392B !important;background:rgba(192,57,43,.08) !important;}" +
      "#ga-path-output{margin-top:4px;}" +
      ".ga-help-wrap{margin-bottom:14px;}" +
      ".ga-help-wrap label{display:block;font-size:13px;font-weight:700;color:#333;margin-bottom:6px;}" +
      ".ga-help-textarea{width:100%;min-height:90px;padding:12px 14px;border-radius:12px;border:2px solid rgba(0,0,0,.12);font-size:14px;line-height:1.55;color:#111;background:#fff;resize:vertical;font-family:inherit;box-sizing:border-box;outline:none;transition:border-color .2s;}" +
      ".ga-help-textarea:focus{border-color:#1B4F72;}" +
      ".ga-submit-btn{display:block;width:100%;padding:17px 20px;border-radius:12px;border:none;font-size:16px;font-weight:800;cursor:pointer;text-align:center;letter-spacing:.2px;transition:all .2s;margin-bottom:10px;}" +
      ".ga-submit-btn.green{background:#1E8449;color:#fff;box-shadow:0 8px 22px rgba(30,132,73,.35);}" +
      ".ga-submit-btn.green:hover{background:#176339;transform:translateY(-1px);}" +
      ".ga-submit-btn.blue{background:#1B4F72;color:#fff;box-shadow:0 8px 22px rgba(27,79,114,.35);}" +
      ".ga-submit-btn.blue:hover{background:#154060;transform:translateY(-1px);}" +
      ".ga-submit-btn:active{transform:scale(.99);}";
    document.head.appendChild(css);
  }

  function addrIsGreen() {
    var c = document.getElementById("ga-addr-card");
    return c && c.className.indexOf("green") > -1;
  }

  function fillNativeField(nameAttr, value) {
    var el = document.querySelector('[name="' + nameAttr + '"]');
    if (!el) return;
    try {
      var proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      var setter = Object.getOwnPropertyDescriptor(proto, "value");
      if (setter && setter.set) setter.set.call(el, value);
      else el.value = value;
    } catch (e) { el.value = value; }
    el.dispatchEvent(new Event("input",  { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function triggerContinue(serviceValue, helpValue) {
    fillNativeField(SERVICES_NAME, serviceValue);
    fillNativeField(HELP_NAME, helpValue);
    ["first_name", "last_name", "phone", "street_address", "city", "state", "postal_code"].forEach(function (q) {
      var el = byQ(q); if (!el) return;
      el.dispatchEvent(new Event("input",  { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    setTimeout(function () {
      gaSendToParent("ga:submit_continue", { service: serviceValue });
    }, 300);
  }

  function getContactVals() {
    var fn = byQ("first_name"), ln = byQ("last_name"), ph = byQ("phone");
    return { first: fn ? fn.value : "", last: ln ? ln.value : "", phone: ph ? ph.value : "" };
  }

  function renderPathA(container, serviceValue) {
    container.innerHTML =
      '<div class="ga-card green" style="margin-bottom:14px;">' +
        '<div class="ga-card-title">✅ Great — let\'s schedule your Spring Tune-Up!</div>' +
        '<div class="ga-card-body">Pick a time that works for you and your Glacier Air tech will arrive ready to go.</div>' +
      '</div>' +
      '<div class="ga-help-wrap">' +
        '<label>Anything we should know before we arrive? <span style="font-weight:400;opacity:.7">(optional)</span></label>' +
        '<textarea class="ga-help-textarea" id="ga-help-txt" placeholder="e.g. System age, last service date, any issues noticed..."></textarea>' +
      '</div>' +
      '<button type="button" class="ga-submit-btn green" id="ga-submit-btn">🌿 Book My Spring Tune-Up — Select a Date & Time →</button>';
    document.getElementById("ga-submit-btn").onclick = function () {
      var h = document.getElementById("ga-help-txt");
      triggerContinue(serviceValue, h ? h.value : "");
    };
  }

  function renderPathB(container, serviceValue) {
    container.innerHTML =
      '<div class="ga-card blue" style="margin-bottom:14px;">' +
        '<div class="ga-card-title">✅ Perfect — let\'s schedule your Pro Consultation</div>' +
        '<div class="ga-card-body">A Glacier Air comfort advisor will visit your property, assess your needs, and provide honest recommendations.</div>' +
      '</div>' +
      '<div class="ga-help-wrap">' +
        '<label>Tell us a bit more so we arrive prepared: <span style="font-weight:400;opacity:.7">(optional)</span></label>' +
        '<textarea class="ga-help-textarea" id="ga-help-txt" placeholder="e.g. Current system age, areas of concern, goals for the project..."></textarea>' +
      '</div>' +
      '<button type="button" class="ga-submit-btn blue" id="ga-submit-btn">🏠 Book My Pro Consultation — Select a Date & Time →</button>';
    document.getElementById("ga-submit-btn").onclick = function () {
      var h = document.getElementById("ga-help-txt");
      triggerContinue(serviceValue, h ? h.value : "");
    };
  }

  function renderPathC(container, serviceValue) {
    gaSendToParent("ga:emergency", {
      service:  serviceValue,
      contact:  getContactVals()
    });
    container.innerHTML =
      '<div class="ga-card red">' +
        '<div class="ga-card-title">🚨 Connecting you with Glacier Air now...</div>' +
        '<div class="ga-card-body">For repairs and emergency service, we\'re routing you to our team right away.</div>' +
      '</div>';
  }

  function initServiceStep() {
    var servicesField = byName(SERVICES_NAME);
    if (!servicesField) return false;
    addStylesOnce();

    var servWrap = closestFieldWrap(servicesField);
    if (servWrap) servWrap.style.display = "none";
    var helpField = byName(HELP_NAME);
    if (helpField) {
      var helpWrap = closestFieldWrap(helpField);
      if (helpWrap) helpWrap.style.display = "none";
    }

    if (!document.getElementById("ga-service-section")) {
      var section = document.createElement("div");
      section.id = "ga-service-section";

      var gridHTML = '<div class="ga-svc-grid" id="ga-svc-grid">';
      SERVICE_CARDS.forEach(function (svc) {
        gridHTML += '<button type="button" class="ga-svc-card" data-value="' + svc.value + '" data-path="' + svc.path + '">' + svc.label + '</button>';
      });
      gridHTML += '</div>';

      section.innerHTML =
        '<div class="ga-step-section">' +
          '<div class="ga-step-label active" id="ga-step3-badge"><span class="ga-step-dot">3</span>Select Your Service</div>' +
          '<div class="ga-instruction">👇 Tap the service below that best describes what you need — we\'ll guide you from there.</div>' +
        '</div>' +
        gridHTML +
        '<div id="ga-path-output"></div>';

      var insertAfter = helpWrap || servWrap;
      if (insertAfter && insertAfter.parentNode) {
        if (insertAfter.nextSibling) insertAfter.parentNode.insertBefore(section, insertAfter.nextSibling);
        else insertAfter.parentNode.appendChild(section);
      }
    }

    var section = document.getElementById("ga-service-section");

    window.__gaStep3Show = function () {
      if (addrIsGreen()) {
        section.style.display = "block";
        setTimeout(function () {
          try { section.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) {}
        }, 200);
      }
    };
    window.__gaStep3Show();

    var grid = document.getElementById("ga-svc-grid");
    if (grid) {
      grid.addEventListener("click", function (e) {
        var card = e.target;
        while (card && !card.classList.contains("ga-svc-card")) card = card.parentElement;
        if (!card) return;

        var val  = card.getAttribute("data-value");
        var path = card.getAttribute("data-path");

        grid.querySelectorAll(".ga-svc-card").forEach(function (c) {
          c.classList.remove("sel-a", "sel-b", "sel-c");
        });
        card.classList.add("sel-" + path);
        fillNativeField(SERVICES_NAME, val);

        var output = document.getElementById("ga-path-output");
        if (!output) return;
        output.innerHTML = "";

        if (PATH_A.indexOf(val) > -1) renderPathA(output, val);
        else if (PATH_B.indexOf(val) > -1) renderPathB(output, val);
        else if (PATH_C.indexOf(val) > -1) renderPathC(output, val);

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
