
import React, { useState } from 'react';
import { JournalEntry } from '../types';
import Card from '../components/Card';
import { Plus, Trash2 } from 'lucide-react';

const JournalPage: React.FC = () => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [currentEntry, setCurrentEntry] = useState('');
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

    const saveEntry = () => {
        if (!currentEntry.trim()) return;

        if (selectedEntry) {
            // Update existing entry
            setEntries(entries.map(entry => 
                entry.id === selectedEntry.id ? { ...entry, content: currentEntry } : entry
            ));
        } else {
            // Add new entry
            const newEntry: JournalEntry = {
                id: Date.now().toString(),
                date: new Date().toLocaleString(),
                content: currentEntry,
            };
            setEntries([newEntry, ...entries]);
        }
        
        setCurrentEntry('');
        setSelectedEntry(null);
    };

    const selectEntry = (entry: JournalEntry) => {
        setSelectedEntry(entry);
        setCurrentEntry(entry.content);
    };
    
    const createNewEntry = () => {
        setSelectedEntry(null);
        setCurrentEntry('');
    };
    
    const deleteEntry = (id: string) => {
        setEntries(entries.filter(entry => entry.id !== id));
        if (selectedEntry?.id === id) {
            createNewEntry();
        }
    }

    return (
        <div className="container mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold mb-8 text-center">Learning Journal</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <Card className="h-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gold">Entries</h2>
                            <button onClick={createNewEntry} className="flex items-center space-x-2 text-gold hover:text-yellow-300">
                                <Plus size={20} /> <span>New</span>
                            </button>
                        </div>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {entries.length > 0 ? entries.map(entry => (
                                <div key={entry.id} onClick={() => selectEntry(entry)} className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedEntry?.id === entry.id ? 'bg-royal-purple' : 'bg-slate-700 hover:bg-slate-600'}`}>
                                    <p className="font-semibold truncate">{entry.content.split('\n')[0]}</p>
                                    <p className="text-sm text-gray-400">{entry.date}</p>
                                </div>
                            )) : <p className="text-gray-500">No entries yet. Create one!</p>}
                        </div>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Card>
                        <textarea
                            value={currentEntry}
                            onChange={(e) => setCurrentEntry(e.target.value)}
                            placeholder="Start writing your thoughts, reflections, or key takeaways..."
                            className="w-full h-96 bg-slate-900 text-soft-white p-4 rounded-lg border border-slate-700 focus:ring-2 focus:ring-gold focus:outline-none resize-none"
                        />
                        <div className="mt-4 flex justify-between items-center">
                           <button onClick={saveEntry} className="bg-gold text-midnight-blue font-bold py-2 px-6 rounded-lg hover:bg-yellow-300 transition-colors">
                                {selectedEntry ? 'Update Entry' : 'Save Entry'}
                            </button>
                            {selectedEntry && (
                               <button onClick={() => deleteEntry(selectedEntry.id)} className="text-red-400 hover:text-red-300 flex items-center space-x-2">
                                   <Trash2 size={18} /><span>Delete</span>
                               </button>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default JournalPage;
