import { NextResponse } from "next/server";
import { getPayPalAccessToken } from "@/lib/paypal";

export async function POST() {
  const accessToken = await getPayPalAccessToken();

  const res = await fetch(
    `${process.env.PAYPAL_BASE}/v2/checkout/orders`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "GBP",
              value: "5.00",
            },
          },
        ],
      }),
    }
  );

  const data = await res.json();

  return NextResponse.json({ id: data.id });
}