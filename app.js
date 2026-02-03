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
const checkoutButton = document.querySelector("[data-checkout]");
const checkoutModal = document.querySelector("#checkout-modal");
const checkoutItems = document.querySelector("[data-checkout-items]");
const checkoutTotal = document.querySelector("[data-checkout-total]");
const checkoutList = document.querySelector("[data-checkout-list]");
const checkoutForm = document.querySelector(".checkout-form");
const checkoutFeedback = document.querySelector("[data-checkout-feedback]");

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

  if (checkoutItems) {
    checkoutItems.textContent = `${qty} st`;
  }
  if (checkoutTotal) checkoutTotal.textContent = formatPrice(totals.total);
  if (cartCountEl) {
    cartCountEl.textContent = String(qty);
    cartCountEl.classList.toggle("is-hidden", qty === 0);
  }

  if (checkoutList) {
    checkoutList.innerHTML = "";
    if (cart.length === 0) {
      checkoutList.innerHTML = `<p class="empty-state">Inga produkter i ordern.</p>`;
    } else {
      cart.forEach((item) => {
        const imageSrc = item.image || "bokforlag.webp";
        const entry = document.createElement("div");
        entry.className = "checkout-item";
        entry.innerHTML = `
          <img class="cart-thumb" src="${imageSrc}" alt="${item.name}" />
          <div>
            <h4>${item.name}</h4>
            <span>${item.qty} st • ${formatPrice(item.price)}</span>
          </div>
        `;
        checkoutList.appendChild(entry);
      });
    }
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

function openCheckout() {
  if (!checkoutModal) return;
  checkoutModal.classList.add("is-open");
  checkoutModal.setAttribute("aria-hidden", "false");
}

function closeCheckout() {
  if (!checkoutModal) return;
  checkoutModal.classList.remove("is-open");
  checkoutModal.setAttribute("aria-hidden", "true");
  if (checkoutFeedback) {
    checkoutFeedback.textContent = "";
  }
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

  const checkoutTrigger = target.closest("[data-checkout]");
  if (checkoutTrigger) {
    openCheckout();
  }

  const closeCheckoutTrigger = target.closest("[data-close-checkout]");
  if (closeCheckoutTrigger) {
    closeCheckout();
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

if (checkoutForm) {
  checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (cart.length === 0) {
      if (checkoutFeedback) checkoutFeedback.textContent = "Varukorgen är tom.";
      return;
    }
    cart = [];
    saveCart();
    renderCart();
    checkoutForm.reset();
    if (checkoutFeedback) {
      checkoutFeedback.textContent =
        "Tack! Din beställning är mottagen. Vi återkommer via e-post.";
    }
    setTimeout(() => {
      closeCheckout();
    }, 1600);
    closeCart();
  });
}

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
