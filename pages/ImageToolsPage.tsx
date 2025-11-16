
import React, { useState, useCallback } from 'react';
import { generateImage, editImage } from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/Card';
import { Upload } from 'lucide-react';

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPromptEditable, setIsPromptEditable] = useState(true);

    const handleGenerateImage = useCallback(async () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt to generate an image.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setImageUrl(null);
        setIsPromptEditable(false);
        try {
            const url = await generateImage(prompt, aspectRatio);
            setImageUrl(url);
        } catch (err) {
            setError("Failed to generate image. Please check your API key and try again.");
            setIsPromptEditable(true);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, aspectRatio]);

    const handleEditPrompt = () => {
        setIsPromptEditable(true);
    };

    return (
        <div>
            <div className="space-y-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'A photorealistic image of an astronaut reading a book on Mars'"
                    className="w-full h-24 bg-slate-700 text-soft-white p-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-gold focus:outline-none disabled:bg-slate-800"
                    disabled={!isPromptEditable && !isLoading}
                />
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="w-full md:w-auto">
                        <label htmlFor="aspect-ratio" className="sr-only">Aspect Ratio</label>
                        <select
                            id="aspect-ratio"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                            className="w-full bg-slate-700 text-soft-white p-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-gold focus:outline-none"
                            disabled={!isPromptEditable && !isLoading}
                        >
                            <option value="16:9">16:9 Widescreen</option>
                            <option value="9:16">9:16 Portrait</option>
                            <option value="1:1">1:1 Square</option>
                            <option value="4:3">4:3 Landscape</option>
                            <option value="3:4">3:4 Vertical</option>
                        </select>
                    </div>
                    <div className="flex w-full md:w-auto flex-grow gap-2">
                        {imageUrl && !isPromptEditable && (
                            <button onClick={handleEditPrompt} className="w-full md:w-auto bg-slate-600 text-soft-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-slate-500 transition-colors">
                                Edit
                            </button>
                        )}
                        <button onClick={handleGenerateImage} disabled={isLoading || !isPromptEditable} className="w-full md:w-auto flex-grow bg-gold text-midnight-blue font-bold py-3 px-8 rounded-lg text-lg hover:bg-yellow-300 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                            {isLoading ? '...' : 'Generate'}
                        </button>
                    </div>
                </div>
            </div>
            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
            <div className="mt-8">
                {isLoading && <LoadingSpinner message="Creating your image..." />}
                {imageUrl && (
                    <div>
                        <h3 className="text-xl font-bold text-gold mb-4 text-center">Generated Image</h3>
                        <img src={imageUrl} alt={prompt} className="rounded-lg shadow-lg w-full" />
                    </div>
                )}
            </div>
        </div>
    );
};

const ImageEditor: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [image, setImage] = useState<{file: File, preview: string, data: string, mimeType: string} | null>(null);
    const [editedImageUrl, setEditedImageUrl] = useState<string|null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Data = (reader.result as string).split(',')[1];
                setImage({
                    file: file,
                    preview: URL.createObjectURL(file),
                    data: base64Data,
                    mimeType: file.type
                });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleEditImage = async () => {
        if (!prompt.trim() || !image) {
            setError("Please upload an image and provide an editing instruction.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setEditedImageUrl(null);
        try {
            const url = await editImage(prompt, {data: image.data, mimeType: image.mimeType});
            setEditedImageUrl(url);
        } catch (err) {
            setError("Failed to edit image. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                 <div>
                    <label htmlFor="image-upload" className="block cursor-pointer bg-slate-700 hover:bg-slate-600 rounded-lg p-4 text-center border-2 border-dashed border-slate-500">
                        {image ? <img src={image.preview} alt="upload preview" className="max-h-64 mx-auto rounded-lg"/> : <><Upload size={40} className="mx-auto text-gray-400 mb-2"/> <p>Click to upload an image</p></>}
                    </label>
                    <input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                 </div>
                 <div className="space-y-4">
                     <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'Add a retro filter' or 'Remove the person in the background'"
                        className="w-full h-24 bg-slate-700 text-soft-white p-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-gold focus:outline-none"
                    />
                     <button onClick={handleEditImage} disabled={isLoading || !image} className="w-full bg-gold text-midnight-blue font-bold py-3 px-8 rounded-lg text-lg hover:bg-yellow-300 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {isLoading ? 'Editing...' : 'Apply Edit'}
                    </button>
                 </div>
            </div>
             {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
              <div className="mt-8">
                {isLoading && <LoadingSpinner message="Applying your edits..." />}
                {editedImageUrl && (
                    <div>
                        <h3 className="text-xl font-bold text-gold mb-4 text-center">Edited Image</h3>
                        <img src={editedImageUrl} alt={prompt} className="rounded-lg shadow-lg w-full" />
                    </div>
                )}
            </div>
        </div>
    );
};


const ImageToolsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('generator');

    const tabClasses = (tabName: string) => 
        `px-6 py-3 font-semibold rounded-t-lg transition-colors ${activeTab === tabName ? 'bg-slate-800 text-gold' : 'bg-slate-900 text-soft-white hover:bg-slate-700'}`;

    return (
        <div className="container mx-auto px-6 py-12 flex flex-col items-center">
            <h1 className="text-4xl font-bold mb-8 text-center">Image Tools</h1>
            <div className="w-full max-w-4xl">
                 <div className="flex border-b border-slate-700 mb-0">
                    <button onClick={() => setActiveTab('generator')} className={tabClasses('generator')}>Generator</button>
                    <button onClick={() => setActiveTab('editor')} className={tabClasses('editor')}>Editor</button>
                </div>
                <Card className="w-full rounded-t-none">
                   {activeTab === 'generator' && <ImageGenerator />}
                   {activeTab === 'editor' && <ImageEditor />}
                </Card>
            </div>
        </div>
    );
};

export default ImageToolsPage;