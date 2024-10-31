const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;
const jwt = require("jsonwebtoken");
const secret_jwt = "azerty123456789";

app.use(cors());
app.use(express.json());

const mysql = require("mysql2");
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "tier_list_dfs_24",
  connectionLimit: 10,
});

function authenticateToken(req, res, next) {

  //on recupere le jwt dans le header authorization
  const jwt_utilisateur = req.headers.authorization;

  //si il n'y a pas d'entete authorization on bloque la requete
  if (!jwt_utilisateur) {
    res.status(403).send();
  } else {
    //on vérifie que le JWT est valide
    jwt.verify(jwt_utilisateur, secret_jwt, (err, donnees_jwt) => {
      //si la signature ne correspond pas ou si le jwt est invalide
      if (err) return res.sendStatus(403);

      req.user = donnees_jwt;

      next();
    });
  }
}

app.post("/login", (req, res) => {
  const utilisateur = req.body;

  connection.execute(
    `SELECT id
    FROM utilisateur u
    WHERE u.email = ?
    AND u.password = ?`,
    [utilisateur.email, utilisateur.password],
    (err, rows) => {
      if (err) throw err;

      //si l'utilisateur n'a pas été trouvé
      if (rows.length == 0) {
        res.status(403).send();
      } else {
        const jwt_utilisateur = jwt.sign({ sub: rows[0].id }, secret_jwt, {});

        res.status(200).send(JSON.stringify({ jwt: jwt_utilisateur }));
      }
    }
  );
});

app.get("/admin", authenticateToken, (req, res) => {
    connection.execute(
      `SELECT email FROM utilisateur`,  
      (err, rows) => {
        if (err) {
          console.error("Erreur lors de la récupération des utilisateurs :", err);
          return res.status(500).send("Erreur serveur");
        }
        
        res.status(200).json(rows);
      }
    );
  });

app.get("/categories", authenticateToken, (req, res) => {
  connection.execute(
    ` SELECT url, i.id AS id_image, c.id as id_categorie, nom AS nom_categorie
          FROM image i
          RIGHT JOIN categorie c ON i.id_categorie = c.id
          WHERE c.id_utilisateur = ?`,
    [req.user.sub],
    (err, rows) => {
      if (err) throw err;

      const categories = rows.reduce((accumulateur, image) => {


        const categorieExistante = accumulateur.filter(
          (categorie) => categorie.nom == image.nom_categorie
        );

        if (categorieExistante.length >= 1) {
          categorieExistante[0].images.push(image.url);
        } else {
          accumulateur.push({
            nom: image.nom_categorie,
            id: image.id_categorie,
            images: image.url ? [image.url] : [],
          });
        }

        return accumulateur;
      }, []);

      res.send(JSON.stringify(categories));
    }
  );
});

app.put("/administration/:id", authenticateToken, (req, res) => {
    const userId = req.params.id; 
    const { isBlocked } = req.body; 

    connection.execute(
      `UPDATE utilisateur SET isBlocked = ? WHERE id = ?`,
      [isBlocked, userId],
      (err, result) => {
        if (err) {
          console.error("Erreur lors de la mise à jour de l'utilisateur :", err);
          return res.status(500).send("Erreur serveur");
        }

        res.status(200).send("Statut de l'utilisateur mis à jour");
      }
    );
});
  app.get("/administration", authenticateToken, (req, res) => {
    connection.execute(
      `SELECT email FROM utilisateur`,  
      (err, rows) => {
        if (err) {
          console.error("Erreur lors de la récupération des utilisateurs :", err);
          return res.status(500).send("Erreur serveur");
        }
        
        res.status(200).json(rows);
      }
    );
  });
  

app.listen(port, () => {
  console.log(`Example app listening on port ${port} !!!!!!`);
});