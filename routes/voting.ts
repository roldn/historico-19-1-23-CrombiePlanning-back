import { Router } from "express";
import { getVote } from "../controllers/votingController";

const votingRouter = Router();

votingRouter.get("/voting", getVote);

export default votingRouter;