import { useEvent } from '@/hooks';
import { inputSelector, updateValue, useQRScoutState } from '@/store/store';
import { useCallback, useEffect, useRef, useState, MouseEvent } from 'react';
import { MapInputData } from './BaseInputProps';
import { ConfigurableInputProps } from './ConfigurableInput';
import { Undo2, X } from 'lucide-react';
import { Button } from '../ui/button';

type Point = { x: number; y: number };

export default function MapInput(props: ConfigurableInputProps) {
    const data = useQRScoutState(
        inputSelector<MapInputData>(props.section, props.code),
    );

    if (!data) {
        return <div>Invalid input</div>;
    }

    const [points, setPoints] = useState<Point[]>(data.defaultValue || []);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        // Stringify the array of points to store in the QR Scout state
        updateValue(props.code, JSON.stringify(points));
    }, [points, props.code]);

    const resetState = useCallback(
        ({ force }: { force: boolean }) => {
            if (force || data.formResetBehavior !== 'preserve') {
                setPoints(data.defaultValue || []);
            }
        },
        [data.defaultValue, data.formResetBehavior],
    );

    useEvent('resetFields', resetState);

    const handleImageClick = (e: MouseEvent<HTMLImageElement>) => {
        if (!imgRef.current) return;

        const rect = imgRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        // Optional: round to 3 decimal places to save QR code space
        const newPoint = {
            x: Math.round(x * 1000) / 1000,
            y: Math.round(y * 1000) / 1000
        };

        setPoints(prev => [...prev, newPoint]);
    };

    const undoLastPoint = () => {
        setPoints(prev => prev.slice(0, -1));
    };

    const clearPoints = () => {
        setPoints([]);
    };

    if (!data.imageSrc) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-md border min-h-[200px]">
                <p className="text-muted-foreground text-sm">
                    No map image provided in configuration.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="relative inline-block w-full max-w-full overflow-hidden rounded-md border bg-muted">
                {/* The map image */}
                <img
                    ref={imgRef}
                    src={data.imageSrc}
                    alt="Field Map"
                    className="w-full h-auto object-contain cursor-crosshair select-none"
                    onClick={handleImageClick}
                    draggable={false}
                />

                {/* Overlay the points */}
                {points.map((pt, i) => (
                    <div
                        key={i}
                        className="absolute w-4 h-4 rounded-full bg-primary border-2 border-white shadow-sm -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{
                            left: `${pt.x * 100}%`,
                            top: `${pt.y * 100}%`,
                        }}
                    />
                ))}
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground font-mono">
                    Points: {points.length}
                </span>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={undoLastPoint}
                        disabled={points.length === 0}
                        className="h-8 px-3"
                    >
                        <Undo2 className="h-4 w-4 mr-1" />
                        Undo
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearPoints}
                        disabled={points.length === 0}
                        className="h-8 px-3 text-destructive hover:text-destructive"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Clear
                    </Button>
                </div>
            </div>
        </div>
    );
}
