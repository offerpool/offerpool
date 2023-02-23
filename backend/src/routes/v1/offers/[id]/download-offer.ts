import { base58 } from "../../../../utils/base-58.js";
import { logger } from "../../../../utils/logger.js";
import type { Response } from "express";
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export const downloadOffer = async (req: any, res: Response) => {
  try {
    const encodedHash = req.params.id;
    const offerId = Buffer.from(base58.decode(encodedHash));
    const result = await prisma.offer.findUnique({where: {id: offerId}, select: {offer: true}});
    if (result === null) {
      res.status(404);
    } else {
      const offer = result.offer;
      res.setHeader("Content-type", "text/plain");
      res.setHeader("Content-disposition", "attachment");
      res.send(offer);
    }
  } catch (error: any) {
    logger.error(
      { error: error?.message, query: req.query },
      "Error getting offers"
    );
    res.status(500).send();
  }
};
