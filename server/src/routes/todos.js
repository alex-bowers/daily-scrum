import { Router } from 'express';
import { getDb } from '../db/database.js';
import { broadcast } from '../ws/socket.js';

const router = Router();

router.get('/:username/:date', (req, res) => {
  const { username, date } = req.params;
  const rows = getDb()
    .prepare('SELECT * FROM todos WHERE username = ? AND date = ? ORDER BY sort_order ASC, id ASC')
    .all(username, date);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { username, date, text } = req.body;
  if (!username || !date || !text) {
    return res.status(400).json({ error: 'username, date and text are required' });
  }

  const maxOrder = getDb()
    .prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM todos WHERE username = ? AND date = ?')
    .get(username, date);

  const info = getDb()
    .prepare(
      'INSERT INTO todos (username, date, text, completed, sort_order) VALUES (?, ?, ?, 0, ?)'
    )
    .run(username, date, text, maxOrder.m + 1);

  const todo = getDb().prepare('SELECT * FROM todos WHERE id = ?').get(info.lastInsertRowid);

  broadcast('todo:added', todo);
  res.status(201).json(todo);
});

router.put('/reorder', (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array required' });
  }
  const update = getDb().prepare('UPDATE todos SET sort_order = ? WHERE id = ?');
  getDb().transaction((rows) => {
    for (const { id, sort_order } of rows) {
      update.run(sort_order, id);
    }
  })(items);
  broadcast('todo:reordered', { items });
  res.status(204).end();
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { text, completed } = req.body;

  const existing = getDb().prepare('SELECT * FROM todos WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const newText = text !== undefined ? text : existing.text;
  const newCompleted = completed !== undefined ? (completed ? 1 : 0) : existing.completed;

  getDb()
    .prepare('UPDATE todos SET text = ?, completed = ? WHERE id = ?')
    .run(newText, newCompleted, id);

  const todo = getDb().prepare('SELECT * FROM todos WHERE id = ?').get(id);
  broadcast('todo:updated', todo);
  res.json(todo);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = getDb().prepare('SELECT * FROM todos WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  getDb().prepare('DELETE FROM todos WHERE id = ?').run(id);
  broadcast('todo:deleted', { id: Number(id) });
  res.status(204).end();
});

export default router;
