// 3-Way Inventory Management Engine: Physical, Booked, and Available For Sale

export class InventoryEngine {
  constructor(products = []) {
    this.products = [...products];
  }

  // Update products list
  setProducts(products) {
    this.products = [...products];
  }

  // Get live product details with 3-way stock
  getProductStock(productId) {
    const p = this.products.find((prod) => prod.id === productId);
    if (!p) return null;

    const physical = p.physical_stock || 0;
    const booked = p.booked_stock || 0;
    const available = Math.max(0, physical - booked);

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      unit: p.unit,
      unit_price: p.unit_price,
      physical_stock: physical,
      booked_stock: booked,
      available_stock: available,
      damaged_stock: p.damaged_stock || 0,
      reorder_level: p.reorder_level || 10,
      is_out_of_stock: available <= 0,
      substitute_ids: p.substitute_ids || []
    };
  }

  // Find in-stock substitute/alternative products
  getAvailableSubstitutes(productId) {
    const product = this.getProductStock(productId);
    if (!product || !product.substitute_ids.length) return [];

    return product.substitute_ids
      .map((subId) => this.getProductStock(subId))
      .filter((sub) => sub && sub.available_stock > 0);
  }

  // Validate order items against Available for Sale stock
  validateOrderQuantities(orderItems) {
    const issues = [];

    for (const item of orderItems) {
      const stock = this.getProductStock(item.product_id);
      if (!stock) {
        issues.push({ product_id: item.product_id, error: "Product not found" });
        continue;
      }

      if (item.quantity > stock.available_stock) {
        const substitutes = this.getAvailableSubstitutes(item.product_id);
        issues.push({
          product_id: item.product_id,
          product_name: stock.name,
          requested_qty: item.quantity,
          available_stock: stock.available_stock,
          error: `Insufficient available stock! Only ${stock.available_stock} ${stock.unit} available.`,
          substitutes
        });
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Commit order items to Booked Stock
  commitOrderBooking(orderItems) {
    for (const item of orderItems) {
      const p = this.products.find((prod) => prod.id === item.product_id);
      if (p) {
        p.booked_stock = (p.booked_stock || 0) + item.quantity;
        p.available_stock = Math.max(0, (p.physical_stock || 0) - p.booked_stock);
      }
    }
    return this.products;
  }

  // Release booking (e.g. order cancelled)
  releaseOrderBooking(orderItems) {
    for (const item of orderItems) {
      const p = this.products.find((prod) => prod.id === item.product_id);
      if (p) {
        p.booked_stock = Math.max(0, (p.booked_stock || 0) - item.quantity);
        p.available_stock = Math.max(0, (p.physical_stock || 0) - p.booked_stock);
      }
    }
    return this.products;
  }

  // Dispatch goods (Physical stock decreases, Booked stock decreases)
  fulfillDispatch(orderItems) {
    for (const item of orderItems) {
      const p = this.products.find((prod) => prod.id === item.product_id);
      if (p) {
        p.physical_stock = Math.max(0, (p.physical_stock || 0) - item.quantity);
        p.booked_stock = Math.max(0, (p.booked_stock || 0) - item.quantity);
        p.available_stock = Math.max(0, p.physical_stock - p.booked_stock);
      }
    }
    return this.products;
  }

  // Process Sales Return restock (Resellable vs Damaged)
  processRestock(productId, quantity, destination = "RESELLABLE") {
    const p = this.products.find((prod) => prod.id === productId);
    if (!p) return null;

    if (destination === "RESELLABLE") {
      p.physical_stock = (p.physical_stock || 0) + quantity;
      p.available_stock = Math.max(0, p.physical_stock - (p.booked_stock || 0));
    } else if (destination === "DAMAGED") {
      p.damaged_stock = (p.damaged_stock || 0) + quantity;
    }
    return p;
  }
}
