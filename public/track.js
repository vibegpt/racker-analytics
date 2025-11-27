/**
 * Racker Analytics - Tracking Script
 *
 * Add this script to your website to track:
 * - Page views from Racker links
 * - Form submissions (conversions)
 *
 * Installation (Squarespace):
 * 1. Go to Settings > Advanced > Code Injection
 * 2. Paste in the Header section:
 *    <script src="https://rackr.co/track.js" data-site="YOUR_SITE_ID"></script>
 */

(function () {
  "use strict";

  // Configuration
  const RACKER_API = "https://rackr.co/api/t";
  const TRACKER_KEY = "rckr";
  const LINK_KEY = "rckr_link";
  const STORAGE_KEY = "rckr_tracker";
  const SESSION_KEY = "rckr_session";

  // Get tracker ID from URL params or localStorage
  function getTrackerId() {
    const urlParams = new URLSearchParams(window.location.search);
    let trackerId = urlParams.get(TRACKER_KEY);

    if (trackerId) {
      // Store for future page views
      try {
        localStorage.setItem(STORAGE_KEY, trackerId);
      } catch (e) {
        // localStorage not available
      }
      return trackerId;
    }

    // Try to get from localStorage
    try {
      trackerId = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      // localStorage not available
    }

    return trackerId;
  }

  // Get link ID from URL params
  function getLinkId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(LINK_KEY);
  }

  // Generate a session ID
  function getSessionId() {
    try {
      let sessionId = sessionStorage.getItem(SESSION_KEY);
      if (!sessionId) {
        sessionId = "sess_" + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem(SESSION_KEY, sessionId);
      }
      return sessionId;
    } catch (e) {
      return null;
    }
  }

  // Simple browser fingerprint
  function getFingerprint() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("Racker", 2, 2);

    const data = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
    ].join("|");

    // Simple hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return "fp_" + Math.abs(hash).toString(36);
  }

  // Send tracking data
  function sendTrack(endpoint, data) {
    const url = RACKER_API + endpoint;

    // Try sendBeacon first (works even on page unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], {
        type: "application/json",
      });
      if (navigator.sendBeacon(url, blob)) {
        return;
      }
    }

    // Fallback to fetch
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch(function () {
      // Silent fail - don't break the site
    });
  }

  // Track page view
  function trackPageView() {
    const trackerId = getTrackerId();
    if (!trackerId) {
      // No tracker - visitor didn't come from a Racker link
      return;
    }

    const data = {
      trackerId: trackerId,
      linkId: getLinkId(),
      sessionId: getSessionId(),
      fingerprint: getFingerprint(),
      pageUrl: window.location.href,
      pageTitle: document.title,
      referrer: document.referrer,
    };

    sendTrack("/pageview", data);
    console.log("[Racker] Page view tracked");
  }

  // Track form submission
  function trackFormSubmission(form, formData) {
    const trackerId = getTrackerId();

    const data = {
      trackerId: trackerId,
      linkId: getLinkId(),
      fingerprint: getFingerprint(),
      formId: form.id || form.getAttribute("data-form-id") || null,
      formName:
        form.getAttribute("name") ||
        form.getAttribute("data-form-name") ||
        form.getAttribute("aria-label") ||
        "Unknown Form",
      pageUrl: window.location.href,
      email: formData.email || formData.EMAIL || null,
      name:
        formData.name ||
        formData.NAME ||
        formData.fname ||
        formData["first-name"] ||
        null,
      phone:
        formData.phone ||
        formData.PHONE ||
        formData.tel ||
        formData.telephone ||
        null,
      metadata: formData,
    };

    sendTrack("/form", data);
    console.log("[Racker] Form submission tracked");
  }

  // Extract form data as object
  function getFormData(form) {
    const data = {};
    const formData = new FormData(form);
    formData.forEach(function (value, key) {
      // Skip sensitive fields
      if (key.toLowerCase().includes("password")) return;
      if (key.toLowerCase().includes("card")) return;
      if (key.toLowerCase().includes("cvv")) return;
      if (key.toLowerCase().includes("ssn")) return;

      data[key] = value;
    });
    return data;
  }

  // Listen for form submissions
  function setupFormTracking() {
    document.addEventListener(
      "submit",
      function (e) {
        const form = e.target;
        if (form.tagName !== "FORM") return;

        // Skip forms marked as no-track
        if (form.hasAttribute("data-racker-ignore")) return;

        const formData = getFormData(form);
        trackFormSubmission(form, formData);
      },
      true
    );

    // Also track Squarespace AJAX forms
    if (window.Squarespace) {
      // Squarespace form submission hook
      const originalSubmit = HTMLFormElement.prototype.submit;
      HTMLFormElement.prototype.submit = function () {
        if (!this.hasAttribute("data-racker-ignore")) {
          const formData = getFormData(this);
          trackFormSubmission(this, formData);
        }
        return originalSubmit.apply(this, arguments);
      };
    }
  }

  // Initialize
  function init() {
    // Track page view on load
    if (document.readyState === "complete") {
      trackPageView();
    } else {
      window.addEventListener("load", trackPageView);
    }

    // Setup form tracking
    setupFormTracking();

    // Expose API for manual tracking
    window.Racker = {
      trackPageView: trackPageView,
      trackForm: function (formElement) {
        const formData = getFormData(formElement);
        trackFormSubmission(formElement, formData);
      },
      trackConversion: function (data) {
        const trackerId = getTrackerId();
        sendTrack("/form", {
          trackerId: trackerId,
          linkId: getLinkId(),
          fingerprint: getFingerprint(),
          pageUrl: window.location.href,
          formName: data.name || "Manual Conversion",
          email: data.email || null,
          metadata: data,
        });
      },
      getTrackerId: getTrackerId,
    };

    console.log("[Racker] Tracking initialized");
  }

  // Run init
  init();
})();
