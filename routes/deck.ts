import { Router } from "express";

const deckRouter = Router();

deckRouter.get("/deck", (req, res) => {
    res.send('Deck Runnning')
  });

export default deckRouter;