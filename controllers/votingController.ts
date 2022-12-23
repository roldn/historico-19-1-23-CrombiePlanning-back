import { Request, Response } from "express"

export const getVote = (req:Request, res:Response) => {
    res.send("getVote works")
}