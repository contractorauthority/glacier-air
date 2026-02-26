/**
 * Glacier Air — WordPress Page Controller
 * =========================================
 * Listens for postMessage events from glacier-air-form.js (inside HL form iframe)
 * and controls the outer booking widget on the WordPress page.
 *
 * HOW TO INSTALL:
 * Add this as a WPCode JavaScript snippet on the Glacier Air booking page only.
 * Set location to: "Site Wide Footer" or use WPCode's "Page-Specific" targeting
 * to limit it to only the booking page.
 *
 * postMessage events handled:
 *   ga:submit_continue  → clicks #schedule-meeting-button to advance to date/time
 *   ga:emergency        → hides booking widget, shows fullscreen emergency overlay
 *
 * Booking widget DOM (confirmed via DevTools):
 *   Continue button:    #schedule-meeting-button  (.btn.btn-schedule)
 *   Widget wrapper:     #appointment-widgets-booking--revamp
 */

(function () {
  "use strict";

  var EMERGENCY_PHONE     = "(352) 554-8633";
  var EMERGENCY_TEL       = "tel:3525548633";
  var CALLBACK_FORM_URL   = "https://api.leadconnectorhq.com/widget/form/PceK4fd9Nvkv8XIjec3a";
  var CALLBACK_SERVICES   = "7HJCXAup5DPPiLPBvtiS";
  var CALLBACK_HELP       = "Ze8MgRr6VZjabwguVvPp";

  /* ── Inject styles ── */
  function injectStyles() {
    if (document.getElementById("ga-page-styles")) return;
    var css = document.createElement("style");
    css.id = "ga-page-styles";
    css.innerHTML =
      /* Fullscreen emergency overlay */
      "#ga-emergency-overlay{" +
        "display:none;" +
        "position:fixed;" +
        "top:0;left:0;width:100%;height:100%;" +
        "background:#fff;" +
        "z-index:99999;" +
        "overflow-y:auto;" +
        "-webkit-overflow-scrolling:touch;" +
      "}" +
      "#ga-emergency-inner{" +
        "max-width:560px;" +
        "margin:0 auto;" +
        "padding:32px 20px 60px;" +
        "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" +
      "}" +
      /* Header */
      ".ga-ov-header{text-align:center;margin-bottom:28px;}" +
      ".ga-ov-badge{display:inline-block;padding:6px 16px;border-radius:20px;background:#C0392B;color:#fff;font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:12px;}" +
      ".ga-ov-title{font-size:26px;font-weight:900;color:#111;margin:0 0 10px;line-height:1.25;}" +
      ".ga-ov-sub{font-size:15px;color:#555;line-height:1.6;margin:0;}" +
      /* Call button */
      ".ga-ov-call-btn{" +
        "display:flex;align-items:center;justify-content:center;gap:12px;" +
        "width:100%;padding:22px 20px;" +
        "border-radius:14px;" +
        "background:#C0392B;" +
        "color:#fff;" +
        "font-size:22px;font-weight:900;" +
        "text-decoration:none;" +
        "letter-spacing:.2px;" +
        "box-shadow:0 12px 32px rgba(192,57,43,.4);" +
        "animation:gaCallPulse 1.7s ease-in-out infinite;" +
        "margin-bottom:24px;" +
      "}" +
      ".ga-ov-call-btn:hover{background:#a93226;}" +
      "@keyframes gaCallPulse{" +
        "0%,100%{box-shadow:0 12px 32px rgba(192,57,43,.4);}" +
        "50%{box-shadow:0 12px 48px rgba(192,57,43,.65);}" +
      "}" +
      /* Divider */
      ".ga-ov-divider{display:flex;align-items:center;gap:14px;margin:0 0 24px;}" +
      ".ga-ov-divider-line{flex:1;height:1px;background:rgba(0,0,0,.10);}" +
      ".ga-ov-divider-text{font-size:13px;font-weight:700;color:#999;white-space:nowrap;}" +
      /* Callback card */
      ".ga-ov-callback{" +
        "padding:24px;" +
        "border-radius:14px;" +
        "background:rgba(142,68,173,.06);" +
        "border:1px solid rgba(142,68,173,.18);" +
        "box-shadow:0 8px 24px rgba(0,0,0,.06);" +
      "}" +
      ".ga-ov-callback-title{font-size:16px;font-weight:800;color:#111;margin:0 0 18px;}" +
      ".ga-ov-field{margin-bottom:12px;}" +
      ".ga-ov-field label{display:block;font-size:12px;font-weight:700;color:#555;margin-bottom:5px;letter-spacing:.2px;text-transform:uppercase;}" +
      ".ga-ov-input{" +
        "width:100%;padding:12px 14px;" +
        "border-radius:10px;" +
        "border:1.5px solid rgba(0,0,0,.14);" +
        "font-size:15px;color:#111;background:#fff;" +
        "box-sizing:border-box;font-family:inherit;" +
        "outline:none;transition:border-color .2s;" +
      "}" +
      ".ga-ov-input:focus{border-color:#8E44AD;}" +
      ".ga-ov-textarea{" +
        "width:100%;min-height:90px;padding:12px 14px;" +
        "border-radius:10px;" +
        "border:1.5px solid rgba(0,0,0,.14);" +
        "font-size:15px;color:#111;background:#fff;" +
        "box-sizing:border-box;resize:vertical;" +
        "font-family:inherit;outline:none;transition:border-color .2s;" +
      "}" +
      ".ga-ov-textarea:focus{border-color:#8E44AD;}" +
      ".ga-ov-callback-btn{" +
        "display:block;width:100%;padding:16px 20px;" +
        "border-radius:12px;border:none;" +
        "background:#8E44AD;color:#fff;" +
        "font-size:16px;font-weight:800;" +
        "cursor:pointer;text-align:center;" +
        "box-shadow:0 8px 22px rgba(142,68,173,.35);" +
        "transition:all .2s;margin-top:4px;" +
      "}" +
      ".ga-ov-callback-btn:hover{background:#7d3c98;transform:translateY(-1px);}" +
      ".ga-ov-callback-btn:active{transform:scale(.99);}" +
      ".ga-ov-callback-btn:disabled{opacity:.6;cursor:not-allowed;transform:none;}" +
      /* Success */
      ".ga-ov-success{" +
        "text-align:center;padding:28px 20px;" +
        "border-radius:14px;" +
        "background:rgba(30,132,73,.08);" +
        "border:1px solid rgba(30,132,73,.18);" +
      "}" +
      ".ga-ov-success-icon{font-size:48px;margin-bottom:12px;}" +
      ".ga-ov-success-title{font-size:20px;font-weight:800;color:#111;margin:0 0 8px;}" +
      ".ga-ov-success-body{font-size:15px;color:#333;line-height:1.6;margin:0;}";
    document.head.appendChild(css);
  }

  /* ── Build emergency overlay DOM ── */
  function buildOverlay(contact, serviceValue) {
    if (document.getElementById("ga-emergency-overlay")) {
      document.getElementById("ga-emergency-overlay").style.display = "block";
      document.body.style.overflow = "hidden";
      return;
    }

    var first = (contact && contact.first) || "";
    var last  = (contact && contact.last)  || "";
    var phone = (contact && contact.phone) || "";

    var overlay = document.createElement("div");
    overlay.id = "ga-emergency-overlay";
    overlay.innerHTML =
      '<div id="ga-emergency-inner">' +
        '<div class="ga-ov-header">' +
          '<div class="ga-ov-badge">🚨 Emergency & Repair Service</div>' +
          '<h2 class="ga-ov-title">Don\'t wait — we\'re available 24/7</h2>' +
          '<p class="ga-ov-sub">For repairs and emergency service, the fastest way to get help is to call us directly right now.</p>' +
        '</div>' +

        '<a href="' + EMERGENCY_TEL + '" class="ga-ov-call-btn">📞 ' + EMERGENCY_PHONE + ' — Call Now</a>' +

        '<div class="ga-ov-divider">' +
          '<div class="ga-ov-divider-line"></div>' +
          '<div class="ga-ov-divider-text">Or request a callback</div>' +
          '<div class="ga-ov-divider-line"></div>' +
        '</div>' +

        '<div class="ga-ov-callback" id="ga-ov-callback-wrap">' +
          '<div class="ga-ov-callback-title">☎️ Get a call back within 5 minutes</div>' +
          '<div class="ga-ov-field"><label>First Name</label><input type="text" class="ga-ov-input" id="ga-ov-first" value="' + first + '"></div>' +
          '<div class="ga-ov-field"><label>Last Name</label><input type="text" class="ga-ov-input" id="ga-ov-last" value="' + last + '"></div>' +
          '<div class="ga-ov-field"><label>Best Phone Number</label><input type="tel" class="ga-ov-input" id="ga-ov-phone" value="' + phone + '"></div>' +
          '<div class="ga-ov-field"><label>How can we help?</label><textarea class="ga-ov-textarea" id="ga-ov-help" placeholder="Describe what\'s happening with your system..."></textarea></div>' +
          '<button type="button" class="ga-ov-callback-btn" id="ga-ov-callback-submit">☎️ Get a Call Back Within 5 Minutes</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    overlay.style.display = "block";
    document.body.style.overflow = "hidden";

    /* Callback submit handler */
    document.getElementById("ga-ov-callback-submit").addEventListener("click", function () {
      var btn = document.getElementById("ga-ov-callback-submit");
      btn.disabled = true;
      btn.textContent = "Sending...";

      var formData = new FormData();
      formData.append("first_name", (document.getElementById("ga-ov-first")  || {}).value || first);
      formData.append("last_name",  (document.getElementById("ga-ov-last")   || {}).value || last);
      formData.append("phone",      (document.getElementById("ga-ov-phone")  || {}).value || phone);
      formData.append(CALLBACK_SERVICES, serviceValue || "");
      formData.append(CALLBACK_HELP,    (document.getElementById("ga-ov-help") || {}).value || "");

      fetch(CALLBACK_FORM_URL, { method: "POST", body: formData, mode: "no-cors" })
        .then(function () {
          var wrap = document.getElementById("ga-ov-callback-wrap");
          if (wrap) wrap.innerHTML =
            '<div class="ga-ov-success">' +
              '<div class="ga-ov-success-icon">✅</div>' +
              '<div class="ga-ov-success-title">Got it — we\'ll call you within 5 minutes</div>' +
              '<div class="ga-ov-success-body">A Glacier Air team member will reach out to ' +
                ((document.getElementById("ga-ov-first") || {}).value || first) +
                ' at ' + ((document.getElementById("ga-ov-phone") || {}).value || phone) + ' shortly.' +
              '</div>' +
            '</div>';
          document.body.style.overflow = "";
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = "☎️ Get a Call Back Within 5 Minutes";
          alert("Something went wrong. Please call us directly at " + EMERGENCY_PHONE);
        });
    });
  }

  /* ── Handle ga:submit_continue ── */
  function handleSubmitContinue() {
    var tries = 0;
    (function attempt() {
      tries++;
      var btn = document.getElementById("schedule-meeting-button");
      if (btn) {
        btn.click();
        return;
      }
      /* Fallback: try .btn-schedule */
      btn = document.querySelector(".btn-schedule") || document.querySelector(".btn.btn-schedule");
      if (btn) { btn.click(); return; }
      if (tries < 20) setTimeout(attempt, 150);
    })();
  }

  /* ── Handle ga:emergency ── */
  function handleEmergency(payload) {
    injectStyles();

    /* Hide the booking widget */
    var widget =
      document.getElementById("appointment-widgets-booking--revamp") ||
      document.querySelector(".appointment_widgets--revamp--booking") ||
      document.querySelector("[class*='calendar-S3gioprernCmFCHsq31t']");

    if (widget) {
      widget.style.display = "none";
    } else {
      /* Fallback: hide the iframe embed */
      var iframes = document.querySelectorAll("iframe");
      iframes.forEach(function (f) {
        if ((f.src || "").indexOf("S3gioprernCmFCHsq31t") > -1 ||
            (f.id  || "").indexOf("S3gioprernCmFCHsq31t") > -1) {
          f.style.display = "none";
        }
      });
    }

    buildOverlay(payload && payload.contact, payload && payload.service);
  }

  /* ── Message listener ── */
  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.source !== "glacier-air-form") return;

    if (data.type === "ga:submit_continue") {
      handleSubmitContinue();
    } else if (data.type === "ga:emergency") {
      handleEmergency(data.payload);
    }
  });

})();
