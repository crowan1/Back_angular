const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");

const app = express();
const port = 3000;
const secret_jwt = "azerty123456789";

// Middleware
app.use(cors());
app.use(express.json());

// Connexion à la base de données MySQL
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "tier_list_dfs_24",
  connectionLimit: 10,
});

// Middleware d'authentification par JWT
function authenticateToken(req, res, next) {
  const jwt_utilisateur = req.headers.authorization?.split(' ')[1]; // Récupère le token après "Bearer"

  if (!jwt_utilisateur) {
    return res.status(403).json({ message: "Accès refusé : Token manquant" });
  }

  jwt.verify(jwt_utilisateur, secret_jwt, (err, donnees_jwt) => {
    if (err) {
      return res.status(403).json({ message: "Token invalide" });
    }
    req.user = donnees_jwt;
    next();
  });
}

// Route de connexion
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  connection.execute(
    `SELECT id FROM utilisateur WHERE email = ? AND password = ?`,
    [email, password],
    (err, rows) => {
      if (err) {
        console.error("Erreur lors de la connexion :", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }

      if (rows.length === 0) {
        return res.status(403).json({ message: "Identifiants incorrects" });
      }

      const jwt_utilisateur = jwt.sign({ sub: rows[0].id }, secret_jwt);
      res.status(200).json({ jwt: jwt_utilisateur });
    }
  );
});

// Route pour récupérer la liste des utilisateurs pour l'administration
app.get("/administration", authenticateToken, (req, res) => {
  connection.execute(
    `SELECT id, email, isBlocked FROM utilisateur`,
    (err, rows) => {
      if (err) {
        console.error("Erreur lors de la récupération des utilisateurs :", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }
      res.status(200).json(rows);
    }
  );
});

// Route pour mettre à jour le statut de blocage d'un utilisateur
app.put("/administration/:id", authenticateToken, (req, res) => {
  const userId = req.params.id;
  const { isBlocked } = req.body;

  if (typeof isBlocked === "undefined") {
    return res.status(400).json({ message: "Le statut de blocage est manquant" });
  }

  connection.execute(
    `UPDATE utilisateur SET isBlocked = ? WHERE id = ?`,
    [isBlocked, userId],
    (err, result) => {
      if (err) {
        console.error("Erreur lors de la mise à jour de l'utilisateur :", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      res.status(200).json({ message: "Statut de l'utilisateur mis à jour" });
    }
  );
});

// Route pour récupérer les catégories avec images d'un utilisateur connecté
app.get("/categories", authenticateToken, (req, res) => {
  connection.execute(
    `SELECT url, i.id AS id_image, c.id AS id_categorie, nom AS nom_categorie
     FROM image i
     RIGHT JOIN categorie c ON i.id_categorie = c.id
     WHERE c.id_utilisateur = ?`,
    [req.user.sub],
    (err, rows) => {
      if (err) {
        console.error("Erreur lors de la récupération des catégories :", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }

      const categories = rows.reduce((accumulateur, image) => {
        const categorieExistante = accumulateur.find(
          (categorie) => categorie.nom === image.nom_categorie
        );

        if (categorieExistante) {
          if (image.url) categorieExistante.images.push(image.url);
        } else {
          accumulateur.push({
            nom: image.nom_categorie,
            id: image.id_categorie,
            images: image.url ? [image.url] : [],
          });
        }

        return accumulateur;
      }, []);

      res.status(200).json(categories);
    }
  );
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en écoute sur le port ${port}`);
});
