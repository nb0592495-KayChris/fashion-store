
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PRODUCTS = {
  "1": { title: "NOIR ESSENTIALS", price: 85, image: "/models/model1.png", sizes: ["S", "M", "L", "XL"], inStock: true },
  "2": { title: "AFTER HOURS", price: 95, image: "/models/model2.png", sizes: ["S", "M", "L", "XL"], inStock: true },
  "3": { title: "FORM & FUNCTION", price: 75, image: "/models/model3.png", sizes: ["S", "M", "L", "XL"], inStock: true },
  "4": { title: "RAW CULTURE", price: 110, image: "/models/model4.png", sizes: ["S", "M", "L", "XL"], inStock: true },
  "5": { title: "NEW SEASON", price: 90, image: "/models/model5.png", sizes: [], inStock: true },
  "6": { title: "THE EDIT", price: 80, image: "/models/model6.png", sizes: [], inStock: true },
};

type OrderItemInput = {
  product_id: string | number;
  quantity: number;
  selected_size?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOrderItemInput(
  value: Record<string, unknown>,
): value is Record<string, unknown> & OrderItemInput {
  return (
    (typeof value.product_id === "string" ||
      typeof value.product_id === "number") &&
    typeof value.quantity === "number" &&
    (value.selected_size === undefined ||
      value.selected_size === null ||
      typeof value.selected_size === "string")
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405, headers: corsHeaders },
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json(
        { error: "Server configuration is incomplete." },
        { status: 500, headers: corsHeaders },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "Request body must be valid JSON." },
        { status: 400, headers: corsHeaders },
      );
    }

    if (!isRecord(body)) {
      return Response.json(
        { error: "Please provide valid customer, shipping, and item details." },
        { status: 400, headers: corsHeaders },
      );
    }

    const {
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      shipping_city,
      shipping_country = "Ghana",
      items,
    } = body;

    const normalizedEmail =
      typeof customer_email === "string" ? customer_email.trim() : "";

    if (
      typeof customer_name !== "string" ||
      !customer_name.trim() ||
      customer_name.length > 150 ||
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      typeof customer_phone !== "string" ||
      !customer_phone.trim() ||
      customer_phone.length > 40 ||
      typeof shipping_address !== "string" ||
      !shipping_address.trim() ||
      shipping_address.length > 500 ||
      typeof shipping_country !== "string" ||
      !shipping_country.trim() ||
      shipping_country.length > 100 ||
      (shipping_city != null &&
        (typeof shipping_city !== "string" ||
          !shipping_city.trim() ||
          shipping_city.length > 100)) ||
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 50
    ) {
      return Response.json(
        { error: "Please provide valid customer, shipping, and item details." },
        { status: 400, headers: corsHeaders },
      );
    }

    const orderItems: Array<{
      product_id: string;
      product_title: string;
      product_image: string;
      selected_size: string | null;
      quantity: number;
      unit_price: number;
      line_total: number;
    }> = [];
    let subtotal = 0;

    for (const value of items) {
      if (!isRecord(value) || !isOrderItemInput(value)) {
        return Response.json(
          {
            error:
              "Each item must have a valid product ID, quantity, and optional size.",
          },
          { status: 400, headers: corsHeaders },
        );
      }

      const item = value;
      const productId = String(item.product_id);
      const product = PRODUCTS[productId as keyof typeof PRODUCTS];

      if (!product || !product.inStock) {
        return Response.json(
          { error: `Product ${productId || "unknown"} is unavailable.` },
          { status: 400, headers: corsHeaders },
        );
      }

      const quantity = item.quantity;

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 20
      ) {
        return Response.json(
          { error: "Each quantity must be between 1 and 20." },
          { status: 400, headers: corsHeaders },
        );
      }

      const size = item.selected_size ?? null;

      if (
        product.sizes.length > 0 &&
        (typeof size !== "string" || !product.sizes.includes(size))
      ) {
        return Response.json(
          { error: `Choose a valid size for ${product.title}.` },
          { status: 400, headers: corsHeaders },
        );
      }

      if (product.sizes.length === 0 && size != null && size !== "") {
        return Response.json(
          { error: `${product.title} does not have size options.` },
          { status: 400, headers: corsHeaders },
        );
      }

      const lineTotal = product.price * quantity;
      subtotal += lineTotal;

      orderItems.push({
        product_id: productId,
        product_title: product.title,
        product_image: product.image,
        selected_size: size || null,
        quantity,
        unit_price: product.price,
        line_total: lineTotal,
      });
    }

    // Shipping is zero until a real shipping policy is configured.
    const shippingFee = 0;
    const total = subtotal + shippingFee;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: customer_name.trim(),
        customer_email: normalizedEmail.toLowerCase(),
        customer_phone: customer_phone.trim(),
        shipping_address: shipping_address.trim(),
        shipping_city: shipping_city?.trim() || null,
        shipping_country: shipping_country.trim(),
        currency: "GHS",
        subtotal,
        shipping_fee: shippingFee,
        total,
        status: "pending",
      })
      .select("id, order_number, total, currency, status")
      .single();

    if (orderError || !order) {
      console.error("Order insert failed:", orderError);
      return Response.json(
        { error: "Could not create your order." },
        { status: 500, headers: corsHeaders },
      );
    }

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems.map((item) => ({ ...item, order_id: order.id })));

    if (itemsError) {
      console.error("Order items insert failed:", itemsError);

      // Avoid leaving an incomplete order behind.
      const { error: rollbackError } = await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

      if (rollbackError) {
        console.error("Incomplete order rollback failed:", rollbackError);
      }

      return Response.json(
        { error: "Could not save order items." },
        { status: 500, headers: corsHeaders },
      );
    }

    return Response.json(
      {
        order: {
          id: order.id,
          order_number: order.order_number,
          total: order.total,
          currency: order.currency,
          status: order.status,
        },
        message: "Pending order created. Payment has not been taken.",
      },
      { status: 201, headers: corsHeaders },
    );
  } catch (error) {
    console.error("create-order error:", error);

    return Response.json(
      { error: "Unable to process the request." },
      { status: 500, headers: corsHeaders },
    );
  }
});
