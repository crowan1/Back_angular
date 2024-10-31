const express = require('express')
const cors =require ("cors");
const app = express()
const port = 3000

app.use(cors())


app.get('/test', (req, res) => {
    const tableau = ["tata", "toto", "titi"]

  res.send(JSON.stringify(tableau))
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});