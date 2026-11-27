import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { contactsTable } from "@workspace/db/schema";
import { SubmitContactFormBody } from "@workspace/api-zod";
import { contactRateLimit } from "../lib/rate-limit";

const router: IRouter = Router();

router.post("/contact", contactRateLimit, async (req, res) => {
  const parsed = SubmitContactFormBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  try {
    await db.insert(contactsTable).values({
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      message: data.message,
    });

    res.json({ message: "Your message has been received. We'll be in touch soon!" });
  } catch (err) {
    req.log.error({ err }, "Failed to submit contact form");
    res.status(500).json({ error: "Failed to submit contact form" });
  }
});

export default router;
