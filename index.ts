import express from "express"
import cors from "cors";
import appRouter from "./routes";

const app = express()
const port = 3000

app.use(cors());
app.use(express.json());

app.use("/", appRouter);

app.get('/', (req, res) => {
  res.send('Backend Runnning')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})