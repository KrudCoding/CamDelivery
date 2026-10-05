import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Language } from '../types';

export type MapLayerMode = 'street' | 'satellite' | 'traffic';

interface D3LayerToggleProps {
  activeLayer: MapLayerMode;
  onLayerChange: (layer: MapLayerMode) => void;
  language: Language;
  className?: string;
}

interface LayerOption {
  id: MapLayerMode;
  labelEn: string;
  labelKm: string;
  icon: string;
  color: string;
  glowColor: string;
}

const LAYER_OPTIONS: LayerOption[] = [
  {
    id: 'street',
    labelEn: 'Street',
    labelKm: 'ផ្លូវថ្នល់',
    icon: '🗺️',
    color: '#2563eb', // Blue-600
    glowColor: 'rgba(37, 99, 235, 0.45)',
  },
  {
    id: 'satellite',
    labelEn: 'Satellite',
    labelKm: 'ផ្កាយរណប',
    icon: '🛰️',
    color: '#059669', // Emerald-600
    glowColor: 'rgba(5, 150, 105, 0.45)',
  },
  {
    id: 'traffic',
    labelEn: 'Live Traffic',
    labelKm: 'ចរាចរណ៍',
    icon: '🚦',
    color: '#e11d48', // Rose-600
    glowColor: 'rgba(225, 29, 72, 0.55)',
  },
];

export const D3LayerToggle: React.FC<D3LayerToggleProps> = ({
  activeLayer,
  onLayerChange,
  language,
  className = '',
}) => {
  const isKm = language === 'km';
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 310;
    const height = 40;
    const padding = 3;
    const numItems = LAYER_OPTIONS.length;
    const buttonWidth = (width - padding * 2) / numItems;
    const buttonHeight = height - padding * 2;
    const radius = 10;

    // Define defs & filters for SVG glow effects
    const defs = svg.append('defs');

    // Drop shadow filter
    const filter = defs
      .append('filter')
      .attr('id', 'd3-glow-filter')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');

    filter
      .append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Outer background track
    svg
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr('rx', radius + 2)
      .attr('fill', '#0f172a') // slate-900
      .attr('stroke', '#334155') // slate-700
      .attr('stroke-width', 1.5);

    // Active layer index
    const activeIndex = LAYER_OPTIONS.findIndex((opt) => opt.id === activeLayer);
    const activeOption = LAYER_OPTIONS[activeIndex] || LAYER_OPTIONS[0];

    // Animated Active Pill Selector
    const activePill = svg
      .append('rect')
      .attr('class', 'active-pill')
      .attr('x', padding + activeIndex * buttonWidth)
      .attr('y', padding)
      .attr('width', buttonWidth)
      .attr('height', buttonHeight)
      .attr('rx', radius)
      .attr('fill', activeOption.color)
      .attr('filter', 'url(#d3-glow-filter)')
      .style('cursor', 'pointer');

    // Pulse dot for Traffic layer when active
    const pulseDot = svg
      .append('circle')
      .attr('class', 'traffic-pulse-dot')
      .attr('r', 3)
      .attr('cx', padding + activeIndex * buttonWidth + buttonWidth - 12)
      .attr('cy', padding + buttonHeight / 2)
      .attr('fill', '#ffffff')
      .style('opacity', activeLayer === 'traffic' ? 1 : 0);

    if (activeLayer === 'traffic') {
      const repeatPulse = () => {
        pulseDot
          .transition()
          .duration(700)
          .attr('r', 4.5)
          .style('opacity', 0.4)
          .transition()
          .duration(700)
          .attr('r', 2.5)
          .style('opacity', 1)
          .on('end', repeatPulse);
      };
      repeatPulse();
    }

    // Render each option button
    LAYER_OPTIONS.forEach((option, i) => {
      const btnX = padding + i * buttonWidth;
      const isActive = option.id === activeLayer;

      const group = svg
        .append('g')
        .attr('class', `layer-option-${option.id}`)
        .style('cursor', 'pointer');

      // Clickable transparent overlay for generous hit target
      group
        .append('rect')
        .attr('x', btnX)
        .attr('y', padding)
        .attr('width', buttonWidth)
        .attr('height', buttonHeight)
        .attr('fill', 'transparent');

      // Icon + Label container
      const textGroup = group
        .append('text')
        .attr('x', btnX + buttonWidth / 2)
        .attr('y', padding + buttonHeight / 2 + 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', isActive ? '800' : '600')
        .attr('font-family', 'ui-sans-serif, system-ui, sans-serif')
        .attr('fill', isActive ? '#ffffff' : '#94a3b8')
        .style('transition', 'fill 0.2s ease, font-weight 0.2s ease')
        .style('user-select', 'none');

      // Icon
      textGroup.append('tspan').text(`${option.icon} `).style('font-size', '10px');

      // Label (Khmer or English)
      textGroup.append('tspan').text(isKm ? option.labelKm : option.labelEn);

      // D3 Click Handling with smooth transition
      group.on('click', () => {
        if (option.id === activeLayer) return;

        // Animate pill to new position using D3 ease
        activePill
          .transition()
          .duration(320)
          .ease(d3.easeCubicInOut)
          .attr('x', btnX)
          .attr('fill', option.color);

        // Update all text colors
        svg.selectAll('text').attr('fill', '#94a3b8').attr('font-weight', '600');
        textGroup.attr('fill', '#ffffff').attr('font-weight', '800');

        onLayerChange(option.id);
      });

      // Hover animation via D3
      group.on('mouseenter', function () {
        if (option.id !== activeLayer) {
          textGroup.attr('fill', '#ffffff');
        }
      });

      group.on('mouseleave', function () {
        if (option.id !== activeLayer) {
          textGroup.attr('fill', '#94a3b8');
        }
      });
    });
  }, [activeLayer, isKm, onLayerChange]);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider hidden sm:inline-flex items-center gap-1">
        <span>{isKm ? 'ស្រទាប់ផែនទី (D3 Layers)៖' : 'Map Layers (D3):'}</span>
      </span>

      <div className="relative">
        <svg
          ref={svgRef}
          width={310}
          height={40}
          viewBox="0 0 310 40"
          className="rounded-xl shadow-md select-none overflow-visible"
        />
      </div>
    </div>
  );
};
