import { Router } from "express";
import authRouter from "./auth";
import deckRouter from "./deck";
import issuesRouter from "./issues";
import votingRouter from "./voting";

const appRouter = Router();

appRouter.use("/api", votingRouter, issuesRouter, deckRouter, authRouter);

export default appRouter;