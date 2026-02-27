const products = [
  {
    id: "k-start",
    name: "K-Start",
    category: "entry",
    price: 55,
    description: "Mild Korean garlicky goodness. 🌶️ 70g pack.",
    image: "assets/photos/k-start.png",
  },
  {
    id: "k-bold",
    name: "K-Bold",
    category: "core-engine",
    price: 75,
    description: "Moderately spicy Korean punch. 🌶️🌶️ 75g pack.",
    image: "assets/photos/k-bold.png",
  },
  {
    id: "k-fire",
    name: "K-Fire",
    category: "core-engine",
    price: 89,
    description: "Fiery heat with Korea kick! 🌶️🌶️🌶️ 80g pack.",
    image: "assets/photos/k-fire.png",
  },
  {
    id: "k-bold-x2",
    name: "K-Bold x2",
    category: "combo",
    price: 99,
    description: "Twin packs of our moderately spicy K-Bold. 🌶️🌶️ 150g pack.",
    image: "assets/photos/k-fire-cup.png",
  },
  {
    id: "k-fire-cup",
    name: "K-Fire Cup",
    category: "premium-bowl",
    price: 99,
    description: "Late-night indulgence! Fiery Korean noodles. 🌶️🌶️🌶️ 90g cup.",
    image: "assets/photos/k-bold-x2.png",
  },
];

const RAZORPAY_KEY = "rzp_test_1DP5mmOlF5G5ag";

const state = {
  cart: new Map(),
  user: null,
  trackingTimer: null,
  theme: "light",
  activeOrder: null,
  lastOrderItems: [],
  complaints: [],
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
  trackingMeta: document.getElementById("trackingMeta"),
  themeToggle: document.getElementById("themeToggle"),
  complaintButton: document.getElementById("complaintButton"),
  complaintModal: document.getElementById("complaintModal"),
  complaintForm: document.getElementById("complaintForm"),
  complaintCancel: document.getElementById("complaintCancel"),
  complaintHistory: document.getElementById("complaintHistory"),
  reorderButton: document.getElementById("reorderButton"),
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
    const imageEl = node.querySelector("img");
    imageEl.src = product.image;
    imageEl.alt = product.name;
    node.querySelector("h4").textContent = product.name;
    node.querySelector(".desc").textContent = product.description;
    node.querySelector(".category").textContent = product.category.replace(/-/g, " ");
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
    refs.complaintButton.disabled = false;
    return;
  }

  refs.loginButton.textContent = "Login / Signup";
  refs.loginButton.classList.remove("ghost");
  refs.loginButton.classList.add("solid");
  refs.logoutButton.classList.add("hidden");
  refs.complaintButton.disabled = true;
  if (refs.complaintModal.open) refs.complaintModal.close();
}

function renderComplaintHistory() {
  if (!state.user) {
    refs.complaintHistory.innerHTML = "";
    return;
  }

  const complaintsForUser = state.complaints.filter((item) => item.user === state.user);
  if (!complaintsForUser.length) {
    refs.complaintHistory.innerHTML = "<p class='muted-copy'>No complaints submitted yet.</p>";
    return;
  }

  refs.complaintHistory.innerHTML = `
    <h4>Recent Tickets</h4>
    ${complaintsForUser
      .slice(-3)
      .reverse()
      .map(
        (item) => `
          <article class="complaint-row">
            <p><strong>${item.ticketId}</strong> • ${item.category}</p>
            <p>${item.message}</p>
            <small>${item.orderId ? `Order ${item.orderId} • ` : ""}status: ${item.status}</small>
          </article>
        `
      )
      .join("")}
  `;
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
  appendPaymentLog("Created payment request.");
}

function finalizeOrder(paymentId) {
  refs.paymentStatus.textContent = "Payment verified. Order confirmed!";
  refs.paymentProgress.style.width = "100%";
  appendPaymentLog(`Received payment id ${paymentId}.`);
  appendPaymentLog("Sent confirmation to kitchen and delivery partner.");
  refs.closePayment.disabled = false;
  state.activeOrder = {
    id: `ORD-${Math.floor(Math.random() * 90000 + 10000)}`,
    placedAt: Date.now(),
  };
  state.lastOrderItems = [...getCartTotals().cartItems].map((item) => ({ ...item }));
  refs.reorderButton.disabled = state.lastOrderItems.length === 0;
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
    description: "Instant checkout for Seoul Spice Market orders",
    image: "https://razorpay.com/assets/razorpay-logo.svg",
    prefill: {
      name: orderDetails.name,
      email: state.user,
      contact: orderDetails.phone,
    },
    notes: {
      address: orderDetails.address,
      demo: "Storefront checkout payment",
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
      refs.paymentStatus.textContent = "Payment captured. Verifying with backend...";
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
  if (!state.activeOrder) return;

  const checkpoints = [
    { offsetMs: 0, text: "Order confirmed" },
    { offsetMs: 120000, text: "Kitchen started preparing" },
    { offsetMs: 300000, text: "Packed and ready for pickup" },
    { offsetMs: 480000, text: "Rider picked up your order" },
    { offsetMs: 720000, text: "Rider is nearby" },
    { offsetMs: 900000, text: "Delivered" },
  ];

  const renderTracking = () => {
    const elapsed = Date.now() - state.activeOrder.placedAt;
    refs.timeline.innerHTML = "";

    checkpoints.forEach((checkpoint, index) => {
      const li = document.createElement("li");
      const isDone = elapsed >= checkpoint.offsetMs;
      const isCurrent = !isDone && index > 0 && elapsed >= checkpoints[index - 1].offsetMs;

      li.textContent = checkpoint.text;
      li.className = isDone ? "done" : isCurrent ? "current" : "pending";
      refs.timeline.append(li);
    });

    const etaMs = Math.max(0, checkpoints[checkpoints.length - 1].offsetMs - elapsed);
    const etaMinutes = Math.ceil(etaMs / 60000);
    refs.trackingMeta.textContent = etaMinutes > 0 ? `ETA ${etaMinutes} min` : "Delivered";

    if (etaMs <= 0 && state.trackingTimer) {
      clearInterval(state.trackingTimer);
      state.trackingTimer = null;
    }
  };

  refs.trackingSection.classList.remove("hidden");
  document.body.classList.add("tracking-only");
  refs.trackingSection.scrollIntoView({ behavior: "smooth" });

  if (state.trackingTimer) clearInterval(state.trackingTimer);
  renderTracking();
  state.trackingTimer = setInterval(renderTracking, 1000);
}

function showNoOrderTrackingMessage() {
  refs.trackingSection.classList.remove("hidden");
  document.body.classList.remove("tracking-only");
  refs.timeline.innerHTML = "";

  const li = document.createElement("li");
  li.className = "notice";
  li.textContent = "No order to track right now. Please place an order first.";
  refs.timeline.append(li);

  refs.trackingMeta.textContent = "No active order";
  refs.trackingSection.scrollIntoView({ behavior: "smooth" });
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
refs.complaintCancel.addEventListener("click", () => refs.complaintModal.close());

[refs.authModal, refs.checkoutModal, refs.paymentModal, refs.complaintModal].forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.close();
    }
  });
});

refs.authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.user = document.getElementById("authEmail").value;
  syncAuthState();
  renderComplaintHistory();
  refs.authModal.close();
});

refs.complaintButton.addEventListener("click", () => {
  if (!state.user) {
    refs.authModal.showModal();
    return;
  }
  renderComplaintHistory();
  refs.complaintModal.showModal();
});

refs.complaintForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const orderId = document.getElementById("complaintOrderId").value.trim();
  const category = document.getElementById("complaintCategory").value;
  const message = document.getElementById("complaintMessage").value.trim();

  state.complaints.push({
    ticketId: `CMP-${Math.floor(Math.random() * 90000 + 10000)}`,
    orderId: orderId || null,
    category,
    message,
    status: "received",
    user: state.user,
  });

  refs.complaintForm.reset();
  renderComplaintHistory();
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
refs.reorderButton.addEventListener("click", () => {
  if (!state.lastOrderItems.length) return;
  state.lastOrderItems.forEach((item) => {
    state.cart.set(item.id, { ...item });
  });
  renderCart();
});
refs.startOrder.addEventListener("click", () => {
  document.querySelector("main").scrollIntoView({ behavior: "smooth" });
});
refs.viewTracking.addEventListener("click", () => {
  if (!state.activeOrder) {
    showNoOrderTrackingMessage();
    return;
  }
  setupTracking();
});

refs.themeToggle.addEventListener("click", () => {
  state.theme = state.theme === "light" ? "night" : "light";
  document.body.classList.toggle("night", state.theme === "night");
});

renderProducts();
renderCart();
syncAuthState();
