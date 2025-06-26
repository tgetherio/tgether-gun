import { describe, it, expect, beforeAll, afterAll } from "vitest";
import axios from "axios";
import http from "http";
import { createApi } from "../src/api";
import { TgetherSDK } from "tgether-sdk-typescript";
import { VERIFYING_CONTRACT, CHAIN_ID } from "../src/config";

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

let server: http.Server;
const vendorPrivateKey =
  "0x59c6995e998f97a5a0044966f094538c1f62d44e9d3c7ec2ce9e5d5e7b8d2f48";
const vendorId = 1;
const vendorOrderId = "abc123";
const totalAmount = 500;
const userAddress = "0x1000000000000000000000000000000000000000";

const sdk = new TgetherSDK(vendorPrivateKey, VERIFYING_CONTRACT, CHAIN_ID);

beforeAll(async () => {
  const app = createApi();
  server = app.listen(PORT, () => {
    console.log("Test server running on port", PORT);
  });
  await new Promise((resolve) => setTimeout(resolve, 100)); // small delay to ensure server is live
});

afterAll(() => {
  server.close(() => {
    console.log("Test server stopped");
  });
});

describe("Tgether API Integration", () => {
  it("should create a valid order", async () => {
    const signed = await sdk.signOrder(vendorId, vendorOrderId, totalAmount);

    const res = await axios.post(`${BASE_URL}/create-order`, {
      order: signed.order,
      signature: signed.signature,
      items: {
        items: [
          { itemname: "Burger", price: 250, payers: [] },
          { itemname: "Fries", price: 250, payers: [] },
        ],
        tax: 0,
      },
    });

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("path");
  });

  it("should update an order with user info and split mode", async () => {
    const res = await axios.post(`${BASE_URL}/update-order`, {
      vendorId,
      vendorOrderId,
      userAddress,
      splitMode: "custom",
      itemizedUpdate: {
        items: [
          { payers: [userAddress] },
          { payers: [userAddress] },
        ],
      },
    });

    expect(res.status).toBe(200);
    expect(res.data.message).toMatch(/updated/i);
  });
});
