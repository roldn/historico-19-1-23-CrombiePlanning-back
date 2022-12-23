import { Router } from "express";

const issuesRouter = Router();

issuesRouter.get("/issues", (req, res) => {
    res.send('Voting Runnning')
  });

export default issuesRouter;