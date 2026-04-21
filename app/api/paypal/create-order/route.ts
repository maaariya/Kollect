import { NextResponse } from "next/server";

export async function POST() {
  try {
    // 1. Get PayPal access token
    const auth = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const authData = await auth.json();

    if (!auth.ok) {
      console.error("PayPal auth error:", authData);
      return NextResponse.json(
        { error: "Failed to get PayPal token" },
        { status: 500 }
      );
    }

    // 2. Create order
    const order = await fetch(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "USD",
                value: "5.00",
              },
            },
          ],
        }),
      }
    );

    const orderData = await order.json();

    if (!order.ok) {
      console.error("PayPal order error:", orderData);
      return NextResponse.json(
        { error: "Failed to create PayPal order" },
        { status: 500 }
      );
    }

    return NextResponse.json(orderData);

  } catch (err) {
    console.error("PayPal server error:", err);
    return NextResponse.json(
      { error: "Server error creating PayPal order" },
      { status: 500 }
    );
  }
}