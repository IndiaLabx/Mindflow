import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, Plus, Trash2, Save, X, Target } from 'lucide-react';
import { Button } from '@/components/Button/Button';
import { ExamBlueprint, BlueprintNode } from '@/features/blueprints/types/blueprint';
import { v4 as uuidv4 } from 'uuid';
import { fetchQuestionMetadata } from '@/features/quiz/services/questionService';
import { useQuestionIndex } from '@/features/quiz/hooks/useQuestionIndex';
import { Question } from '@/features/quiz/types';
import { CookingLoader } from '@/features/quiz/components/CookingLoader';

interface BlueprintBuilderProps {
  initialData?: ExamBlueprint;
  onSave: (blueprint: ExamBlueprint) => void;
  onCancel: () => void;
  onLaunch?: (blueprint: ExamBlueprint) => void;
  metadataIndex?: Record<string, Record<string, Set<string>>>;
}

const NodeItem = ({ node, updateNode, deleteNode, depth = 0, metadataIndex, parentValues = {} }: { node: BlueprintNode, updateNode: (n: BlueprintNode) => void, deleteNode: () => void, depth?: number, metadataIndex?: Record<string, Record<string, Set<string>>>, parentValues?: Record<string, string> }) => {
  const [expanded, setExpanded] = useState(true);

  const handleAddChild = () => {
    const childType = node.type === 'subject' ? 'topic' : 'subTopic';
    updateNode({
      ...node,
      children: [...(node.children || []), {
        id: uuidv4(),
        name: `New ${childType}`,
        type: childType,
        value: '',
        allocationType: 'percentage',
        allocationValue: 100,
        difficulty: 'All',
        children: []
      }]
    });
    setExpanded(true);
  };

  const updateChild = (childId: string, updated: BlueprintNode) => {
    updateNode({
      ...node,
      children: node.children.map(c => c.id === childId ? updated : c)
    });
  };

  const deleteChild = (childId: string) => {
    updateNode({
      ...node,
      children: node.children.filter(c => c.id !== childId)
    });
  };

  const availableOptions = useMemo(() => {
    if (!metadataIndex || !metadataIndex[node.type]) return [];

    // Cascading logic
    // We want to find the valid IDs based on parent values
    let validIds: Set<string> | null = null;

    for (const [parentKey, parentVal] of Object.entries(parentValues)) {
      if (!parentVal) continue;
      const ids = metadataIndex[parentKey]?.[parentVal];
      if (!ids) continue;

      if (validIds === null) {
        validIds = new Set(ids);
      } else {
        const intersected = new Set<string>();
        validIds.forEach(id => {
          if (ids.has(id)) {
            intersected.add(id);
          }
        });
        validIds = intersected;
      }

      if (validIds.size === 0) break;
    }

    const options = Object.entries(metadataIndex[node.type])
      .filter(([val, ids]) => {
         if (val.trim().length === 0) return false;
         if (validIds === null) return true; // No parent constraints
         // Intersect
         for (const id of ids) {
           if (validIds.has(id)) return true;
         }
         return false;
      })
      .map(([val]) => val)
      .sort();

    return options;
  }, [metadataIndex, node.type, parentValues]);

  return (
    <div className={`mt-2 border border-white/10 rounded-lg overflow-hidden bg-white/5 ${depth > 0 ? 'ml-6' : ''}`}>
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white/5">
        <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-white/10 rounded">
          {node.children?.length > 0 ? (expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : <div className="w-4 h-4" />}
        </button>

        <select
          value={node.type}
          onChange={(e) => updateNode({...node, type: e.target.value as any})}
          className="bg-black border border-white/20 rounded p-1 text-sm text-white focus:outline-none focus:border-purple-500"
        >
          <option value="subject">Subject</option>
          <option value="topic">Topic</option>
          <option value="subTopic">Sub-Topic</option>
        </select>

        {availableOptions.length > 0 ? (
          <select
            value={node.value}
            onChange={(e) => updateNode({...node, value: e.target.value, name: e.target.value})}
            className="bg-black border border-white/20 rounded p-1 text-sm text-white focus:outline-none focus:border-purple-500 min-w-[100px] flex-1"
          >
            <option value="" disabled>Select {node.type}</option>
            {availableOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={node.value}
            onChange={(e) => updateNode({...node, value: e.target.value, name: e.target.value})}
            placeholder={`e.g. ${node.type}`}
            className="bg-black border border-white/20 rounded p-1 text-sm text-white focus:outline-none focus:border-purple-500 min-w-[100px] flex-1"
          />
        )}

        <div className="flex items-center space-x-1 bg-black border border-white/20 rounded overflow-hidden">
          <input
            type="number"
            min="0"
            max={node.allocationType === 'percentage' ? 100 : 9999}
            value={node.allocationValue}
            onChange={(e) => updateNode({...node, allocationValue: Number(e.target.value)})}
            className="bg-transparent p-1 w-16 text-sm text-center text-white focus:outline-none"
          />
          <button
            onClick={() => updateNode({...node, allocationType: node.allocationType === 'percentage' ? 'count' : 'percentage'})}
            className="px-2 py-1 bg-white/10 hover:bg-white/20 text-xs font-bold border-l border-white/20 transition-colors"
          >
            {node.allocationType === 'percentage' ? '%' : '#'}
          </button>
        </div>

        <select
          value={node.difficulty}
          onChange={(e) => updateNode({...node, difficulty: e.target.value as any})}
          className="bg-black border border-white/20 rounded p-1 text-sm text-white focus:outline-none focus:border-purple-500"
        >
          <option value="All">Any Diff</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <div className="flex-1 min-w-[10px]" />

        {node.type !== 'subTopic' && (
          <button onClick={handleAddChild} className="p-1.5 text-blue-400 hover:bg-blue-400/20 rounded transition-colors" title="Add Child Node" aria-label="Add item">
            <Plus className="w-4 h-4" />
          </button>
        )}
        <button onClick={deleteNode} className="p-1.5 text-red-400 hover:bg-red-400/20 rounded transition-colors" aria-label="Delete item">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {expanded && node.children && node.children.length > 0 && (
        <div className="p-3 pt-0">
          {node.children.map(child => (
             <NodeItem
                key={child.id}
                node={child}
                updateNode={(n) => updateChild(child.id, n)}
                deleteNode={() => deleteChild(child.id)}
                depth={depth + 1}
                metadataIndex={metadataIndex}
                parentValues={{ ...parentValues, [node.type]: node.value }}
              />
          ))}
        </div>
      )}
    </div>
  );
};

export const BlueprintBuilder: React.FC<BlueprintBuilderProps> = ({ initialData, onSave, onCancel, onLaunch, metadataIndex }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [totalQuestions, setTotalQuestions] = useState(initialData?.totalQuestions || 100);
  const [nodes, setNodes] = useState<BlueprintNode[]>(initialData?.nodes || []);

  const handleAddRootNode = () => {
    setNodes([...nodes, {
      id: uuidv4(),
      name: 'New Subject',
      type: 'subject',
      value: '',
      allocationType: 'percentage',
      allocationValue: 100,
      difficulty: 'All',
      children: []
    }]);
  };

  const updateRootNode = (nodeId: string, updated: BlueprintNode) => {
    setNodes(nodes.map(n => n.id === nodeId ? updated : n));
  };

  const deleteRootNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
  };

  const handleSave = () => {
    if (!name.trim()) return alert('Blueprint needs a name');
    if (nodes.length === 0) return alert('Add at least one node');
    onSave({
      id: initialData?.id,
      name,
      totalQuestions,
      nodes
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
             <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Blueprint Name (e.g. UPSC Prelims)"
              className="w-full bg-transparent border-b border-white/20 px-2 py-2 text-2xl font-bold focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={onCancel} variant="secondary">Cancel</Button>
            <Button onClick={handleSave} variant="primary" className="bg-purple-600 hover:bg-purple-700">
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
            {initialData && onLaunch && (
               <Button onClick={() => onLaunch({ id: initialData.id, name, totalQuestions, nodes })} variant="primary" className="bg-green-600 hover:bg-green-700">
                  Run
               </Button>
            )}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center space-x-3">
               <Target className="w-5 h-5 text-purple-400" />
               <span className="font-semibold text-lg">Total Target Questions</span>
            </div>
            <input
              type="number"
              min="1"
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(Number(e.target.value))}
              className="bg-black border border-white/20 rounded px-3 py-2 text-center text-xl font-bold text-white focus:outline-none focus:border-purple-500 w-24"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-300">Distribution Architecture</h3>
              <Button onClick={handleAddRootNode} className="py-1.5 px-3 text-sm bg-white/10 hover:bg-white/20">
                <Plus className="w-4 h-4 mr-1.5" /> Add Root Subject
              </Button>
            </div>

            {nodes.length === 0 ? (
               <div className="text-center py-8 border border-dashed border-white/20 rounded-lg text-gray-500">
                  Click 'Add Root Subject' to start building your exam architecture.
               </div>
            ) : (
               <div className="space-y-3">
                {nodes.map(node => (
                  <NodeItem
                    key={node.id}
                    node={node}
                    updateNode={(n) => updateRootNode(node.id, n)}
                    deleteNode={() => deleteRootNode(node.id)}
                    metadataIndex={metadataIndex}
                  />
                ))}
               </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
