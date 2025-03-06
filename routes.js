import express from "express";
import { database } from "./database.js";
import { clients, transactions } from "./schema.js";

const router = express.Router();

/**
 * @swagger
 * /clients:
 *   get:
 *     summary: Récupère la liste des clients
 *     responses:
 *       200:
 *         description: Liste des clients
 */
router.get("/clients", async (req, res) => {
  try {
    const data = await database.select().from(clients);
    res.json(data);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Ajouter une transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientId:
 *                 type: integer
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Transaction ajoutée
 */
router.post("/transactions", async (req, res) => {
  try {
    const { clientId, amount } = req.body;

    const client = await database.select().from(clients).where(clients.id.eq(clientId)).get();
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    await database.insert(transactions).values({ clientId, amount });
    await database.update(clients).set({ balance: client.balance + amount }).where(clients.id.eq(clientId));

    res.json({ message: "Transaction saved" });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;