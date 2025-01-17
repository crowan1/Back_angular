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



  app.get('/tickets', (req, res) => {
    connection.query('SELECT * FROM tickets', (err, results) => {
        if (err) return res.status(500).json({ error: err });
 
        const formattedResults = results.map(ticket => {
            return {
                ...ticket,
                created_at: ticket.created_at.toISOString().replace('.000Z', ''),  
                resolved_at: ticket.resolved_at ? ticket.resolved_at.toISOString().replace('.000Z', '') : null // Si applicable
            };
        });

        res.json(formattedResults);
    });
});



  

app.listen(port, () => {
  console.log(`Example app listening on port ${port} !!!!!!`);
});