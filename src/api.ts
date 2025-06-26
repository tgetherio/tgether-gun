import express, { Express } from "express";
import cors from "cors";
import { TgetherSDK } from "tgether-sdk-typescript";
import { PRIVATE_KEY, VERIFYING_CONTRACT, CHAIN_ID } from "./config";


const sdk = new TgetherSDK(
    PRIVATE_KEY,
    VERIFYING_CONTRACT,
    CHAIN_ID
  );
const orders: Record<string, any> = {};

interface Item {
  itemname: string;
  price: number;
  payers: string[];
}


export const createApi = (gun: any): Express => {
  const app = express();
  const sdk = new TgetherSDK(PRIVATE_KEY, VERIFYING_CONTRACT, CHAIN_ID);
  const orders: Record<string, any> = {};

  app.use(cors());
  app.use(express.json());

  // Create order
  app.post("/create-order", async (req, res) => {
    const { order, signature, totalAmount, items, users } = req.body;

    try {
      // const recovered = await sdk.verifySignature(order, signature);
      const recovered = "0x0000000000000000000000000000000000000000"
      if (VERIFYING_CONTRACT !== "0x0000000000000000000000000000000000000000") {
        const recovered = await sdk.verifySignature(order, signature);

        const isApproved = await sdk.isVendorApproved(order.vendorId, recovered);
        if (!isApproved) {
          res.status(403).json({ erro : "Signer is not an approved vendor" });
          return;
        }
      }
      const path = `vendor/${order.vendorId}/order/${order.vendorOrderId}`;
      const orderRef = gun.get(path);
  
      // 🔐 Set individual fields instead of nested put to avoid Gun errors
      orderRef.get("vendorId").put(order.vendorId);
      orderRef.get("vendorOrderId").put(order.vendorOrderId);
      orderRef.get("validUntil").put(order.validUntil);
      orderRef.get("nonce").put(order.nonce);
      orderRef.get("signature").put(signature);
      orderRef.get("signer").put(recovered);
      orderRef.get("totalAmount").put(totalAmount);
  
      // 🛒 Set itemized data
      const itemizedRef = orderRef.get("itemized");
  
      const itemList: Item[] = items?.items || [];
  
      const formatPayers = (arr: string[]) => {
        const obj: Record<string, boolean> = {};
        arr.forEach(p => obj[p] = true);
        return obj;
      };
  
      itemList.forEach((item: Item, index: number) => {
        const safeItem = {
          itemname: item.itemname,
          price: item.price,
          payers: formatPayers(item.payers),
        };
        itemizedRef.get("items").get(String(index)).put(safeItem);
      });
  
      // 👥 Create empty users map
      const usersRef = orderRef.get("users");
      (users || []).forEach((user: string) => {
        usersRef.get(user).put(true);
      });
      // 🔒 Save to memory for validation later if needed
      orders[path] = { order, signature, recovered };

      res.json({ message: "Order created", path });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Signature verification failed" });
    }
  });

  // Update order
  app.post("/update-order", async (req, res) => {
    const { vendorId, vendorOrderId, userAddress, splitMode, itemizedUpdate } = req.body;
    const path = `vendor/${vendorId}/order/${vendorOrderId}`;

    if (!orders[path]) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    gun.get(path).get("users").get(userAddress).put(true);
    if (splitMode) gun.get(path).get("splitMode").put(splitMode);

    if (itemizedUpdate?.items) {
      const itemizedRef = gun.get(path).get("itemized");
      itemizedUpdate.items.forEach((item: any, index: number) => {
        if (Array.isArray(item.payers)) {
          const payersRef = itemizedRef.get("items").get(String(index)).get("payers");
            item.payers.forEach((payer: string) => {
              payersRef.get(payer).put(true);
            });
        }
      });
    }

    res.json({ message: "Order updated" });
  });

  
  return app;


  
};
