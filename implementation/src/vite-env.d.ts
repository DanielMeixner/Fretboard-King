/// <reference types="vite/client" />

// Type declaration for the game-level-map web component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'game-level-map': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          levels?: string;
          'current-level'?: string;
          'completed-levels'?: string;
          'path-color'?: string;
          'marker-size'?: string;
          spacing?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
