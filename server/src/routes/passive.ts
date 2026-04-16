import { Router, type Request, type Response } from 'express';
import { validate } from '../middleware/validate';
import * as AuthService from '../services/AuthService';
import { PASSIVE_TREE } from '../../../shared/data';
import type { PassiveNode } from '../../../shared/types/passiveTree';

const router = Router();

// ── GET /tree ───────────────────────────────────────────────
router.get('/tree', (req: Request, res: Response): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Missing authorization' });
      return;
    }
    const token = authHeader.slice(7);
    const saveCode = AuthService.verifyToken(token);
    if (!saveCode) {
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    const saveData = AuthService.getSaveData(saveCode);
    if (!saveData) {
      res.status(404).json({ success: false, message: 'Save data not found' });
      return;
    }

    const allocatedNodes = saveData.passiveTree?.allocatedNodes ?? [];

    res.json({
      success: true,
      data: {
        nodes: PASSIVE_TREE,
        allocatedNodes,
      },
    });
  } catch (err) {
    console.error('[passive/tree]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /allocate ──────────────────────────────────────────
router.post(
  '/allocate',
  validate([{ name: 'nodeId', type: 'string', minLength: 1 }]),
  (req: Request, res: Response): void => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Missing authorization' });
        return;
      }
      const token = authHeader.slice(7);
      const saveCode = AuthService.verifyToken(token);
      if (!saveCode) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
        return;
      }

      const saveData = AuthService.getSaveData(saveCode);
      if (!saveData) {
        res.status(404).json({ success: false, message: 'Save data not found' });
        return;
      }

      const { nodeId } = req.body;

      // Find the node in the passive tree
      const node = PASSIVE_TREE.find((n: PassiveNode) => n.id === nodeId);
      if (!node) {
        res.status(404).json({ success: false, message: 'Passive node not found' });
        return;
      }

      // Initialize passiveTree if missing
      if (!saveData.passiveTree) saveData.passiveTree = { allocatedNodes: [] };
      const allocated = saveData.passiveTree.allocatedNodes;

      // Check max investment per node type
      const currentCount = allocated.filter((id: string) => id === nodeId).length;
      const maxByType: Record<string, number> = { start: 1, minor: 3, notable: 10, keystone: 5 };
      const maxLevel = maxByType[node.type] ?? 1;
      if (currentCount >= maxLevel) {
        res.status(400).json({ success: false, message: `최대 투자 횟수에 도달했습니다 (${currentCount}/${maxLevel})` });
        return;
      }

      // Start node is free and auto-allocated
      if (node.type === 'start') {
        saveData.passiveTree.allocatedNodes.push(nodeId);
        AuthService.saveProgress(saveCode, saveData);
        res.json({ success: true, saveData });
        return;
      }

      const MAX_BY_TYPE: Record<string, number> = { start: 1, minor: 3, notable: 10, keystone: 5 };

      // If already invested but not maxed, allow continued investment
      if (currentCount > 0) {
        // ok - keep investing in same node
      } else {
        // New node: check that a connected neighbor is at MAX level
        const hasMaxedNeighbor = node.connections.some((connId: string) => {
          const connNode = PASSIVE_TREE.find((n: PassiveNode) => n.id === connId);
          if (!connNode) return false;
          if (connNode.type === 'start') return allocated.includes(connNode.id);
          const connCount = allocated.filter((id: string) => id === connId).length;
          const connMax = MAX_BY_TYPE[connNode.type] ?? 1;
          return connCount >= connMax;
        });
        if (!hasMaxedNeighbor) {
          // Auto-allocate start node if nothing allocated yet
          const startNode = PASSIVE_TREE.find((n: PassiveNode) => n.type === 'start');
          if (startNode && !allocated.includes(startNode.id) && node.connections.includes(startNode.id)) {
            allocated.push(startNode.id);
          } else {
            res.status(400).json({ success: false, message: '이전 노드를 먼저 최대 레벨까지 투자해야 합니다' });
            return;
          }
        }
      }

      // Calculate available points (capped at 300 + prestige)
      const maxPassivePoints = 300 + (saveData.prestigeLevel ?? 0);
      const effectiveLevel = Math.min(saveData.level, maxPassivePoints);
      const totalUsedPoints = allocated.reduce((sum: number, nId: string) => {
        const n = PASSIVE_TREE.find((pn: PassiveNode) => pn.id === nId);
        return sum + (n?.cost ?? 0);
      }, 0);
      const availablePoints = effectiveLevel - totalUsedPoints;

      if (availablePoints < node.cost) {
        res.status(400).json({
          success: false,
          message: `패시브 포인트가 부족합니다 (필요: ${node.cost}, 보유: ${availablePoints})`,
        });
        return;
      }

      // Check class restriction
      if (node.requiredClass && node.requiredClass !== saveData.characterId) {
        res.status(400).json({ success: false, message: '해당 클래스 전용 노드입니다' });
        return;
      }

      saveData.passiveTree.allocatedNodes.push(nodeId);
      AuthService.saveProgress(saveCode, saveData);

      res.json({
        success: true,
        nodeId,
        saveData,
      });
    } catch (err) {
      console.error('[passive/allocate]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

// ── POST /reset ─────────────────────────────────────────────
router.post('/reset', (req: Request, res: Response): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Missing authorization' });
      return;
    }
    const token = authHeader.slice(7);
    const saveCode = AuthService.verifyToken(token);
    if (!saveCode) {
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    const saveData = AuthService.getSaveData(saveCode);
    if (!saveData) {
      res.status(404).json({ success: false, message: 'Save data not found' });
      return;
    }

    const RESET_COST = 10000;
    if (saveData.gold < RESET_COST) {
      res.status(400).json({ success: false, message: `골드가 부족합니다 (필요: ${RESET_COST.toLocaleString()})` });
      return;
    }

    saveData.gold -= RESET_COST;
    saveData.passiveTree = { allocatedNodes: [] };
    AuthService.saveProgress(saveCode, saveData);

    res.json({
      success: true,
      message: '패시브 트리가 초기화되었습니다.',
      saveData,
    });
  } catch (err) {
    console.error('[passive/reset]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
