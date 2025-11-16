
import React, { useState, useCallback, useEffect } from 'react';
import { generateMindMapData } from '../services/geminiService';
import { MindMapNode as MindMapNodeType } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/Card';
import { PlusCircle, MinusCircle, Trash2, Edit, Save, X, RotateCcw, RotateCw } from 'lucide-react';
import { produce } from 'immer';

// Helper to find and manipulate nodes recursively
const findAndMutateNode = (nodes: MindMapNodeType[], nodeId: string, action: (node: MindMapNodeType, parent: MindMapNodeType | null, index: number) => void) => {
    const find = (node: MindMapNodeType, parent: MindMapNodeType | null = null, index = 0): boolean => {
        if (node.id === nodeId) {
            action(node, parent, index);
            return true;
        }
        if (node.children) {
            for (let i = 0; i < node.children.length; i++) {
                if (find(node.children[i], node, i)) return true;
            }
        }
        return false;
    };
    // We need to pass a root object to handle top-level mutations
    const root = { id: 'root', label: 'root', children: nodes };
    find(root);
    return root.children;
};


interface NodeProps {
  node: MindMapNodeType;
  level: number;
  editingNodeId: string | null;
  editText: string;
  onAddChild: (parentId: string) => void;
  onDelete: (nodeId: string) => void;
  onStartEdit: (node: MindMapNodeType) => void;
  onCancelEdit: () => void;
  onSaveEdit: (nodeId: string) => void;
  onEditTextChange: (text: string) => void;
}

const MindMapNode: React.FC<NodeProps> = (props) => {
    const { node, level, editingNodeId, editText, onAddChild, onDelete, onStartEdit, onCancelEdit, onSaveEdit, onEditTextChange } = props;
    const [isExpanded, setIsExpanded] = useState(level < 2);
    const toggleExpansion = () => setIsExpanded(!isExpanded);
    const hasChildren = node.children && node.children.length > 0;

    const levelColors = ['bg-royal-purple', 'bg-blue-accent', 'bg-teal-accent', 'bg-pink-accent'];
    const bgColor = levelColors[level % levelColors.length];
    
    const isEditing = editingNodeId === node.id;

    return (
        <div style={{ marginLeft: `${level * 1}rem` }} className="my-2">
            <div className={`group flex items-center p-3 rounded-lg shadow-md ${bgColor} text-white`}>
                {hasChildren && (
                    <button onClick={toggleExpansion} className="mr-2">
                        {isExpanded ? <MinusCircle size={20} /> : <PlusCircle size={20} />}
                    </button>
                )}
                 {isEditing ? (
                    <input 
                        type="text" 
                        value={editText} 
                        onChange={(e) => onEditTextChange(e.target.value)} 
                        className="flex-grow bg-transparent border-b-2 border-gold outline-none"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') onSaveEdit(node.id); if (e.key === 'Escape') onCancelEdit(); }}
                    />
                ) : (
                    <span className="font-semibold flex-grow">{node.label}</span>
                )}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2 ml-2">
                    {isEditing ? (
                        <>
                            <button title="Save" onClick={() => onSaveEdit(node.id)}><Save size={18} /></button>
                            <button title="Cancel" onClick={onCancelEdit}><X size={18} /></button>
                        </>
                    ) : (
                        <>
                            <button title="Edit node" onClick={() => onStartEdit(node)}><Edit size={18} /></button>
                            <button title="Add child node" onClick={() => onAddChild(node.id)}><PlusCircle size={18} /></button>
                            {level > 0 && <button title="Delete node" onClick={() => onDelete(node.id)}><Trash2 size={18} /></button>}
                        </>
                    )}
                </div>
            </div>
            {isExpanded && hasChildren && (
                <div className="mt-2 pl-4 border-l-2 border-slate-600">
                    {node.children?.map(child => <MindMapNode key={child.id} {...props} node={child} level={level + 1} />)}
                </div>
            )}
        </div>
    );
};


const MindMapPage: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [mindMapData, setMindMapData] = useState<MindMapNodeType | null>(null);
    const [history, setHistory] = useState<MindMapNodeType[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    
    useEffect(() => {
        if (history.length > 0 && historyIndex >= 0) {
           setMindMapData(history[historyIndex]);
        }
    }, [history, historyIndex]);

    const updateMapAndHistory = (newData: MindMapNodeType) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newData);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
        }
    };
    
    const handleAddChild = (parentId: string) => {
        if (!mindMapData) return;
        const newMap = produce(mindMapData, draft => {
            findAndMutateNode([draft], parentId, (node) => {
                 if (!node.children) node.children = [];
                 node.children.push({ id: `node-${Date.now()}`, label: 'New Idea', children: [] });
            });
        });
        updateMapAndHistory(newMap);
    };

    const handleDeleteNode = (nodeId: string) => {
        if (!mindMapData) return;
        const newMap = produce(mindMapData, draft => {
             findAndMutateNode([draft], nodeId, (node, parent) => {
                if (parent && parent.children) {
                    parent.children = parent.children.filter(child => child.id !== nodeId);
                }
            });
        });
        updateMapAndHistory(newMap);
    };

    const handleStartEdit = (node: MindMapNodeType) => {
        setEditingNodeId(node.id);
        setEditText(node.label);
    };

    const handleCancelEdit = () => {
        setEditingNodeId(null);
        setEditText('');
    };

    const handleSaveEdit = (nodeId: string) => {
        if (!mindMapData || !editText.trim()) return;
        
        const newMap = produce(mindMapData, draft => {
            findAndMutateNode([draft], nodeId, (node) => {
                node.label = editText;
            });
        });
        
        updateMapAndHistory(newMap);
        handleCancelEdit();
    };

    const generateMap = useCallback(async () => {
        if (!topic.trim()) {
            setError("Please enter a topic.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setMindMapData(null);
        setHistory([]);
        setHistoryIndex(-1);
        try {
            const data = await generateMindMapData(topic);
            setHistory([data]);
            setHistoryIndex(0);
        } catch (err) {
            setError("An error occurred while generating the mind map. Please check your API key and try again.");
        } finally {
            setIsLoading(false);
        }
    }, [topic]);

    return (
        <div className="container mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold mb-8 text-center">Mind Map Generator</h1>
            <Card className="w-full max-w-4xl mx-auto mb-8">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., 'The Water Cycle' or 'Machine Learning Basics'"
                        className="flex-grow w-full bg-slate-700 text-soft-white p-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-gold focus:outline-none"
                    />
                    <button onClick={generateMap} disabled={isLoading} className="w-full md:w-auto bg-gold text-midnight-blue font-bold py-3 px-8 rounded-lg text-lg hover:bg-yellow-300 transition-colors disabled:bg-gray-500">
                        {isLoading ? 'Generating...' : 'Generate Map'}
                    </button>
                </div>
                {error && <p className="text-red-400 mt-4">{error}</p>}
            </Card>

            {isLoading && <LoadingSpinner message="Building your mind map..." />}
            
            {mindMapData && (
                <Card className="w-full max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gold">Mind Map for: {topic}</h2>
                        <div className="flex items-center space-x-4">
                            <button title="Undo" onClick={handleUndo} disabled={historyIndex <= 0} className="disabled:text-gray-500 disabled:cursor-not-allowed text-soft-white hover:text-gold"><RotateCcw size={20} /></button>
                            <button title="Redo" onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="disabled:text-gray-500 disabled:cursor-not-allowed text-soft-white hover:text-gold"><RotateCw size={20} /></button>
                        </div>
                    </div>
                    <MindMapNode 
                        node={mindMapData} 
                        level={0} 
                        editingNodeId={editingNodeId}
                        editText={editText}
                        onAddChild={handleAddChild} 
                        onDelete={handleDeleteNode}
                        onStartEdit={handleStartEdit}
                        onCancelEdit={handleCancelEdit}
                        onSaveEdit={handleSaveEdit}
                        onEditTextChange={setEditText}
                    />
                </Card>
            )}
        </div>
    );
};

export default MindMapPage;
