import * as Babel from '@babel/standalone';
import type { CompileResult } from '../types';
import type { ComponentType } from 'react';
import React from 'react';
import { 
  interpolate, 
  useCurrentFrame, 
  useVideoConfig, 
  AbsoluteFill, 
  Sequence, 
  staticFile,
  Video,
  Img,
  Audio,
  spring,
  Easing,
} from 'remotion';

// Create a React object that includes Remotion hooks
// Users should destructure from React: const { useCurrentFrame } = React;
const ReactWithRemotion = {
  ...React,
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  Video,
  Img,
  Audio,
  spring,
  Easing,
};

// Props placeholder pattern: $PROPS.KEY or $PROPS.KEY_WITH_UNDERSCORES
const PROPS_REGEX = /\$PROPS\.([A-Za-z_][A-Za-z0-9_]*)/g;

/**
 * Convert $PROPS placeholders to function parameter references
 * This allows passing props at runtime without recompiling
 * 
 * Example:
 *   $PROPS.TEXT -> props.TEXT
 *   $PROPS.TITLE || "default" -> props.TITLE || "default"
 */
function convertPropsPlaceholders(code: string): string {
  return code.replace(PROPS_REGEX, 'props.$1');
}

/**
 * Wrap component code to accept props parameter
 * Updates `function Component()` to `function Component(props = {})`
 * and converts $PROPS references to props.
 */
function wrapComponentWithProps(code: string): string {
  // First convert $PROPS to props. references
  let processedCode = convertPropsPlaceholders(code);
  
  // Update function signature to accept props parameter
  // Match: function Component() or function Component ()
  // Replace with: function Component(props = {})
  processedCode = processedCode.replace(
    /function\s+Component\s*\(\s*\)/g,
    'function Component(props = {})'
  );
  
  return processedCode;
}

export class JITCompiler {
  private scope: Record<string, any>;

  constructor() {
    this.scope = {
      React: ReactWithRemotion,
      // Global utilities available in the sandbox
      console,
      Math,
      Date,
      JSON,
      Object,
      Array,
      String,
      Number,
      Boolean,
      Promise,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      requestAnimationFrame,
      cancelAnimationFrame,
    };
  }

  compile(code: string, _props: Record<string, any> = {}): CompileResult {
    try {
      // Validate code is not empty
      if (!code || !code.trim()) {
        return { success: false, component: null, error: 'Code is empty' };
      }

      // Convert $PROPS placeholders to props. references for runtime prop passing
      const processedCode = wrapComponentWithProps(code);

      // Transform JSX/TSX menggunakan Babel standalone
      let transformed: string;
      try {
        const result = Babel.transform(processedCode, {
          filename: 'dynamic-component.tsx',
          presets: [
            ['typescript', { allExtensions: true, isTSX: true }],
            ['react', { runtime: 'classic' }],
          ],
          parserOpts: {
            plugins: ['jsx', 'typescript'],
          },
        });
        
        if (!result.code) {
          return { success: false, component: null, error: 'Babel transform returned empty code' };
        }
        transformed = result.code;
      } catch (babelError) {
        console.error('Babel transform error:', babelError);
        return { 
          success: false, 
          component: null, 
          error: babelError instanceof Error ? `Transform: ${babelError.message}` : 'Babel transform failed' 
        };
      }

      // Create a sandboxed function to execute the code
      const sandboxKeys = Object.keys(this.scope);
      const sandboxValues = Object.values(this.scope);

      try {
        // Build the executor function
        // The Component function will accept props as its first parameter
        const executor = new Function(
          ...sandboxKeys,
          `
          "use strict";
          var exports = {};
          var module = { exports: exports };
          
          ${transformed}
          
          // Try to find the component in various ways
          var ComponentFn = 
            typeof Component !== 'undefined' ? Component :
            exports.Component || 
            exports.default || 
            module.exports.Component || 
            module.exports.default ||
            module.exports;
          
          // Wrap the component to handle props properly
          // This ensures $PROPS -> props conversion works
          return ComponentFn;
          `
        );

        // Execute with sandbox values
        const ComponentFn = executor(...sandboxValues) as Function;
        
        // Wrap the component to provide props support
        // This wrapper is stable and won't cause remounts when props change
        const Component = (props: Record<string, any> = {}) => {
          return ComponentFn(props);
        };

        if (!Component) {
          return { 
            success: false, 
            component: null, 
            error: 'No Component found. Make sure your code defines a Component function.' 
          };
        }

        if (typeof Component !== 'function') {
          return { 
            success: false, 
            component: null, 
            error: `Invalid Component type: ${typeof Component}. Expected a function.` 
          };
        }

        return { success: true, component: Component as ComponentType<any> };
      } catch (execError) {
        console.error('Code execution error:', execError);
        return {
          success: false,
          component: null,
          error: execError instanceof Error ? `Runtime: ${execError.message}` : 'Code execution failed',
        };
      }
    } catch (error) {
      console.error('JIT Compilation error:', error);
      return {
        success: false,
        component: null,
        error: error instanceof Error ? error.message : 'Unknown compilation error',
      };
    }
  }

  // Quick test if code can be compiled
  testCompile(code: string): { success: boolean; error?: string } {
    const result = this.compile(code);
    return { 
      success: result.success, 
      error: result.error 
    };
  }
}

// Singleton instance
export const jitCompiler = new JITCompiler();
