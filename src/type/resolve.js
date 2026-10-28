import { z } from "zod";

const resolveMarketSchema = z.object({
  result: z.enum(["yes", "no"]),
});

export {resolveMarketSchema}