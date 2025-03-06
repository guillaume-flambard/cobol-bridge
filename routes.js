import express from "express";
import { database } from "./database.js";
import { clients, transactions } from "./schema.js";
import { and, gte, lte, eq } from "drizzle-orm";
import { format } from "fast-csv";
import { promises as fs } from "fs";
import path from "path";
import fastcsv from "fast-csv";
import { verifyToken } from "./middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /clients:
 *   get:
 *     summary: Récupère la liste des clients
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des clients
 *       401:
 *         description: Non autorisé
 */
router.get("/clients", verifyToken, async (req, res) => {
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
 *     security:
 *       - BearerAuth: []
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
 *       401:
 *         description: Non autorisé
 */
router.post("/transactions", verifyToken, async (req, res) => {
  try {
    const { clientId, amount } = req.body;

    const client = await database.select().from(clients).where(eq(clients.id, clientId)).get();
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    await database.insert(transactions).values({ clientId, amount });
    await database.update(clients).set({ balance: client.balance + amount }).where(eq(clients.id, clientId));

    res.json({ message: "Transaction saved" });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Récupère la liste des transactions avec filtrage avancé
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: integer
 *         description: ID du client
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Montant minimum
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Montant maximum
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Date de début (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: Date de fin (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Liste des transactions filtrées
 *       401:
 *         description: Non autorisé
 */
router.get("/transactions", verifyToken, async (req, res) => {
  try {
    const { clientId, minAmount, maxAmount, startDate, endDate } = req.query;
    const conditions = [];

    if (clientId) {
      conditions.push(eq(transactions.clientId, parseInt(clientId)));
    }
    if (minAmount) {
      conditions.push(gte(transactions.amount, parseFloat(minAmount)));
    }
    if (maxAmount) {
      conditions.push(lte(transactions.amount, parseFloat(maxAmount)));
    }
    if (startDate) {
      conditions.push(gte(transactions.createdAt, new Date(startDate).toISOString()));
    }
    if (endDate) {
      conditions.push(lte(transactions.createdAt, new Date(endDate).toISOString()));
    }

    const data = await database
      .select()
      .from(transactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json(data);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Formate une date au format "DD Mois YYYY, HHhmm"
 * @param {string} dateStr - Date au format ISO
 * @returns {string} Date formatée
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day} ${month} ${year}, ${hours}h${minutes}`;
}

/**
 * @swagger
 * /transactions/export:
 *   get:
 *     summary: Exporte les transactions en CSV
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: integer
 *         description: ID du client
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Montant minimum
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Montant maximum
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Date de début (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: Date de fin (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Fichier CSV des transactions
 *       401:
 *         description: Non autorisé
 */
router.get("/transactions/export", verifyToken, async (req, res) => {
  try {
    const { clientId, minAmount, maxAmount, startDate, endDate } = req.query;
    const conditions = [];

    if (clientId) {
      conditions.push(eq(transactions.clientId, parseInt(clientId)));
    }
    if (minAmount) {
      conditions.push(gte(transactions.amount, parseFloat(minAmount)));
    }
    if (maxAmount) {
      conditions.push(lte(transactions.amount, parseFloat(maxAmount)));
    }
    if (startDate) {
      conditions.push(gte(transactions.createdAt, new Date(startDate).toISOString()));
    }
    if (endDate) {
      conditions.push(lte(transactions.createdAt, new Date(endDate).toISOString()));
    }

    // Récupérer les transactions avec les informations des clients
    const data = await database
      .select({
        transactionId: transactions.id,
        clientId: transactions.clientId,
        clientName: clients.name,
        amount: transactions.amount,
        createdAt: transactions.createdAt
      })
      .from(transactions)
      .leftJoin(clients, eq(transactions.clientId, clients.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Transformer les données pour le CSV
    const formattedData = data.map(row => ({
      "Transaction ID": row.transactionId,
      "Client": row.clientName,
      "Montant (€)": row.amount.toFixed(2),
      "Date": formatDate(row.createdAt)
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');

    fastcsv
      .write(formattedData, { 
        headers: true,
        delimiter: ';' // Utiliser ; comme délimiteur pour une meilleure compatibilité avec Excel en France
      })
      .pipe(res);

  } catch (error) {
    console.error("Error exporting transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;