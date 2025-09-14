
const products = [];
let sales = [];

// === Yordamchi funksiyalar ===
function fmtSom(val) {
  return val.toLocaleString("uz-UZ") + " so‘m";
}
function fmtUsd(val) {
  return "$" + val.toFixed(2);
}
function roundQty(q) {
  const intPart = Math.floor(q);
  const fraction = q - intPart;
  return fraction >= 0.5 ? Math.ceil(q) : Math.floor(q);
}
function getGroup(name) {
  if (name.toLowerCase().startsWith("luxury")) return "luxury";
  if (name.toLowerCase().startsWith("golden")) return "golden";
  if (name.toLowerCase().startsWith("art floor")) return "artfloor";
  return "general";
}

// === Mahsulotlarni render qilish ===
function renderProducts(filter = "") {
  ["luxury", "golden", "artfloor", "general"].forEach(id => {
    document.getElementById(id + "-table").innerHTML = "";
  });

  products.forEach((p, index) => {
    if (filter && !p.code.toLowerCase().includes(filter.toLowerCase())) return;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.code}</td>
      <td>${p.name}</td>
      <td>${roundQty(p.quantity)} dona (${p.totalArea.toFixed(3)} m²)</td>
      <td>${fmtSom(p.costSom)} / ${fmtUsd(p.costUsd)}</td>
      <td>${fmtSom(p.saleSom)} / ${fmtUsd(p.saleUsd)}</td>
      <td>
        <button onclick="sellOptions(${index})">Sotish</button>
        <button onclick="editProduct(${index})">O‘zgartirish</button>
        <button onclick="deleteProduct(${index})">O‘chirish</button>
      </td>
    `;
    document.getElementById(getGroup(p.name) + "-table").appendChild(row);
  });

  renderRemain();
}

// === Omborda qolganlarni hisoblash ===
function renderRemain() {
  let totalQty = 0, totalArea = 0;
  products.forEach((p) => {
    totalQty += p.quantity;
    totalArea += p.totalArea;
  });
  document.getElementById("remain-summary").innerHTML =
    "Omborda qolgan jami: " + roundQty(totalQty) + " dona, " + totalArea.toFixed(3) + " m²";
}

// === Sotilganlarni render qilish ===
function renderSales() {
  const tbl = document.getElementById("sales-table");
  tbl.innerHTML = "";

  let totalQty = 0, totalArea = 0;
  sales.forEach((s) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.time}</td>
      <td>${s.name}</td>
      <td>${roundQty(s.qty)} dona (${s.area.toFixed(3)} m²)</td>
      <td>${fmtSom(s.sumSom)}</td>
      <td>${fmtUsd(s.sumUsd)}</td>
    `;
    tbl.appendChild(tr);

    totalQty += s.qty;
    totalArea += s.area;
  });

  document.getElementById("sold-total").textContent = roundQty(totalQty) + " dona";
  document.getElementById("sold-total-area").textContent = totalArea.toFixed(3) + " m²";
}

// === Mahsulot qo‘shish ===
document.getElementById("product-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const code = document.getElementById("product-code").value;
  const name = document.getElementById("product-name").value;
  const size = parseFloat(document.getElementById("product-size").value);
  const qty = parseFloat(document.getElementById("product-quantity").value);
  const costUsd = parseFloat(document.getElementById("product-cost-price-usd").value) || 0;
  const saleUsd = parseFloat(document.getElementById("product-sale-price-usd").value) || 0;
  const rate = parseFloat(document.getElementById("dollar-rate").value) || 12500;

  products.push({
    code, name, size,
    quantity: qty,
    totalArea: qty * size,
    costUsd,
    costSom: costUsd * rate,
    saleUsd,
    saleSom: saleUsd * rate
  });

  renderProducts();
  this.reset();
});

// === Sotish variantlari ===
function sellOptions(index) {
  const choice = confirm("Kvadrat bo‘yicha sotish uchun OK bosing.\nDona bo‘yicha sotish uchun Cancel bosing.");
  if (choice) {
    sellByArea(index);
  } else {
    sellByPiece(index);
  }
}

// === Kvadrat bo‘yicha sotish ===
function sellByArea(index) {
  const product = products[index];
  let area = parseFloat(prompt("Sotiladigan miqdor (m²):", "1"));
  if (!area || area > product.totalArea) return alert("Miqdor noto‘g‘ri!");

  const qty = area / product.size;
  product.totalArea -= area;
  product.quantity -= qty;

  addSale(product, qty, area);
}

// === Dona bo‘yicha sotish ===
function sellByPiece(index) {
  const product = products[index];
  let qty = parseFloat(prompt("Sotiladigan miqdor (dona):", "1"));
  if (!qty || qty > product.quantity) return alert("Miqdor noto‘g‘ri!");

  const area = qty * product.size;
  product.quantity -= qty;
  product.totalArea -= area;

  addSale(product, qty, area);
}

// === Sotilganlarni qo‘shish ===
function addSale(product, qty, area) {
  sales.push({
    time: new Date().toLocaleTimeString(),
    name: product.name,
    qty,
    area,
    sumSom: qty * product.saleSom,
    sumUsd: qty * product.saleUsd
  });

  renderProducts();
  renderSales();
}

// === O‘zgartirish ===
function editProduct(index) {
  const product = products[index];
  let newName = prompt("Yangi nom:", product.name);
  if (newName) product.name = newName;
  renderProducts();
}

// === O‘chirish ===
function deleteProduct(index) {
  if (confirm("Mahsulotni o‘chirishni xohlaysizmi?")) {
    products.splice(index, 1);
    renderProducts();
  }
}

// === Kod qidirish ===
document.getElementById("search-code").addEventListener("input", function () {
  renderProducts(this.value);
});

// === PDF saqlash ===
document.getElementById("save-pdf").addEventListener("click", function () {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Ombordagi mahsulotlar", 10, 10);

  let y = 20;
  products.forEach(p => {
    doc.text(`${p.code} - ${p.name} - ${roundQty(p.quantity)} dona (${p.totalArea.toFixed(3)} m²)`, 10, y);
    y += 8;
  });

  y += 10;
  doc.text("Sotilgan mahsulotlar", 10, y);
  y += 10;
  sales.forEach(s => {
    doc.text(`${s.time} - ${s.name} - ${roundQty(s.qty)} dona (${s.area.toFixed(3)} m²) - ${fmtSom(s.sumSom)}`, 10, y);
    y += 8;
  });

  doc.save("hisobot.pdf");
});

// === Boshlang‘ich render ===
renderProducts();
renderSales();
