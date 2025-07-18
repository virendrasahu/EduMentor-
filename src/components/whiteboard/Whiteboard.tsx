"use client";

import { useState, useRef, MouseEvent } from 'react';
import { generateWhiteboardDiagram } from '@/ai/flows/generate-whiteboard-diagram';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, Eraser } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Path {
  points: { x: number; y: number }[];
  stroke: string;
  strokeWidth: number;
}

export function Whiteboard() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [diagramUrl, setDiagramUrl] = useState<string | null>(null);
  
  const [paths, setPaths] = useState<Path[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<SVGSVGElement>(null);

  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setDiagramUrl(null);
    setPaths([]);
    try {
      const result = await generateWhiteboardDiagram({ prompt });
      setDiagramUrl(result.diagramDataUri);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Failed to generate diagram",
        description: "There was an error generating the visual aid. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getCoordinates = (event: MouseEvent<SVGSVGElement>): { x: number; y: number } | null => {
    if (!canvasRef.current) return null;
    const svg = canvasRef.current;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const CTM = svg.getScreenCTM();
    if (CTM) {
      return point.matrixTransform(CTM.inverse());
    }
    return null;
  };

  const handleMouseDown = (e: MouseEvent<SVGSVGElement>) => {
    if (diagramUrl || e.button !== 0) return;
    setIsDrawing(true);
    const coords = getCoordinates(e);
    if (coords) {
      setPaths([...paths, { points: [coords], stroke: '#0a0a0a', strokeWidth: 3 }]);
    }
  };

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !paths.length) return;
    const coords = getCoordinates(e);
    if (coords) {
      const lastPath = paths[paths.length - 1];
      lastPath.points.push(coords);
      setPaths([...paths.slice(0, -1), lastPath]);
    }
  };

  const handleMouseUp = () => setIsDrawing(false);
  const handleMouseLeave = () => setIsDrawing(false);

  const pathData = (path: Path) => {
    return path.points.reduce((acc, p, i) => {
        if (i === 0) return `M ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
        return `${acc} L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    }, '');
  };
  
  const clearWhiteboard = () => {
    setPaths([]);
    setDiagramUrl(null);
    setPrompt('');
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 h-fit">
        <CardHeader>
          <CardTitle>AI Diagram Generator</CardTitle>
          <CardDescription>Describe a concept, and the AI will generate a diagram for you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="space-y-4">
            <Input 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., The water cycle"
              disabled={isGenerating}
            />
            <Button type="submit" disabled={isGenerating || !prompt.trim()} className="w-full">
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Generate Diagram
            </Button>
          </form>
          <Button variant="outline" onClick={clearWhiteboard} className="w-full">
            <Eraser className="mr-2 h-4 w-4" />
            Clear Whiteboard
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="p-2 h-[60vh] lg:h-[75vh]">
          <div className="w-full h-full border rounded-lg overflow-hidden relative bg-white shadow-inner">
            {diagramUrl && (
              <Image src={diagramUrl} alt={prompt || "Generated Diagram"} layout="fill" objectFit="contain" />
            )}
            <svg
              ref={canvasRef}
              className={cn("w-full h-full absolute top-0 left-0", diagramUrl ? 'cursor-not-allowed' : 'cursor-crosshair')}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              viewBox="0 0 800 600"
              preserveAspectRatio="xMidYMid meet"
            >
              <rect width="100%" height="100%" fill="transparent" />
              {paths.map((path, i) => (
                <path
                  key={i}
                  d={pathData(path)}
                  stroke={path.stroke}
                  strokeWidth={path.strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </svg>
            {(isGenerating || (!diagramUrl && paths.length === 0)) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/50">
                    <div className="text-center text-muted-foreground p-4">
                        {isGenerating ? 'Generating your diagram...' : 'Start drawing or generate a diagram.'}
                    </div>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
