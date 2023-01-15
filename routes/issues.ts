import { Router } from "express";
import { getIssue } from "../controllers/issuesController";

const issuesRouter = Router();

issuesRouter.get("/", getIssue);

export default issuesRouter;