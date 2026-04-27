export interface MindMapLeaf {
  label: string;
}

export interface MindMapBranch {
  label: string;
  children: MindMapLeaf[];
}

export interface MindMapData {
  root: string;
  branches: MindMapBranch[];
}

export const MINDMAP_JSON_SCHEMA = `{
  "root": "Central topic (short, max 40 chars)",
  "branches": [
    {
      "label": "Branch concept (short)",
      "children": [
        { "label": "Leaf detail" },
        { "label": "Leaf detail" }
      ]
    }
  ]
}`;

export const MINDMAP_INSTRUCTIONS = `Generate a mind map in strict JSON. Return ONLY the JSON object, no other text.
Schema:
${MINDMAP_JSON_SCHEMA}

Rules:
- 3 to 6 branches
- 2 to 4 children per branch
- Labels must be short phrases (max 6 words each)
- Cover the core concepts from the recent discussion`;
