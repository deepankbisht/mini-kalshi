import { z } from "zod";

const createMarketSchema = z.object({
  title: z.string().min(3),
  bet: z.enum(["yes", "no"]),
  initialAmount: z.number().int().positive(),
  expiry: z.coerce.date(),
});

const placeBetSchema = z.object({
  betamount: z.number().int().positive(),
});

export {createMarketSchema,placeBetSchema}