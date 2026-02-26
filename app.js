const products = [
  {
    id: "ramen",
    name: "Korean Fire Ramen Bowl",
    category: "meals",
    price: 229,
    description: "Spicy instant ramen with gochujang broth, scallions, and sesame.",
    image:
      "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "tteokbokki",
    name: "Cheesy Tteokbokki Cups",
    category: "snacks",
    price: 199,
    description: "Rice cakes in sweet-spicy sauce, melted cheese top-up.",
    image:
      "https://images.unsplash.com/photo-1583225157630-2f8e9f5bc95a?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "bibimbap",
    name: "Bibimbap Ready Meal",
    category: "meals",
    price: 259,
    description: "Rice bowl with veggies, sesame oil, and signature chili paste.",
    image:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "kimbap",
    name: "Classic Kimbap Rolls",
    category: "snacks",
    price: 149,
    description: "Seaweed rice rolls with pickled radish and crunchy veggies.",
    image:
      "https://images.unsplash.com/photo-1610917040803-1fccf9623064?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "kimchi",
    name: "Premium Kimchi Jar",
    category: "sauces",
    price: 189,
    description: "Fermented napa cabbage crafted with Korean chili blend.",
    image:
      "https://images.unsplash.com/photo-1648919104126-1f69d0b94d55?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "soju",
    name: "Sparkling Yuzu Cooler",
    category: "beverages",
    price: 99,
    description: "Korean-style citrus fizz drink, lightly sweet and refreshing.",
    image:
      "https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=900&q=80",
  },
];

const RAZORPAY_KEY = "rzp_test_1DP5mmOlF5G5ag";

const state = {
  cart: new Map(),
  user: null,
  trackingTimer: null,
  theme: "light",
};

const refs = {
  productGrid: document.getElementById("productGrid"),
  template: document.getElementById("productTemplate"),
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  clearFilters: document.getElementById("clearFilters"),
  cartItems: document.getElementById("cartItems"),
  cartMeta: document.getElementById("cartMeta"),
  subtotal: document.getElementById("subtotal"),
  taxes: document.getElementById("taxes"),
  total: document.getElementById("total"),
  checkoutButton: document.getElementById("checkoutButton"),
  authModal: document.getElementById("authModal"),
  authForm: document.getElementById("authForm"),
  authCancel: document.getElementById("authCancel"),
  loginButton: document.getElementById("loginButton"),
  logoutButton: document.getElementById("logoutButton"),
  checkoutModal: document.getElementById("checkoutModal"),
  checkoutForm: document.getElementById("checkoutForm"),
  checkoutCancel: document.getElementById("checkoutCancel"),
  paymentModal: document.getElementById("paymentModal"),
  paymentStatus: document.getElementById("paymentStatus"),
  paymentSummary: document.getElementById("paymentSummary"),
  paymentProgress: document.getElementById("paymentProgress"),
  paymentLog: document.getElementById("paymentLog"),
  closePayment: document.getElementById("closePayment"),
  startOrder: document.getElementById("startOrder"),
  viewTracking: document.getElementById("viewTracking"),
  timeline: document.getElementById("trackingTimeline"),
  trackingSection: document.getElementById("trackingSection"),
  themeToggle: document.getElementById("themeToggle"),
};

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getCartTotals() {
  const cartItems = [...state.cart.values()];
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const taxes = Math.round(subtotal * 0.05);
  const delivery = cartItems.length ? 49 : 0;
  const total = subtotal + taxes + delivery;
  return { cartItems, subtotal, taxes, delivery, total };
}

function getFilteredProducts() {
  const query = refs.searchInput.value.trim().toLowerCase();
  const category = refs.categoryFilter.value;

  return products.filter((item) => {
    const byCategory = category === "all" || item.category === category;
    const bySearch =
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query);
    return byCategory && bySearch;
  });
}

function renderProducts() {
  refs.productGrid.innerHTML = "";
  const data = getFilteredProducts();

  if (!data.length) {
    refs.productGrid.innerHTML = "<p>No products match your filters.</p>";
    return;
  }

  data.forEach((product) => {
    const node = refs.template.content.cloneNode(true);
    const card = node.querySelector(".product-card");
    node.querySelector("img").src = product.image;
    node.querySelector("img").alt = product.name;
    node.querySelector("h4").textContent = product.name;
    node.querySelector(".desc").textContent = product.description;
    node.querySelector(".category").textContent = product.category;
    node.querySelector(".price").textContent = formatINR(product.price);

    card.querySelector(".add-btn").addEventListener("click", () => {
      const existing = state.cart.get(product.id) || { ...product, qty: 0 };
      existing.qty += 1;
      state.cart.set(product.id, existing);
      renderCart();
    });

    refs.productGrid.append(node);
  });
}

function renderCart() {
  const { cartItems, subtotal, taxes, delivery, total } = getCartTotals();

  refs.cartMeta.textContent = `${cartItems.reduce((s, i) => s + i.qty, 0)} items added`;
  refs.subtotal.textContent = formatINR(subtotal);
  refs.taxes.textContent = formatINR(taxes);
  refs.total.textContent = formatINR(total);
  document.getElementById("delivery").textContent = formatINR(delivery);

  if (!cartItems.length) {
    refs.cartItems.className = "cart-items empty";
    refs.cartItems.textContent = "No products added yet.";
    refs.checkoutButton.disabled = true;
    return;
  }

  refs.cartItems.className = "cart-items";
  refs.cartItems.innerHTML = "";
  cartItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <small>x${item.qty}</small>
      </div>
      <strong>${formatINR(item.price * item.qty)}</strong>
      <div>
        <button class="ghost" data-id="${item.id}" data-op="minus">-</button>
        <button class="ghost" data-id="${item.id}" data-op="plus">+</button>
      </div>
    `;
    refs.cartItems.append(row);
  });
  refs.checkoutButton.disabled = false;
}

function syncAuthState() {
  if (state.user) {
    refs.loginButton.textContent = `Signed in: ${state.user}`;
    refs.loginButton.classList.remove("solid");
    refs.loginButton.classList.add("ghost");
    refs.logoutButton.classList.remove("hidden");
    return;
  }

  refs.loginButton.textContent = "Login / Signup";
  refs.loginButton.classList.remove("ghost");
  refs.loginButton.classList.add("solid");
  refs.logoutButton.classList.add("hidden");
}

function appendPaymentLog(message) {
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleTimeString()} — ${message}`;
  refs.paymentLog.append(li);
}

function openPaymentModal(orderDetails, total) {
  refs.paymentModal.showModal();
  refs.paymentLog.innerHTML = "";
  refs.closePayment.disabled = true;
  refs.paymentProgress.style.width = "18%";
  refs.paymentStatus.textContent = "Launching Razorpay secure checkout...";
  refs.paymentSummary.innerHTML = `
    <p><strong>Payer:</strong> ${state.user}</p>
    <p><strong>Method:</strong> Razorpay (${orderDetails.method.toUpperCase()})</p>
    <p><strong>Deliver to:</strong> ${orderDetails.address}</p>
    <p><strong>Amount:</strong> ${formatINR(total)}</p>
  `;
  appendPaymentLog("Created demo payment request.");
}

function finalizeOrder(paymentId) {
  refs.paymentStatus.textContent = "Payment verified. Order confirmed!";
  refs.paymentProgress.style.width = "100%";
  appendPaymentLog(`Received payment id ${paymentId}.`);
  appendPaymentLog("Sent confirmation to kitchen and delivery partner.");
  refs.closePayment.disabled = false;
  setupTracking();
  state.cart.clear();
  renderCart();
}

function launchRazorpay(orderDetails) {
  if (!window.Razorpay) {
    refs.paymentStatus.textContent = "Razorpay SDK unavailable. Check internet and retry.";
    refs.paymentProgress.style.width = "100%";
    appendPaymentLog("Checkout failed because Razorpay script did not load.");
    refs.closePayment.disabled = false;
    return;
  }

  const { total } = getCartTotals();
  openPaymentModal(orderDetails, total);

  const options = {
    key: RAZORPAY_KEY,
    amount: total * 100,
    currency: "INR",
    name: "Seoul Spice Market",
    description: "Swiggy-style live checkout demo",
    image: "https://razorpay.com/assets/razorpay-logo.svg",
    prefill: {
      name: orderDetails.name,
      email: state.user,
      contact: orderDetails.phone,
    },
    notes: {
      address: orderDetails.address,
      demo: "This is a demo storefront payment",
    },
    theme: {
      color: "#fc8019",
    },
    modal: {
      ondismiss: () => {
        refs.paymentStatus.textContent = "Payment was cancelled by customer.";
        refs.paymentProgress.style.width = "100%";
        appendPaymentLog("Customer closed Razorpay popup before payment.");
        refs.closePayment.disabled = false;
      },
    },
    handler: (response) => {
      refs.paymentStatus.textContent = "Payment captured. Verifying with demo backend...";
      refs.paymentProgress.style.width = "82%";
      appendPaymentLog("Razorpay returned success response.");
      setTimeout(() => finalizeOrder(response.razorpay_payment_id), 900);
    },
  };

  const razorpayInstance = new window.Razorpay(options);
  razorpayInstance.on("payment.failed", (response) => {
    refs.paymentStatus.textContent = "Payment failed. Try another method.";
    refs.paymentProgress.style.width = "100%";
    appendPaymentLog(`Failure reason: ${response.error.description}`);
    refs.closePayment.disabled = false;
  });

  appendPaymentLog("Opening Razorpay checkout popup.");
  refs.paymentProgress.style.width = "45%";
  razorpayInstance.open();
}

function setupTracking() {
  const checkpoints = [
    "Order confirmed by Seoul Spice kitchen",
    "Chef started preparing your meal",
    "Packaging in progress",
    "Rider picked up order",
    "Rider is nearby (ETA: 6 mins)",
    "Delivered. Enjoy your meal!",
  ];

  refs.timeline.innerHTML = "";
  refs.trackingSection.scrollIntoView({ behavior: "smooth" });

  let step = 0;
  if (state.trackingTimer) clearInterval(state.trackingTimer);

  state.trackingTimer = setInterval(() => {
    const li = document.createElement("li");
    li.textContent = `${new Date().toLocaleTimeString()} — ${checkpoints[step]}`;
    refs.timeline.append(li);
    step += 1;
    if (step >= checkpoints.length) clearInterval(state.trackingTimer);
  }, 1800);
}

refs.searchInput.addEventListener("input", renderProducts);
refs.categoryFilter.addEventListener("change", renderProducts);
refs.clearFilters.addEventListener("click", () => {
  refs.searchInput.value = "";
  refs.categoryFilter.value = "all";
  renderProducts();
});

refs.cartItems.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-id]");
  if (!btn) return;
  const item = state.cart.get(btn.dataset.id);
  if (!item) return;
  if (btn.dataset.op === "plus") item.qty += 1;
  if (btn.dataset.op === "minus") item.qty -= 1;
  if (item.qty <= 0) state.cart.delete(btn.dataset.id);
  else state.cart.set(item.id, item);
  renderCart();
});

refs.loginButton.addEventListener("click", () => refs.authModal.showModal());
refs.logoutButton.addEventListener("click", () => {
  state.user = null;
  syncAuthState();
});

refs.authCancel.addEventListener("click", () => refs.authModal.close());
refs.checkoutCancel.addEventListener("click", () => refs.checkoutModal.close());

refs.authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.user = document.getElementById("authEmail").value;
  syncAuthState();
  refs.authModal.close();
});

refs.checkoutButton.addEventListener("click", () => {
  if (!state.user) {
    refs.authModal.showModal();
    return;
  }
  refs.checkoutModal.showModal();
});

refs.checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const details = {
    name: document.getElementById("name").value,
    phone: document.getElementById("phone").value,
    address: document.getElementById("address").value,
    method: document.getElementById("paymentMethod").value,
  };
  refs.checkoutModal.close();
  launchRazorpay(details);
});

refs.closePayment.addEventListener("click", () => refs.paymentModal.close());
refs.startOrder.addEventListener("click", () => {
  document.querySelector("main").scrollIntoView({ behavior: "smooth" });
});
refs.viewTracking.addEventListener("click", setupTracking);

refs.themeToggle.addEventListener("click", () => {
  state.theme = state.theme === "light" ? "night" : "light";
  document.body.classList.toggle("night", state.theme === "night");
});

renderProducts();
renderCart();
syncAuthState();
