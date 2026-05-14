import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../shared/prisma';

const router = Router();

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich' });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Ungültige E-Mail-Adresse oder Passwort' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Ungültige E-Mail-Adresse oder Passwort' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Server-Konfigurationsfehler' });
    return;
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, secret, { expiresIn: '8h' });

  res.json({ token, user: { id: user.id, email: user.email } });
});

export default router;
