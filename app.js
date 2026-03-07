const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}

const heroVideo = document.querySelector(".hero-video");

if (heroVideo) {
  const tryPlayHero = () => {
    heroVideo.muted = true;
    heroVideo.playsInline = true;
    const playPromise = heroVideo.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  };

  if (heroVideo.readyState >= 2) {
    tryPlayHero();
  } else {
    heroVideo.addEventListener("loadedmetadata", tryPlayHero, { once: true });
  }

  document.addEventListener("pointerdown", tryPlayHero, { once: true, passive: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      tryPlayHero();
    }
  });
}

const cartDrawer = document.querySelector(".cart-drawer");
const cartOverlay = document.querySelector("[data-cart-overlay]");
const cartItems = document.querySelector("[data-cart-items]");
const subtotalEl = document.querySelector("[data-subtotal]");
const shippingEl = document.querySelector("[data-shipping]");
const totalEl = document.querySelector("[data-total]");
const cartCountEl = document.querySelector("[data-cart-count]");

const CART_KEY = "essaCart";
let cart = loadCart();

function loadCart() {
  try {
    const stored = localStorage.getItem(CART_KEY);
    const items = stored ? JSON.parse(stored) : [];
    return items.map((item) => ({
      ...item,
      image: item.image || "bokforlag.webp",
    }));
  } catch (error) {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function formatPrice(value) {
  return `${value} kr`;
}

function calculateTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal > 0 ? 49 : 0;
  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
  };
}

function renderCart() {
  if (!cartItems) return;
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Varukorgen är tom.";
    cartItems.appendChild(empty);
  } else {
    cart.forEach((item) => {
      const imageSrc = item.image || "bokforlag.webp";
      const itemEl = document.createElement("div");
      itemEl.className = "cart-item";
      itemEl.innerHTML = `
        <div class="cart-item-head">
          <img class="cart-thumb" src="${imageSrc}" alt="${item.name}" />
          <div>
            <h4>${item.name}</h4>
            <span>${formatPrice(item.price)} / st</span>
          </div>
        </div>
        <div class="cart-controls">
          <div class="qty-controls">
            <button type="button" data-action="decrease" data-id="${item.id}">-</button>
            <span>${item.qty}</span>
            <button type="button" data-action="increase" data-id="${item.id}">+</button>
          </div>
          <button class="remove-button" type="button" data-action="remove" data-id="${item.id}">
            Ta bort
          </button>
        </div>
      `;
      cartItems.appendChild(itemEl);
    });
  }

  const totals = calculateTotals();
  if (subtotalEl) subtotalEl.textContent = formatPrice(totals.subtotal);
  if (shippingEl) shippingEl.textContent = formatPrice(totals.shipping);
  if (totalEl) totalEl.textContent = formatPrice(totals.total);

  const qty = cart.reduce((sum, item) => sum + item.qty, 0);
  if (cartCountEl) {
    cartCountEl.textContent = String(qty);
    cartCountEl.classList.toggle("is-hidden", qty === 0);
  }
}

function openCart() {
  if (!cartDrawer || !cartOverlay) return;
  cartDrawer.classList.add("is-open");
  cartOverlay.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  if (!cartDrawer || !cartOverlay) return;
  cartDrawer.classList.remove("is-open");
  cartOverlay.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const openCartTrigger = target.closest("[data-open-cart]");
  if (openCartTrigger) {
    openCart();
  }

  const closeCartTrigger = target.closest("[data-close-cart]");
  if (closeCartTrigger || target === cartOverlay) {
    closeCart();
  }

  const addToCartTrigger = target.closest("[data-add-to-cart]");
  if (addToCartTrigger) {
    const { productId, productName, productPrice, productImage } = addToCartTrigger.dataset;
    if (!productId || !productName || !productPrice) return;

    const existing = cart.find((item) => item.id === productId);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: productId,
        name: productName,
        price: Number(productPrice),
        image: productImage || "bokforlag.webp",
        qty: 1,
      });
    }
    saveCart();
    renderCart();
    openCart();
  }

  const actionTrigger = target.closest("[data-action]");
  if (actionTrigger) {
    const action = actionTrigger.dataset.action;
    const id = actionTrigger.dataset.id;
    const item = cart.find((entry) => entry.id === id);
    if (!item) return;

    if (action === "increase") item.qty += 1;
    if (action === "decrease") item.qty = Math.max(1, item.qty - 1);
    if (action === "remove") cart = cart.filter((entry) => entry.id !== id);

    saveCart();
    renderCart();
  }
});

function parseTimeToSeconds(timeString) {
  if (!timeString) return 0;
  if (/^\d+$/.test(timeString)) return Number(timeString);
  let total = 0;
  const parts = timeString.match(/(\d+)(h|m|s)/g);
  if (!parts) return 0;
  parts.forEach((part) => {
    const value = Number(part.slice(0, -1));
    const unit = part.slice(-1);
    if (unit === "h") total += value * 3600;
    if (unit === "m") total += value * 60;
    if (unit === "s") total += value;
  });
  return total;
}

function setYouTubeEmbed() {
  const frame = document.querySelector("[data-youtube]");
  if (!frame) return;
  const iframe = frame.querySelector("iframe");
  if (!iframe) return;
  const url = frame.getAttribute("data-youtube");
  if (!url) return;

  try {
    const parsed = new URL(url);
    let id = parsed.searchParams.get("v");
    if (!id && parsed.hostname.includes("youtu.be")) {
      id = parsed.pathname.replace("/", "");
    }
    if (!id) return;
    const startParam = parsed.searchParams.get("t");
    const startSeconds = parseTimeToSeconds(startParam);
    const params = new URLSearchParams({
      modestbranding: "1",
      rel: "0",
    });
    if (startSeconds > 0) {
      params.set("start", String(startSeconds));
    }
    iframe.src = `https://www.youtube.com/embed/${id}?${params.toString()}`;
  } catch (error) {
    return;
  }
}

renderCart();
setYouTubeEmbed();

const bookingElements = {
  monthLabel: document.querySelector("[data-booking-month]"),
  prevButton: document.querySelector("[data-booking-prev]"),
  nextButton: document.querySelector("[data-booking-next]"),
  grid: document.querySelector("[data-booking-grid]"),
  heading: document.querySelector("[data-booking-selected-heading]"),
  note: document.querySelector("[data-booking-selected-note]"),
  times: document.querySelector("[data-booking-times]"),
  form: document.querySelector("[data-booking-form]"),
  feedback: document.querySelector("[data-booking-feedback]"),
};

if (
  bookingElements.monthLabel &&
  bookingElements.prevButton &&
  bookingElements.nextButton &&
  bookingElements.grid &&
  bookingElements.heading &&
  bookingElements.note &&
  bookingElements.times &&
  bookingElements.form &&
  bookingElements.feedback
) {
  initBookingWidget();
}

function initBookingWidget() {
  const mondayBasedWeekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekdaySlots = {
    Mon: ["09:00", "10:30", "13:00", "15:30"],
    Tue: ["09:30", "11:00", "14:00", "16:30"],
    Wed: ["09:00", "11:30", "13:30", "15:00"],
    Thu: ["10:00", "12:00", "14:30", "16:00"],
    Fri: ["09:00", "10:30", "12:30"],
  };
  const swedishMonthFormatter = new Intl.DateTimeFormat("sv-SE", {
    month: "long",
    year: "numeric",
  });
  const swedishLongDateFormatter = new Intl.DateTimeFormat("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const swedishDateFormatter = new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const today = startOfDay(new Date());
  const firstBookableMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let visibleMonth = new Date(firstBookableMonth);
  let selectedDate = null;
  let selectedTime = "";

  const blockedDates = buildFutureDateSet([5, 11, 23, 39], today);
  const hardFullDates = buildFutureDateSet([8, 16, 30], today);
  const lowAvailabilityDates = buildFutureDateSet([3, 12, 18, 27, 35], today);
  const reservedSlotsByDate = new Map();

  bookingElements.prevButton.addEventListener("click", () => {
    const previousMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
    if (isBeforeMonth(previousMonth, firstBookableMonth)) return;
    visibleMonth = previousMonth;
    selectedDate = firstAvailableDateInMonth(visibleMonth);
    selectedTime = "";
    bookingElements.form.hidden = true;
    renderCalendar();
    renderTimes();
  });

  bookingElements.nextButton.addEventListener("click", () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
    selectedDate = firstAvailableDateInMonth(visibleMonth);
    selectedTime = "";
    bookingElements.form.hidden = true;
    renderCalendar();
    renderTimes();
  });

  bookingElements.grid.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const dayButton = target.closest(".booking-day");
    if (!(dayButton instanceof HTMLButtonElement)) return;
    const selectedIsoDate = dayButton.dataset.date;
    if (!selectedIsoDate || dayButton.disabled) return;

    selectedDate = isoDateToLocalDate(selectedIsoDate);
    selectedTime = "";
    bookingElements.form.hidden = true;
    renderCalendar();
    renderTimes();
  });

  bookingElements.form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!selectedDate || !selectedTime) {
      setBookingFeedback("Valj forst ett datum och en tid.", "error");
      return;
    }

    const isoDate = toIsoDate(selectedDate);
    const availableSlots = getAvailableSlots(selectedDate);
    if (!availableSlots.includes(selectedTime)) {
      selectedTime = "";
      bookingElements.form.hidden = true;
      renderCalendar();
      renderTimes();
      setBookingFeedback("Den tiden ar inte langre tillganglig. Valj en ny tid.", "error");
      return;
    }

    const bookedSlots = reservedSlotsByDate.get(isoDate) || new Set();
    bookedSlots.add(selectedTime);
    reservedSlotsByDate.set(isoDate, bookedSlots);

    const formData = new FormData(bookingElements.form);
    const bookingReference = `ESSA-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const contactName = String(formData.get("name") || "").trim() || "Du";

    selectedTime = "";
    bookingElements.form.reset();
    bookingElements.form.hidden = true;
    renderCalendar();
    renderTimes();
    setBookingFeedback(
      `${contactName}, din forfragan ar mottagen. Referens: ${bookingReference}.`,
      "success"
    );
  });

  selectedDate = firstAvailableDateInMonth(visibleMonth);
  renderCalendar();
  renderTimes();

  function renderCalendar() {
    bookingElements.monthLabel.textContent = capitalizeFirstLetter(
      swedishMonthFormatter.format(visibleMonth)
    );
    bookingElements.prevButton.disabled = isSameMonth(visibleMonth, firstBookableMonth);
    bookingElements.grid.innerHTML = "";

    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekdayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPreviousMonth = new Date(year, month, 0).getDate();

    for (let cellIndex = 0; cellIndex < 42; cellIndex += 1) {
      let dayNumber = 0;
      let cellDate = null;
      let isCurrentMonthDay = true;

      if (cellIndex < firstWeekdayIndex) {
        dayNumber = daysInPreviousMonth - firstWeekdayIndex + cellIndex + 1;
        cellDate = new Date(year, month - 1, dayNumber);
        isCurrentMonthDay = false;
      } else if (cellIndex >= firstWeekdayIndex + daysInMonth) {
        dayNumber = cellIndex - (firstWeekdayIndex + daysInMonth) + 1;
        cellDate = new Date(year, month + 1, dayNumber);
        isCurrentMonthDay = false;
      } else {
        dayNumber = cellIndex - firstWeekdayIndex + 1;
        cellDate = new Date(year, month, dayNumber);
      }

      const isoDate = toIsoDate(cellDate);
      const dayStatus = getDateStatus(cellDate, isCurrentMonthDay);
      const isBookableDay = dayStatus === "available" || dayStatus === "few";
      const isSelectedDay =
        selectedDate && toIsoDate(selectedDate) === isoDate && isCurrentMonthDay;

      const dayButton = document.createElement("button");
      dayButton.type = "button";
      dayButton.className = `booking-day booking-day--${dayStatus}`;
      if (isSelectedDay) {
        dayButton.classList.add("booking-day--selected");
      }
      dayButton.textContent = String(dayNumber);
      dayButton.dataset.date = isoDate;
      dayButton.disabled = !isBookableDay;
      dayButton.setAttribute("role", "gridcell");
      dayButton.setAttribute(
        "aria-label",
        `${capitalizeFirstLetter(swedishLongDateFormatter.format(cellDate))}. ${statusText(dayStatus)}.`
      );

      bookingElements.grid.append(dayButton);
    }
  }

  function renderTimes() {
    bookingElements.times.innerHTML = "";

    if (!selectedDate) {
      bookingElements.heading.textContent = "Valj en dag";
      bookingElements.note.textContent = "Klicka pa ett datum i kalendern for att se tider.";
      bookingElements.form.hidden = true;
      setBookingFeedback("");
      return;
    }

    const dayStatus = getDateStatus(selectedDate, true);
    const dayText = capitalizeFirstLetter(swedishLongDateFormatter.format(selectedDate));
    bookingElements.heading.textContent = dayText;

    if (dayStatus !== "available" && dayStatus !== "few") {
      bookingElements.note.textContent =
        "Detta datum ar inte bokningsbart. Valj en annan vardag.";
      bookingElements.form.hidden = true;
      selectedTime = "";
      setBookingFeedback("");
      return;
    }

    const slots = getAvailableSlots(selectedDate);
    if (slots.length === 0) {
      bookingElements.note.textContent = "Inga tider kvar denna dag. Valj ett annat datum.";
      bookingElements.form.hidden = true;
      selectedTime = "";
      setBookingFeedback("");
      return;
    }

    bookingElements.note.textContent = "Valj en tid och skicka sedan din forfragan.";
    slots.forEach((slot) => {
      const slotButton = document.createElement("button");
      slotButton.type = "button";
      slotButton.className = "booking-time";
      if (slot === selectedTime) {
        slotButton.classList.add("is-selected");
      }
      slotButton.textContent = slot;
      slotButton.addEventListener("click", () => {
        selectedTime = slot;
        updateFormWithSelection();
        renderTimes();
      });
      bookingElements.times.append(slotButton);
    });

    updateFormWithSelection();
    setBookingFeedback("");
  }

  function updateFormWithSelection() {
    if (!selectedDate || !selectedTime) {
      bookingElements.form.hidden = true;
      return;
    }

    const dateInput = bookingElements.form.elements.namedItem("date");
    const timeInput = bookingElements.form.elements.namedItem("time");
    if (dateInput instanceof HTMLInputElement) {
      dateInput.value = swedishDateFormatter.format(selectedDate);
    }
    if (timeInput instanceof HTMLInputElement) {
      timeInput.value = selectedTime;
    }

    bookingElements.form.hidden = false;
  }

  function getDateStatus(date, isCurrentMonthDay) {
    if (!isCurrentMonthDay) return "muted";
    if (startOfDay(date) < today) return "past";
    if (isWeekend(date)) return "weekend";

    const isoDate = toIsoDate(date);
    if (blockedDates.has(isoDate)) return "blocked";
    if (hardFullDates.has(isoDate)) return "full";

    const slots = getAvailableSlots(date);
    if (slots.length === 0) return "full";
    if (lowAvailabilityDates.has(isoDate) || slots.length <= 2) return "few";
    return "available";
  }

  function getAvailableSlots(date) {
    if (startOfDay(date) < today || isWeekend(date)) return [];
    const isoDate = toIsoDate(date);
    if (blockedDates.has(isoDate) || hardFullDates.has(isoDate)) return [];

    const weekdayKey = mondayBasedWeekdays[(date.getDay() + 6) % 7];
    const baseSlots = weekdaySlots[weekdayKey] ? [...weekdaySlots[weekdayKey]] : [];
    const narrowedSlots = lowAvailabilityDates.has(isoDate) ? baseSlots.slice(0, 2) : baseSlots;
    const reservedSlots = reservedSlotsByDate.get(isoDate);
    if (!reservedSlots) return narrowedSlots;
    return narrowedSlots.filter((slot) => !reservedSlots.has(slot));
  }

  function firstAvailableDateInMonth(monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const status = getDateStatus(date, true);
      if (status === "available" || status === "few") {
        return date;
      }
    }

    return null;
  }

  function setBookingFeedback(message, type = "") {
    bookingElements.feedback.textContent = message;
    bookingElements.feedback.classList.remove("is-success", "is-error");
    if (type === "success") {
      bookingElements.feedback.classList.add("is-success");
    } else if (type === "error") {
      bookingElements.feedback.classList.add("is-error");
    }
  }

  function statusText(status) {
    if (status === "available") return "Ledig";
    if (status === "few") return "Fa platser";
    if (status === "full") return "Fullbokad";
    if (status === "blocked") return "Ej bokningsbar";
    if (status === "weekend") return "Helg";
    if (status === "past") return "Passerat datum";
    return "Ej tillganglig";
  }
}

function buildFutureDateSet(offsets, fromDate) {
  const set = new Set();
  offsets.forEach((offset) => {
    const candidate = new Date(fromDate);
    candidate.setDate(candidate.getDate() + offset);
    if (isWeekend(candidate)) {
      const addDays = candidate.getDay() === 6 ? 2 : 1;
      candidate.setDate(candidate.getDate() + addDays);
    }
    set.add(toIsoDate(candidate));
  });
  return set;
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isoDateToLocalDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isBeforeMonth(left, right) {
  if (left.getFullYear() < right.getFullYear()) return true;
  if (left.getFullYear() > right.getFullYear()) return false;
  return left.getMonth() < right.getMonth();
}

function isSameMonth(left, right) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function capitalizeFirstLetter(value) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
