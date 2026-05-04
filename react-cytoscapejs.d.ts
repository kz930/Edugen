/** Ambient types for packages without @types (picked up via tsconfig include). */
declare module "react-cytoscapejs" {
  import * as React from "react";
  import type { Core, ElementDefinition, StylesheetJson } from "cytoscape";

  export interface CytoscapeComponentProps {
    elements?: unknown;
    stylesheet?: StylesheetJson;
    layout?: Record<string, unknown>;
    style?: React.CSSProperties;
    className?: string;
    headless?: boolean;
    cy?: (cy: Core) => void;
  }

  export default class CytoscapeComponent extends React.Component<CytoscapeComponentProps> {
    static normalizeElements(elements: unknown): ElementDefinition[];
  }
}
