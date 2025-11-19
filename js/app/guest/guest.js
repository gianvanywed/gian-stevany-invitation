import { video } from "./video.js";
import { image } from "./image.js";
import { audio } from "./audio.js";
import { progress } from "./progress.js";
import { util } from "../../common/util.js";
import { bs } from "../../libs/bootstrap.js";
import { loader } from "../../libs/loader.js";
import { theme } from "../../common/theme.js";
import { lang } from "../../common/language.js";
import { storage } from "../../common/storage.js";
import { session } from "../../common/session.js";
import { offline } from "../../common/offline.js";
import { comment } from "../components/comment.js";
// import * as confetti from "../../libs/confetti.js";
import { pool } from "../../connection/request.js";

const API_URL =
  "https://script.google.com/macros/s/AKfycbxoGkZN0td_5UqgJjl1A_d-Od4RKfqEx6GOIqO7LD_psMdT068Wtczj_skswrtljJWuWA/exec";

export const guest = (() => {
  /**
   * @type {ReturnType<typeof storage>|null}
   */
  let information = null;

  /**
   * @type {ReturnType<typeof storage>|null}
   */
  let config = null;

  /**
   * @returns {void}
   */
  const countDownDate = () => {
    const count = new Date(
      document.body.getAttribute("data-time").replace(" ", "T")
    ).getTime();

    /**
     * @param {number} num
     * @returns {string}
     */
    const pad = (num) => (num < 10 ? `0${num}` : `${num}`);

    const day = document.getElementById("day");
    const hour = document.getElementById("hour");
    const minute = document.getElementById("minute");
    const second = document.getElementById("second");

    const updateCountdown = () => {
      const distance = Math.abs(count - Date.now());

      day.textContent = pad(Math.floor(distance / (1000 * 60 * 60 * 24)));
      hour.textContent = pad(
        Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      );
      minute.textContent = pad(
        Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      );
      second.textContent = pad(Math.floor((distance % (1000 * 60)) / 1000));

      util.timeOut(updateCountdown, 1000 - (Date.now() % 1000));
    };

    util.timeOut(updateCountdown);
  };

  const getGuestName = () => {
    const params = new URLSearchParams(window.location.search);
    // Assuming the guest name is passed via ?to=GuestName
    console.log(params.get("to"));
    return params.get("to")
      ? decodeURIComponent(params.get("to")).trim()
      : "Unknown Guest";
  };

  // Function to safely extract the UUID/token from the URL query parameter 'uuid'
  const getGuestUuid = () => {
    const params = new URLSearchParams(window.location.search);
    // Assuming the UUID is passed via &uuid=YOUR_TOKEN
    console.log(params.get("authToken"));
    return params.get("authToken")
      ? decodeURIComponent(params.get("authToken")).trim()
      : null;
  };

  /**
   * Helper function to display an error message and disable the invitation container.
   */
  const displayError = (message) => {
    // const errorContainer = document.getElementById(ERROR_CONTAINER_ID);
    // const invitationContent = document.getElementById(INVITATION_CONTAINER_ID);

    // if (errorContainer) {
    //     errorContainer.textContent = message;
    //     errorContainer.style.display = 'block';
    // }
    // if (invitationContent) {
    //     invitationContent.style.display = 'none'; // Ensure the actual invitation is hidden
    // }
    console.log(message);
  };

  /**
   * Show the spinner icon and hide the envelope icon
   * @param {HTMLButtonElement} button
   * @returns {void}
   */
  const showSpinner = (button) => {
    const envelope = button.querySelector(".fa-envelope-open");
    const spinner = button.querySelector(".fa-circle-notch");
    if (envelope) {
      envelope.classList.add("d-none");
    }
    if (spinner) {
      spinner.classList.remove("d-none");
    }
  };

  /**
   * Show the envelope icon and hide the spinner icon
   * @param {HTMLButtonElement} button
   * @returns {void}
   */
  const showEnvelope = (button) => {
    const envelope = button.querySelector(".fa-envelope-open");
    const spinner = button.querySelector(".fa-circle-notch");
    if (envelope) {
      envelope.classList.remove("d-none");
    }
    if (spinner) {
      spinner.classList.add("d-none");
    }
  };

  // --- Note: The sendAttendanceUpdate function is omitted for brevity but is also in guest.js ---

  // Expose functions globally so they can be called by HTML buttons
  // window.checkGuestExistence = checkGuestExistence;

  /**
   * @returns {void}
   */
  const showGuestName = () => {
    /**
     * Make sure "to=" is the last query string.
     * Ex. ulems.my.id/?id=some-uuid-here&to=name
     */
    const raw = window.location.search.split("to=");
    let name = null;

    if (raw.length > 1 && raw[1].length >= 1) {
      name = window.decodeURIComponent(raw[1]);
    }

    if (name) {
      const guestName = document.getElementById("guest-name");
      const div = document.createElement("div");
      div.classList.add("m-2");

      const template = `<small class="mt-0 mb-1 mx-0 p-0">${util.escapeHtml(
        guestName?.getAttribute("data-message")
      )}</small><p class="m-0 p-0" style="font-size: 1.25rem; font-family: 'Josefin Sans';">${util.escapeHtml(
        name
      )}</p>`;
      util.safeInnerHTML(div, template);

      guestName?.appendChild(div);
    }

    document.getElementById("form-name").value = getGuestName();

    const form = document.getElementById("form-name");
    if (form) {
      form.value = information.get("name") ?? name;
    }
  };

  /**
   * @returns {Promise<void>}
   */
  const slide = async () => {
    const interval = 6000;
    const slides = document.querySelectorAll(".slide-desktop");

    if (!slides || slides.length === 0) {
      return;
    }

    const desktopEl = document
      .getElementById("root")
      ?.querySelector(".d-sm-block");
    if (!desktopEl) {
      return;
    }

    desktopEl.dispatchEvent(new Event("undangan.slide.stop"));

    if (window.getComputedStyle(desktopEl).display === "none") {
      return;
    }

    if (slides.length === 1) {
      await util.changeOpacity(slides[0], true);
      return;
    }

    let index = 0;
    for (const [i, s] of slides.entries()) {
      if (i === index) {
        s.classList.add("slide-desktop-active");
        await util.changeOpacity(s, true);
        break;
      }
    }

    let run = true;
    const nextSlide = async () => {
      await util.changeOpacity(slides[index], false);
      slides[index].classList.remove("slide-desktop-active");

      index = (index + 1) % slides.length;

      if (run) {
        slides[index].classList.add("slide-desktop-active");
        await util.changeOpacity(slides[index], true);
      }

      return run;
    };

    desktopEl.addEventListener("undangan.slide.stop", () => {
      run = false;
    });

    const loop = async () => {
      if (await nextSlide()) {
        util.timeOut(loop, interval);
      }
    };

    util.timeOut(loop, interval);
  };

  const personalizeInvitationView = (invitationType) => {
    console.log("INVITATION TYPE: ", invitationType);
    const receptionDiv = document.getElementById("reception-details");
    // If invitationType is '1' (HM Only), hide the reception section.
    // We treat null/empty/1 as HM Only.
    if (receptionDiv && (invitationType === "1" || !invitationType)) {
      receptionDiv.style.display = "none";
      console.log("Showing Holy Matrimony only.");
    } else {
      if (receptionDiv) {
        receptionDiv.style.display = "block";
      }
      console.log("Showing both Holy Matrimony and Reception.");
    }
  };

  const populatePaxOptions = (maxPax) => {
    const selectElement = document.getElementById("form-total-pax");
    if (!selectElement) {
      return;
    }

    // Clear previous dynamic options (keep the default placeholder)
    while (selectElement.options.length > 1) {
      selectElement.remove(1);
    }

    const validMaxPax = parseInt(maxPax, 10);

    if (validMaxPax > 0) {
      for (let i = 1; i <= validMaxPax; i++) {
        const option = document.createElement("option");
        option.value = i.toString();
        option.textContent = i.toString();
        selectElement.appendChild(option);
      }
    } else {
      // If PAX is 0 or invalid, maybe just show option '1'
      const option = document.createElement("option");
      option.value = "0";
      option.textContent = "0";
      selectElement.appendChild(option);
    }
    console.log(`Dropdown populated with options 1 to ${validMaxPax || 1}.`);
  };

  /**
   * @param {HTMLButtonElement} button
   * @returns {void}
   */
  const open = async (button) => {
    const guestName = getGuestName();
    const guestUuid = getGuestUuid();

    if (guestName === "Unknown Guest" || !guestUuid) {
      // Fallback for missing URL params
      displayError(
        "Cannot open invitation: Guest name or security token (UUID) is missing from the web link."
      );
      button.disabled = true;
      button.textContent = "Please refresh the page";
      console.warn("INVALID AUTH TOKEN: Missing parameters.");
      return;
    }

    // Show spinner, hide envelope
    showSpinner(button);

    const getUrl = `${API_URL}?name=${encodeURIComponent(
      guestName
    )}&uuid=${encodeURIComponent(guestUuid)}`;

    try {
      const response = await fetch(getUrl);
      const result = await response.json();

      // 3. Check API result
      if (response.ok && result.status === "success") {
        console.warn("Verification Success:", result.message);
        // --- START: Original Success Logic ---

        // Resepsi only or Both
        personalizeInvitationView(result.invitationType);

        // number of guests
        populatePaxOptions(result.pax);

        button.disabled = true;
        document.body.scrollIntoView({ behavior: "instant" });
        document.getElementById("root").classList.remove("opacity-0");

        if (theme.isAutoMode()) {
          document.getElementById("button-theme").classList.remove("d-none");
        }

        slide();
        theme.spyTop();

        // confetti.basicAnimation();
        // util.timeOut(confetti.openAnimation, 1500);

        console.log("dispatch undangan.open event")
        document.dispatchEvent(new Event("undangan.open"));
        util
          .changeOpacity(document.getElementById("welcome"), false)
          .then((el) => el.remove());

        // Re-enable the button *before* executing the rest of the logic if needed,
        // or just rely on the upcoming scroll to hide the button/welcome screen.
        // button.disabled = false;

        // document.body.scrollIntoView({ behavior: "instant" });

        // const rootElement = document.getElementById("root");
        // if (rootElement) {
        //     rootElement.classList.remove("opacity-0");
        // }

        // // Theme logic (assuming 'theme' is globally available)
        // if (typeof theme !== 'undefined' && typeof theme.isAutoMode === 'function' && theme.isAutoMode()) {
        //   const themeButton = document.getElementById("button-theme");
        //   if (themeButton) {
        //       themeButton.classList.remove("d-none");
        //   }
        // }

        // // Other global functions (assuming slide, theme, and util objects exist)
        // if (typeof slide === 'function') slide();
        // if (typeof theme !== 'undefined' && typeof theme.spyTop === 'function') theme.spyTop();

        // // Show the invitation and hide the entry screen (assuming your layout uses entry-screen)
        // const entryScreen = document.getElementById('entry-screen');
        // if (entryScreen) entryScreen.style.display = 'none';
        // document.getElementById(INVITATION_CONTAINER_ID).style.display = 'block';

        // // Personalize the welcome message
        // const welcomeElement = document.getElementById('guest-welcome-name');
        // if (welcomeElement) {
        //     welcomeElement.textContent = guestName;
        // }

        // // Final dispatch and removal
        // document.dispatchEvent(new Event("undangan.open"));
        // const welcomeRemovalElement = document.getElementById('welcome');
        // if (typeof util !== 'undefined' && typeof util.changeOpacity === 'function' && welcomeRemovalElement) {
        //      util.changeOpacity(welcomeRemovalElement, false).then((el) => el.remove());
        // } else if (welcomeRemovalElement) {
        //      welcomeRemovalElement.remove();
        // }
        // --- END: Original Success Logic ---
      } else {
        // If API returns unauthorized or any other error
        const errorMessage =
          result.message || "Access Denied: Name or security token is invalid.";
        displayError(errorMessage);
        console.warn("INVALID AUTH TOKEN:", errorMessage);

        // Restore envelope icon and keep button disabled
        showEnvelope(button);
        button.disabled = true;
        button.textContent = "Access Denied or Please refresh the page";
      }
    } catch (error) {
      console.error("Network error during existence check:", error);
      alert("A network error occurred. Please check your connection.");
      displayError("A network error occurred. Please check your connection.");

      // Restore envelope icon on network error
      showEnvelope(button);
      button.disabled = false;
      button.textContent = "Open Invitation";
    }

    // const params = new URLSearchParams(window.location.search);
    // if (params.get("authToken") != "thisIsToken") {
    //     // TODO: check google api here
    //     button.disabled = true;
    //     console.log("INVALID AUTH TOKEN")
    //     return
    // }

    // button.disabled = true;
    // document.body.scrollIntoView({ behavior: "instant" });
    // document.getElementById("root").classList.remove("opacity-0");

    // if (theme.isAutoMode()) {
    //   document.getElementById("button-theme").classList.remove("d-none");
    // }

    // slide();
    // theme.spyTop();

    // // confetti.basicAnimation();
    // // util.timeOut(confetti.openAnimation, 1500);

    // document.dispatchEvent(new Event("undangan.open"));
    // util.changeOpacity(document.getElementById('welcome'), false).then((el) => el.remove());
  };

  /**
   * @param {HTMLImageElement} img
   * @returns {void}
   */
  const modal = (img) => {
    document.getElementById("button-modal-click").setAttribute("href", img.src);
    document
      .getElementById("button-modal-download")
      .setAttribute("data-src", img.src);

    const i = document.getElementById("show-modal-image");
    i.src = img.src;
    i.width = img.width;
    i.height = img.height;
    bs.modal("modal-image").show();
  };

  /**
   * @returns {void}
   */
  const modalImageClick = () => {
    document
      .getElementById("show-modal-image")
      .addEventListener("click", (e) => {
        const abs =
          e.currentTarget.parentNode.querySelector(".position-absolute");

        abs.classList.contains("d-none")
          ? abs.classList.replace("d-none", "d-flex")
          : abs.classList.replace("d-flex", "d-none");
      });
  };

  /**
   * @param {HTMLDivElement} div
   * @returns {void}
   */
  const showStory = (div) => {
    if (navigator.vibrate) {
      navigator.vibrate(500);
    }

    // confetti.tapTapAnimation(div, 100);
    util.changeOpacity(div, false).then((e) => e.remove());
  };

  /**
   * @returns {void}
   */
  const closeInformation = () => information.set("info", true);

  /**
   * @returns {void}
   */
  const normalizeArabicFont = () => {
    document.querySelectorAll(".font-arabic").forEach((el) => {
      el.innerHTML = String(el.innerHTML).normalize("NFC");
    });
  };

  /**
   * @returns {void}
   */
  const animateSvg = () => {
    document.querySelectorAll("svg").forEach((el) => {
      if (el.hasAttribute("data-class")) {
        util.timeOut(
          () => el.classList.add(el.getAttribute("data-class")),
          parseInt(el.getAttribute("data-time"))
        );
      }
    });
  };

  /**
   * @returns {void}
   */
  const buildGoogleCalendar = () => {
    /**
     * @param {string} d
     * @returns {string}
     */
    const formatDate = (d) =>
      new Date(d.replace(" ", "T") + ":00Z")
        .toISOString()
        .replace(/[-:]/g, "")
        .split(".")
        .shift();

    const url = new URL("https://calendar.google.com/calendar/render");
    const data = new URLSearchParams({
      action: "TEMPLATE",
      text: "The Wedding of Gian and Stevany",
      dates: `${formatDate("2026-01-10 10:00")}/${formatDate(
        "2026-01-10 11:00"
      )}`,
      details: "",
      location:
        "Jl. Ki Hajar Dewantara, Pakulonan Barat, Kec. Kelapa Dua, Kab. Tangerang, Banten 15810",
      ctz: config.get("tz"),
    });

    url.search = data.toString();
    document
      .querySelector("#home button")
      ?.addEventListener("click", () => window.open(url, "_blank"));
  };

  const sendGoogleApiPost = () => {
    console.warn("TESSTTTTT");
    const button = document.getElementById("api-post-button");
    if (button) {
      button.textContent = "It Works!";
    }
  };

  /**
   * @returns {object}
   */
  const loaderLibs = () => {
    progress.add();

    /**
     * @param {{aos: boolean, confetti: boolean}} opt
     * @returns {void}
     */
    const load = (opt) => {
      loader(opt)
        .then(() => progress.complete("libs"))
        .catch(() => progress.invalid("libs"));
    };

    return {
      load,
    };
  };

  /**
   * @returns {Promise<void>}
   */
  const booting = async () => {
    animateSvg();
    countDownDate();
    showGuestName();
    modalImageClick();
    normalizeArabicFont();
    buildGoogleCalendar();

    if (information.has("presence")) {
      document.getElementById("form-presence").value = information.get(
        "presence"
      )
        ? "1"
        : "2";
    }

    if (information.get("info")) {
      document.getElementById("information")?.remove();
    }

    // wait until welcome screen is show.
    await util.changeOpacity(document.getElementById("welcome"), true);

    // remove loading screen and show welcome screen.
    // await util.changeOpacity(document.getElementById('loading'), false).then((el) => el.remove());

    document.getElementById("root").classList.remove("opacity-0");
    document.getElementById("root").style.opacity = "1";
  };

  /**
   * @returns {void}
   */
  const pageLoaded = () => {
    lang.init();
    offline.init();
    comment.init();
    // progress.init();

    config = storage("config");
    information = storage("information");

    const vid = video.init();
    const img = image.init();
    const aud = audio.init();
    const lib = loaderLibs();
    const token = document.body.getAttribute("data-key");
    // const params = new URLSearchParams(window.location.search);

    window.addEventListener("resize", util.debounce(slide));
    // document.addEventListener('undangan.progress.done', () => booting());
    booting();
    document.addEventListener("hide.bs.modal", () =>
      document.activeElement?.blur()
    );
    document
      .getElementById("button-modal-download")
      .addEventListener("click", (e) => {
        img.download(e.currentTarget.getAttribute("data-src"));
      });

    if (!token || token.length <= 0) {
      document.getElementById("comment")?.remove();
      document
        .querySelector('a.nav-link[href="#comment"]')
        ?.closest("li.nav-item")
        ?.remove();

      vid.load();
      img.load();
      aud.load();
      lib.load({
        confetti: document.body.getAttribute("data-confetti") === "true",
      });
    }

    if (token && token.length > 0) {
      // add 2 progress for config and comment.
      // before img.load();
      progress.add();
      progress.add();

      // if don't have data-src.
      if (!img.hasDataSrc()) {
        img.load();
      }

      session
        .guest(token) // TODO: modify this later so that we can get value only from k
        .then(({ data }) => {
          console.log("in session");
          document.dispatchEvent(new Event("undangan.session"));
          progress.complete("config");

          console.log("progress complete");

          if (img.hasDataSrc()) {
            img.load();
          }

          vid.load();
          aud.load();
          console.log("audio loaded");
          lib.load({ confetti: data.is_confetti_animation });

          //   comment
          //     .show()
          //     .then(() => progress.complete("comment"))
          //     .catch(() => progress.invalid("comment"));
        })
        .catch(() => progress.invalid("config"));
    }
  };

  /**
   * @returns {object}
   */
  const init = () => {
    theme.init();
    session.init();

    window.sendGoogleApiPost = sendGoogleApiPost;

    if (session.isAdmin()) {
      storage("user").clear();
      storage("owns").clear();
      storage("likes").clear();
      storage("session").clear();
      storage("comment").clear();
    }

    window.addEventListener("load", () => {
      pool.init(pageLoaded, ["image", "video", "audio", "libs", "gif"]);
    });

    return {
      util,
      theme,
      comment,
      guest: {
        open,
        modal,
        showStory,
        closeInformation,
      },
    };
  };

  return {
    init,
  };
})();
