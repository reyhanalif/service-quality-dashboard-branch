import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        L: typeof import('leaflet');
    }
}

interface MapPoint {
    id: string;
    x: number; // longitude
    y: number; // latitude
    value: number;
    label: string;
    subLabel?: string;
    radius?: number;
    color?: string;
    details?: {
        queue: number;
        sla: number;
        nps: number;
    };
}

interface IndonesiaMapProps {
    points: MapPoint[];
    height?: number;
    onPointClick?: (point: MapPoint) => void;
}

export function IndonesiaMap({ points, height = 300, onPointClick }: IndonesiaMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.CircleMarker[]>([]);

    useEffect(() => {
        if (!mapContainerRef.current || !window.L) return;

        // Initialize map if not already done
        if (!mapRef.current) {
            mapRef.current = window.L.map(mapContainerRef.current, {
                center: [-2.5, 118],
                zoom: 5,
                zoomControl: true,
                attributionControl: false,
            });

            // Add OpenStreetMap tiles
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
            }).addTo(mapRef.current);
        }

        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Add markers for each point
        points.forEach(point => {
            const marker = window.L.circleMarker([point.y, point.x], {
                radius: 8,
                fillColor: point.color || '#3b82f6',
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.85,
            });

            // Create tooltip content
            const tooltipContent = `
                <div style="font-family: system-ui; min-width: 140px;">
                    <div style="font-weight: 600; font-size: 12px; margin-bottom: 4px;">${point.label}</div>
                    <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">${point.subLabel || ''}</div>
                    ${point.details ? `
                        <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 11px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                                <span style="color: #64748b;">Queue:</span>
                                <span style="font-weight: 500;">${point.details.queue} min</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                                <span style="color: #64748b;">SLA:</span>
                                <span style="font-weight: 500;">${point.details.sla}%</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #64748b;">NPS:</span>
                                <span style="font-weight: 500;">${Math.round(point.details.nps)}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;

            marker.bindTooltip(tooltipContent, {
                direction: 'top',
                offset: [0, -8],
                className: 'custom-tooltip',
            });

            marker.on('click', () => {
                if (onPointClick) {
                    onPointClick(point);
                }
            });

            marker.addTo(mapRef.current!);
            markersRef.current.push(marker);
        });

        return () => {
            // Cleanup markers on unmount
            markersRef.current.forEach(marker => marker.remove());
        };
    }, [points, onPointClick]);

    // Handle resize
    useEffect(() => {
        if (mapRef.current) {
            setTimeout(() => {
                mapRef.current?.invalidateSize();
            }, 100);
        }
    }, [height]);

    return (
        <div
            ref={mapContainerRef}
            style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden' }}
        />
    );
}
