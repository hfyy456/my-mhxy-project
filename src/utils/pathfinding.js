/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-21 03:35:43
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-21 04:11:28
 */
export const findPathAStar = (gridData, cellTypesConfig, startNode, endNode) => {
  const { rows, cols, grid } = gridData;

  // Helper function to get a node's key for easy lookup
  const getNodeKey = (node) => `${node.row}-${node.col}`;

  // Heuristic function (Manhattan distance)
  const heuristic = (nodeA, nodeB) => {
    return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
  };

  const openSet = new Map(); // Stores nodes to be evaluated { key: node }
  const closedSet = new Set(); // Stores keys of evaluated nodes

  const start = { 
    ...startNode, 
    g: 0, 
    h: heuristic(startNode, endNode), 
    f: heuristic(startNode, endNode), 
    parent: null 
  };
  openSet.set(getNodeKey(start), start);

  while (openSet.size > 0) {
    // Get the node in openSet with the lowest f score
    let currentNode = null;
    let lowestF = Infinity;
    for (const node of openSet.values()) {
      if (node.f < lowestF) {
        lowestF = node.f;
        currentNode = node;
      }
    }

    // If end node is reached
    if (currentNode.row === endNode.row && currentNode.col === endNode.col) {
      const path = [];
      let temp = currentNode;
      while (temp) {
        path.unshift({ row: temp.row, col: temp.col });
        temp = temp.parent;
      }
      return path; // Path found
    }

    openSet.delete(getNodeKey(currentNode));
    closedSet.add(getNodeKey(currentNode));

    // Get neighbors (up, down, left, right)
    const neighbors = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Up, Down, Left, Right

    for (const [dr, dc] of directions) {
      const neighborRow = currentNode.row + dr;
      const neighborCol = currentNode.col + dc;

      // Check bounds
      if (neighborRow < 0 || neighborRow >= rows || neighborCol < 0 || neighborCol >= cols) {
        continue;
      }

      // Check if traversable (using movementCost from cellTypesConfig)
      const cellTypeStr = grid[neighborRow][neighborCol].type;
      const typeConfig = Object.values(cellTypesConfig).find(ct => ct.id === cellTypeStr);
      
      if (!typeConfig || typeConfig.movementCost === Infinity) {
        continue; // Not traversable
      }

      const neighborNode = {
        row: neighborRow,
        col: neighborCol,
        g: 0, // Will be calculated
        h: heuristic({ row: neighborRow, col: neighborCol }, endNode),
        f: 0, // Will be calculated
        parent: currentNode,
      };
      
      const neighborKey = getNodeKey(neighborNode);
      if (closedSet.has(neighborKey)) {
        continue; // Already evaluated
      }
      
      // Calculate tentative g score
      const tentativeGScore = currentNode.g + typeConfig.movementCost;

      const existingNeighborInOpenSet = openSet.get(neighborKey);
      if (!existingNeighborInOpenSet || tentativeGScore < existingNeighborInOpenSet.g) {
        neighborNode.g = tentativeGScore;
        neighborNode.f = neighborNode.g + neighborNode.h;
        openSet.set(neighborKey, neighborNode);
      }
    }
  }

  return []; // No path found
}; 