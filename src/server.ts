import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './env';
import authRoutes from './routes/auth';
import itemRoutes from './routes/items';
import caseRoutes from './routes/cases';
import openRoutes from './routes/open';
import adminRoutes from './routes/admin';
import { requireAdmin, requireAuth } from './middleware/auth';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (_req, res) => {
  res.send('OpenCase backend is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/open', openRoutes);
app.use('/api/admin', requireAuth, adminRoutes);

// Admin HTML guarded by auth
app.get('/admin', requireAuth, requireAdmin, (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'admin.html'));
});

app.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT}`);
});