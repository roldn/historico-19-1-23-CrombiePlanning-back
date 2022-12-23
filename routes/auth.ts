import { Router } from "express";

const authRouter = Router();

authRouter.get("/auth", (req, res) => {
    res.send('Auth Runnning')
  });

export default authRouter;