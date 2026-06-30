import { BlueprintNode } from '../types/blueprint';

export interface CalculatedQuery {
  subject?: string;
  topic?: string;
  subTopic?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'All';
  limit: number;
}

/**
 * Uses the Largest Remainder Method to proportionally distribute integers.
 * E.g., Distributing 10 items based on [33.3%, 33.3%, 33.3%] results in [3, 3, 4] exactly.
 */
function distributeByLargestRemainder(targetTotal: number, nodes: { node: any, decimalLimit: number }[]) {
  // 1. Initial down-rounded allocation
  nodes.forEach((n: any) => {
    n.node._calculatedCount = Math.floor(n.decimalLimit);
  });

  // 2. Calculate remaining slots to fill
  let currentTotal = nodes.reduce((sum, n) => sum + (n.node._calculatedCount || 0), 0);
  let remainder = targetTotal - currentTotal;

  // 3. Sort by the largest fractional decimal part
  const sortedNodes = [...nodes].sort((a, b) => {
    const fractionA = a.decimalLimit - Math.floor(a.decimalLimit);
    const fractionB = b.decimalLimit - Math.floor(b.decimalLimit);
    return fractionB - fractionA; // Descending
  });

  // 4. Distribute the remainder 1 by 1
  for (let i = 0; i < remainder; i++) {
    const idx = i % sortedNodes.length;
    sortedNodes[idx].node._calculatedCount = (sortedNodes[idx].node._calculatedCount || 0) + 1;
  }
}

/**
 * Recursively calculates the exact question count for each node in the blueprint tree.
 */
export function calculateBlueprintAllocations(targetTotal: number, nodes: BlueprintNode[]): BlueprintNode[] {
  // We need to work with a clone so we don't mutate state directly before saving
  const clonedNodes: (BlueprintNode & { _calculatedCount?: number })[] = JSON.parse(JSON.stringify(nodes));

  // Determine fixed counts vs percentages at this level
  let fixedCountTotal = 0;
  const percentageNodes: { node: any, decimalLimit: number }[] = [];

  clonedNodes.forEach(node => {
    if (node.allocationType === 'count') {
      node._calculatedCount = node.allocationValue;
      fixedCountTotal += node.allocationValue;
    }
  });

  const remainingForPercentages = Math.max(0, targetTotal - fixedCountTotal);

  clonedNodes.forEach(node => {
    if (node.allocationType === 'percentage') {
      const decimalLimit = (node.allocationValue / 100) * remainingForPercentages;
      percentageNodes.push({ node, decimalLimit });
    }
  });

  if (percentageNodes.length > 0) {
    distributeByLargestRemainder(remainingForPercentages, percentageNodes);
  }

  // Recursively calculate children based on parent's allocated count
  clonedNodes.forEach(node => {
    if (node.children && node.children.length > 0) {
      node.children = calculateBlueprintAllocations(node._calculatedCount || 0, node.children);
    }
  });

  return clonedNodes;
}

/**
 * Flattens the calculated tree into an array of DB queries.
 * Only leaf nodes (nodes with 0 children) or nodes that consume their full allocation
 * generate actual queries.
 */
export function generateQueriesFromTree(nodes: any[], parentFilters: any = {}): CalculatedQuery[] {
  let queries: CalculatedQuery[] = [];

  nodes.forEach(node => {
    const currentFilters = { ...parentFilters };
    if (node.type === 'subject') currentFilters.subject = node.value;
    if (node.type === 'topic') currentFilters.topic = node.value;
    if (node.type === 'subTopic') currentFilters.subTopic = node.value;

    const limit = node._calculatedCount || 0;

    if (limit <= 0) return;

    if (!node.children || node.children.length === 0) {
      // Leaf node, generate query
      queries.push({
        ...currentFilters,
        difficulty: node.difficulty,
        limit
      });
    } else {
      // It has children. The children queries will sum up to this limit.
      const childQueries = generateQueriesFromTree(node.children, currentFilters);
      queries = [...queries, ...childQueries];
    }
  });

  return queries;
}
