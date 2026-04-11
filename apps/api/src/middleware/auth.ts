import type { NextFunction, Request, Response } from "express";
import { verifyUserToken } from "../auth/jwt.js";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      const raw = req.headers.authorization;
      const token =
        raw?.startsWith("Bearer ") ? raw.slice(7).trim() : typeof req.query.token === "string" ? req.query.token : null;
      if (!token) {
        res.status(401).json({ error: "Missing authorization token" });
        return;
      }
      const v = await verifyUserToken(token);
      if (!v) {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
      }
      req.auth = { userId: v.sub, email: v.email, role: v.role };
      next();
    } catch (e) {
      next(e);
    }
  })();
}
