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
    let jwt_utilisateur = req.headers.authorization;
  
    // Vérifie la présence du header et extrait le token sans "Bearer "
    if (!jwt_utilisateur) {
      return res.status(403).send('Token manquant');
    }
    
    if (jwt_utilisateur.startsWith("Bearer ")) {
      jwt_utilisateur = jwt_utilisateur.slice(7, jwt_utilisateur.length);
    }
  
    jwt.verify(jwt_utilisateur, secret_jwt, (err, donnees_jwt) => {
      if (err) return res.sendStatus(403); // En cas d'erreur de validation du token
  
      req.user = donnees_jwt;
      next();
    });
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


// Get ticket 
  app.get('/tickets', (req, res) => {
    connection.query('SELECT * FROM tickets', (err, results) => {
        if (err) return res.status(500).json({ error: err });

        const formattedResults = results.map(ticket => {
            return {
                ...ticket,
                created_at: ticket.created_at.toISOString().replace('T', ' ').replace('.000Z', ''),  
                resolved_at: ticket.resolved_at ? ticket.resolved_at.toISOString().replace('T', ' ').replace('.000Z', '') : null  
            };
        });

        res.json(formattedResults);
    });
});


// Post ticket
app.post("/createtickets", authenticateToken, (req, res) => {
    const { description, priority } = req.body;
  
    const query = `INSERT INTO tickets (description, priority) VALUES (?, ?)`;
    connection.execute(query, [description, priority], (err, results) => {
      if (err) {
        console.error("Error adding ticket:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
  
      res.status(201).json({ id: results.insertId, description, priority });
    });
  });
  

  

app.listen(port, () => {
  console.log(`Example app listening on port ${port} !!!!!!`);
});