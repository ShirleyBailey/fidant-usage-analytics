import { Request, Response, NextFunction } from 'express'

export interface AuthRequest extends Request {
  user?: { id: number }
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // mock user
  req.user = { id: 1 }
  next()
}