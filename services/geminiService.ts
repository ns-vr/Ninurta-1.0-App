
import { GoogleGenAI, Type, GenerateContentResponse, VideosGenerateVideosResponse, Operation, Modality, Chat } from "@google/genai";
import { CrosswordData, SudokuPuzzle } from "../types";

// Ensure API_KEY is available in the environment
if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Using a placeholder. Some features may not work.");
}
const API_KEY = process.env.API_KEY || "YOUR_API_KEY_HERE";

const getAiClient = () => new GoogleGenAI({ apiKey: API_KEY });

export const startChat = (model: 'gemini-2.5-flash-lite' | 'gemini-2.5-flash' = 'gemini-2.5-flash-lite'): Chat => {
    const ai = getAiClient();
    return ai.chats.create({
        model: model,
    });
};

export const generateGameWords = async (topic: string, difficulty: 'Easy' | 'Medium' | 'Hard'): Promise<string[]> => {
    const ai = getAiClient();
    let wordComplexity = "simple, common";
    if (difficulty === 'Medium') {
        wordComplexity = "moderately complex";
    } else if (difficulty === 'Hard') {
        wordComplexity = "complex or technical";
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a list of 20 unique, ${wordComplexity} words related to the topic "${topic}". The words should not contain spaces. Return them as a JSON array of strings.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        words: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        return parsed.words || [];
    } catch (error) {
        console.error("Error generating game words:", error);
        // Fallback words
        return ["error", "generating", "words", "please", "try", "again", "later"];
    }
};

export const generateCrosswordData = async (topic: string): Promise<CrosswordData> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a 10x10 crossword puzzle about "${topic}". Provide clues for 'across' and 'down'. Each clue object must contain: the clue text, the answer, the orientation ('across' or 'down'), the numeric position label in the grid, and the starting row and column (0-indexed) in a 'grid' object. Return as a JSON object with 'size' and 'clues' properties.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        size: { type: Type.INTEGER },
                        clues: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    clue: { type: Type.STRING },
                                    answer: { type: Type.STRING },
                                    position: { type: Type.INTEGER },
                                    orientation: { type: Type.STRING },
                                    grid: {
                                        type: Type.OBJECT,
                                        properties: {
                                            row: { type: Type.INTEGER },
                                            col: { type: Type.INTEGER }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating crossword:", error);
        throw new Error("Failed to generate crossword data.");
    }
};

export const generateSudokuPuzzle = async (difficulty: 'easy' | 'medium' | 'hard'): Promise<SudokuPuzzle> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a Sudoku puzzle with '${difficulty}' difficulty. An empty cell should be represented by 0. Return a JSON object with 'puzzle' and 'solution' properties, which are 9x9 arrays of numbers.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        puzzle: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.INTEGER }}},
                        solution: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.INTEGER }}}
                    }
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating Sudoku:", error);
        throw new Error("Failed to generate Sudoku puzzle.");
    }
};


export const performGroundedSearch = async (query: string): Promise<GenerateContentResponse> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response;
  } catch (error) {
    console.error("Error performing grounded search:", error);
    throw new Error("Failed to perform grounded search.");
  }
};

export const performMapsSearch = async (query: string, location?: { latitude: number, longitude: number }): Promise<GenerateContentResponse> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: query,
            config: {
                tools: [{ googleMaps: {} }],
                ...(location && {
                    toolConfig: {
                        retrievalConfig: {
                            latLng: location
                        }
                    }
                })
            },
        });
        return response;
    } catch (error) {
        console.error("Error performing Maps search:", error);
        throw new Error("Failed to perform Maps search.");
    }
};


export const generateQuizQuestions = async (topic: string, count: number): Promise<any> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate ${count} multiple-choice quiz questions about ${topic}. Each question should have 4 options and a correct answer.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionText: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                },
                required: ["questionText", "options", "correctAnswer"],
              },
            },
          },
        },
      },
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions.");
  }
};

export const generateMindMapData = async (topic: string): Promise<any> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a hierarchical mind map structure for the topic "${topic}". Start with a central node and branch out to at least 2 levels of sub-topics.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            label: { type: Type.STRING },
            children: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  children: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                           id: { type: Type.STRING },
                           label: { type: Type.STRING },
                        }
                    }
                  }
                },
              },
            },
          },
        },
      },
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error generating mind map:", error);
    throw new Error("Failed to generate mind map data.");
  }
};

export const summarizeText = async (text: string): Promise<string> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Summarize the following content, focusing on key takeaways:\n\n${text}`,
        });
        return response.text;
    } catch (error) {
        console.error("Error summarizing text:", error);
        throw new Error("Failed to summarize content.");
    }
};

export const generateImage = async (prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' = '16:9'): Promise<string> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                aspectRatio: aspectRatio,
            },
        });
        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
        throw new Error("No image generated.");
    } catch(error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image.");
    }
};

export const editImage = async (prompt: string, image: {data: string, mimeType: string}): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: image.data,
              mimeType: image.mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE],
      },
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:image/png;base64,${base64ImageBytes}`;
      }
    }
    throw new Error("No edited image was generated.");
}

export const analyzeImage = async (prompt: string, image: {data: string, mimeType: string}): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: prompt },
                { inlineData: { data: image.data, mimeType: image.mimeType } }
            ]
        }
    });
    return response.text;
};

export const analyzeVideo = async (prompt: string, video: {data: string, mimeType: string}): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: {
            parts: [
                { text: prompt },
                { inlineData: { data: video.data, mimeType: video.mimeType } }
            ]
        }
    });
    return response.text;
}

export const solveComplexProblem = async (prompt: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
    return response.text;
};


export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16', image?: {data: string, mimeType: string}): Promise<Operation<VideosGenerateVideosResponse>> => {
    const ai = getAiClient();
    const request: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
        }
    };
    if (image) {
        request.image = {
            imageBytes: image.data,
            mimeType: image.mimeType,
        };
    }
    return ai.models.generateVideos(request);
};


export const pollVideoOperation = async (operation: Operation<VideosGenerateVideosResponse>): Promise<Operation<VideosGenerateVideosResponse>> => {
    const ai = getAiClient();
    return ai.operations.getVideosOperation({ operation });
};


export const generateSpeech = async (text: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say this with a clear and engaging tone: ${text}` }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data received.");
    }
    return base64Audio;
};