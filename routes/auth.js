import express from 'express';
import bcrypt from 'bcryptjs';
import { database } from '../database.js';
import { users } from '../schema.js';
import { generateToken } from '../middleware/auth.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Données invalides
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, role = 'user' } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis" });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await database
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (existingUser) {
      return res.status(400).json({ error: "Nom d'utilisateur déjà utilisé" });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const [newUser] = await database
      .insert(users)
      .values({
        username,
        password: hashedPassword,
        role
      })
      .returning();

    // Générer le token
    const token = generateToken(newUser);

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      token
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       401:
 *         description: Identifiants invalides
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis" });
    }

    // Rechercher l'utilisateur
    const user = await database
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (!user) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    // Générer le token
    const token = generateToken(user);

    res.json({
      message: "Connexion réussie",
      token
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router; 