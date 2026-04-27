'use client';

import type { MindMapData } from '@/lib/mindmap/types';

const W = 700;
const H = 480;
const CX = W / 2;
const CY = H / 2;
const BRANCH_R = 160;
const LEAF_R = 270;

const BRANCH_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

interface Props {
  data: MindMapData;
}

function truncate(text: string, max = 22): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

export default function MindMapRenderer({ data }: Props) {
  const { root, branches } = data;
  const n = branches.length;

  const elements: React.ReactNode[] = [];

  branches.forEach((branch, bi) => {
    const angle = (2 * Math.PI * bi) / n - Math.PI / 2;
    const bx = CX + BRANCH_R * Math.cos(angle);
    const by = CY + BRANCH_R * Math.sin(angle);
    const color = BRANCH_COLORS[bi % BRANCH_COLORS.length];
    const leaves = branch.children ?? [];

    // Root → branch line
    elements.push(
      <line key={`bl-${bi}`} x1={CX} y1={CY} x2={bx} y2={by}
        stroke={color} strokeWidth={2} strokeOpacity={0.6} />
    );

    // Branch node
    elements.push(
      <g key={`bn-${bi}`}>
        <ellipse cx={bx} cy={by} rx={52} ry={18} fill={color} fillOpacity={0.85} />
        <text x={bx} y={by} textAnchor="middle" dominantBaseline="middle"
          fontSize={11} fontWeight="600" fill="white">
          {truncate(branch.label, 18)}
        </text>
      </g>
    );

    // Leaves
    const nLeaves = leaves.length;
    leaves.forEach((leaf, li) => {
      const spread = (Math.PI / 4) * (li - (nLeaves - 1) / 2);
      const leafAngle = angle + spread;
      const lx = CX + LEAF_R * Math.cos(leafAngle);
      const ly = CY + LEAF_R * Math.sin(leafAngle);

      elements.push(
        <line key={`ll-${bi}-${li}`} x1={bx} y1={by} x2={lx} y2={ly}
          stroke={color} strokeWidth={1.5} strokeOpacity={0.35} strokeDasharray="4 3" />
      );
      elements.push(
        <g key={`ln-${bi}-${li}`}>
          <rect x={lx - 48} y={ly - 12} width={96} height={24} rx={6}
            fill={color} fillOpacity={0.18} stroke={color} strokeOpacity={0.4} strokeWidth={1} />
          <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize={10} fill="#e5e7eb">
            {truncate(leaf.label, 20)}
          </text>
        </g>
      );
    });
  });

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-950 p-3 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight: 360 }}>
        {elements}
        {/* Root node */}
        <ellipse cx={CX} cy={CY} rx={70} ry={26} fill="#4f46e5" />
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle"
          fontSize={13} fontWeight="700" fill="white">
          {truncate(root, 22)}
        </text>
      </svg>
    </div>
  );
}
