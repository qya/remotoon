import * as Babel from '@babel/standalone';
import type { CompileResult } from '../types';
import type { ComponentType } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  Sequence,
  Series,
  Loop,
  Freeze,
  staticFile,
  Video,
  OffthreadVideo,
  Img,
  Audio,
  spring,
  measureSpring,
  random,
  Easing,
} from 'remotion';

// Additional Remotion packages
import { Lottie } from '@remotion/lottie';
import * as RemotionShapes from '@remotion/shapes';
import { ThreeCanvas } from '@remotion/three';
import {
  TransitionSeries,
  linearTiming,
  springTiming,
} from '@remotion/transitions';
import { clockWipe } from '@remotion/transitions/clock-wipe';
import { fade } from '@remotion/transitions/fade';
import { flip } from '@remotion/transitions/flip';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import * as THREE from 'three';
import { AnimatedEmoji } from '@remotion/animated-emoji';

const PROPS_REGEX = /\$PROPS\.([A-Za-z_][A-Za-z0-9_]*)/g;
const IMPORT_REGEXES: RegExp[] = [
  /import\s+type\s*\{[\s\S]*?\}\s*from\s*["'][^"']+["'];?/g,
  /import\s+\w+\s*,\s*\{[\s\S]*?\}\s*from\s*["'][^"']+["'];?/g,
  /import\s*\{[\s\S]*?\}\s*from\s*["'][^"']+["'];?/g,
  /import\s+\*\s+as\s+\w+\s+from\s*["'][^"']+["'];?/g,
  /import\s+\w+\s+from\s*["'][^"']+["'];?/g,
  /import\s*["'][^"']+["'];?/g,
];

const stripMarkdownFences = (code: string): string => {
  let result = code.trim();
  result = result.replace(/^```(?:tsx?|jsx?)?\n?/, '');
  result = result.replace(/\n?```\s*$/, '');
  return result.trim();
};

const convertPropsPlaceholders = (code: string): string => {
  // Keep runtime props in a closure variable so both function declarations
  // and arrow components can read placeholders without signature rewriting.
  return code.replace(PROPS_REGEX, '__props.$1');
};

const stripImports = (code: string): string => {
  return IMPORT_REGEXES.reduce((acc, regex) => acc.replace(regex, ''), code);
};

// Strip destructuring from React to avoid duplicate declarations with sandbox scope
// e.g., const { useCurrentFrame, useVideoConfig } = React; -> (removed)
const stripReactDestructuring = (code: string): string => {
  // Match patterns like: const { useCurrentFrame, useVideoConfig } = React;
  // or: const { useCurrentFrame } = ReactWithRemotion;
  return code
    .replace(/const\s*\{\s*[^}]+\}\s*=\s*React\s*;?/g, '')
    .replace(/const\s*\{\s*[^}]+\}\s*=\s*ReactWithRemotion\s*;?/g, '');
};

const stripExports = (code: string): string => {
  return code
    .replace(/\bexport\s+default\s+/g, '')
    .replace(/\bexport\s+(?=const|let|var|function|class)/g, '');
};

// Detects which identifier is the "main" component. Must run BEFORE exports are
// stripped so `export default` / `export const` hints can be used. Priority:
// 1. explicit default export, 2. conventional names, 3. PascalCase named
// export, 4. the last PascalCase declaration (helpers usually come first).
const detectComponentName = (code: string): string | null => {
  const defaultFn = code.match(/export\s+default\s+function\s+([A-Za-z_$][\w$]*)/);
  if (defaultFn) return defaultFn[1];
  const defaultIdent = code.match(/export\s+default\s+([A-Z][\w$]*)\s*;?\s*$/m);
  if (defaultIdent) return defaultIdent[1];

  const declRegex =
    /(?:function\s+([A-Za-z_$][\w$]*)\s*\(|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:React\.)?(?:memo\()?\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*(?::[^=]+)?=>|[A-Za-z_$][\w$]*\s*=>))/g;
  const declared: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = declRegex.exec(code)) !== null) {
    declared.push(m[1] ?? m[2]);
  }

  for (const preferred of ['Component', 'MyAnimation']) {
    if (declared.includes(preferred)) return preferred;
  }

  const namedExport = code.match(/export\s+(?:const|function|let)\s+([A-Z][\w$]*)/);
  if (namedExport) return namedExport[1];

  const pascal = declared.filter((n) => /^[A-Z]/.test(n));
  if (pascal.length > 0) return pascal[pascal.length - 1];

  return declared[0] ?? null;
};

// Extract component body from LLM-generated code (template-style)
// This handles the pattern: export const MyAnimation = () => { ... };
function extractComponentBody(code: string): string {
  let cleaned = code;

  // Remove type imports: import type { ... } from "...";
  cleaned = cleaned.replace(
    /import\s+type\s*\{[\s\S]*?\}\s*from\s*["'][^"']+["'];?/g,
    "",
  );
  // Remove combined default + named imports: import X, { ... } from "...";
  cleaned = cleaned.replace(
    /import\s+\w+\s*,\s*\{[\s\S]*?\}\s*from\s*["'][^"']+["'];?/g,
    "",
  );
  // Remove multi-line named imports: import { ... } from "...";
  cleaned = cleaned.replace(
    /import\s*\{[\s\S]*?\}\s*from\s*["'][^"']+["'];?/g,
    "",
  );
  // Remove namespace imports: import * as X from "...";
  cleaned = cleaned.replace(
    /import\s+\*\s+as\s+\w+\s+from\s*["'][^"']+["'];?/g,
    "",
  );
  // Remove default imports: import X from "...";
  cleaned = cleaned.replace(/import\s+\w+\s+from\s*["'][^"']+["'];?/g, "");
  // Remove side-effect imports: import "...";
  cleaned = cleaned.replace(/import\s*["'][^"']+["'];?/g, "");

  cleaned = cleaned.trim();

  // Extract body from "export const MyAnimation = () => { ... };"
  const match = cleaned.match(
    /^([\s\S]*?)export\s+const\s+\w+\s*=\s*\(\s*\)\s*=>\s*\{([\s\S]*)\};?\s*$/,
  );

  if (match) {
    const helpers = match[1].trim();
    const body = match[2].trim();
    return helpers ? `${helpers}\n\n${body}` : body;
  }

  return cleaned;
}

export class JITCompiler {
  private scope: Record<string, any>;

  constructor() {
    // Create a React object that includes Remotion helpers. This supports code
    // patterns like: const { useCurrentFrame } = React;
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
      interpolateColors,
      random,
      measureSpring,
      Series,
      Loop,
      Freeze,
      OffthreadVideo,
      // Additional packages
      useEffect,
      useMemo,
      useRef,
      useState,
      useCallback,
    };

    this.scope = {
      // React with Remotion helpers merged - access via React.useCurrentFrame or destructuring
      React: ReactWithRemotion,
      // Direct identifiers for code that imports from remotion (imports are stripped)
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
      interpolateColors,
      random,
      measureSpring,
      Series,
      Loop,
      Freeze,
      OffthreadVideo,
      // React hooks available directly
      useState: React.useState,
      useEffect: React.useEffect,
      useMemo: React.useMemo,
      useRef: React.useRef,
      useCallback: React.useCallback,
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
      // @remotion/shapes
      Rect: RemotionShapes.Rect,
      Circle: RemotionShapes.Circle,
      Triangle: RemotionShapes.Triangle,
      Star: RemotionShapes.Star,
      Polygon: RemotionShapes.Polygon,
      Ellipse: RemotionShapes.Ellipse,
      Heart: RemotionShapes.Heart,
      Pie: RemotionShapes.Pie,
      makeRect: RemotionShapes.makeRect,
      makeCircle: RemotionShapes.makeCircle,
      makeTriangle: RemotionShapes.makeTriangle,
      makeStar: RemotionShapes.makeStar,
      makePolygon: RemotionShapes.makePolygon,
      makeEllipse: RemotionShapes.makeEllipse,
      makeHeart: RemotionShapes.makeHeart,
      makePie: RemotionShapes.makePie,
      // @remotion/lottie
      Lottie,
      // @remotion/three
      ThreeCanvas,
      // @remotion/transitions
      TransitionSeries,
      linearTiming,
      springTiming,
      fade,
      slide,
      wipe,
      flip,
      clockWipe,
      // three.js
      THREE,
      // @remotion/animated-emoji
      AnimatedEmoji,
    };
  }

  compile(code: string, _props: Record<string, any> = {}): CompileResult {
    try {
      // Validate code is not empty
      if (!code || !code.trim()) {
        return { success: false, component: null, error: 'Code is empty' };
      }

      const sanitizedCode = stripMarkdownFences(code);
      
      const withoutImports = stripImports(sanitizedCode);
      const withoutReactDestructuring = stripReactDestructuring(withoutImports);
      const detectedComponentName = detectComponentName(withoutReactDestructuring);
      const withoutExports = stripExports(withoutReactDestructuring);
      const processedCode = convertPropsPlaceholders(withoutExports);

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
        const componentLookup = detectedComponentName
          ? `typeof ${detectedComponentName} !== 'undefined' ? ${detectedComponentName} :`
          : '';

        // Build the executor function. User code runs inside an inner function
        // so its top-level declarations can shadow sandbox names (e.g. an AI
        // writing `const fade = ...` or `const Circle = ...`) without a
        // "Identifier has already been declared" SyntaxError.
        const executor = new Function(
          ...sandboxKeys,
          `
          "use strict";
          var exports = {};
          var module = { exports: exports };
          var __props = {};

          var ComponentFn = (function () {
            ${transformed}

            // Try to find the component in various ways
            return (
              ${componentLookup}
              typeof Component !== 'undefined' ? Component :
              exports.Component ||
              exports.default ||
              module.exports.Component ||
              module.exports.default ||
              module.exports
            );
          })();

          if (typeof ComponentFn !== 'function') {
            return null;
          }

          var isClass = !!(ComponentFn.prototype && ComponentFn.prototype.isReactComponent);

          // Wrapper keeps $PROPS placeholders working through the closure
          // variable. Plain function components are invoked directly so
          // __props is always set synchronously right before their body runs.
          return function WrappedComponent(props) {
            __props = props || {};
            return isClass
              ? React.createElement(ComponentFn, __props)
              : ComponentFn(__props);
          };
          `
        );

        // Execute with sandbox values
        const Component = executor(...sandboxValues) as Function | null;

        if (!Component) {
          return {
            success: false,
            component: null,
            error:
              'No component found. Define a React component (for example `function Component()` or `export const MyAnimation = () => { ... }`).'
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

  // Compile using template-style extraction (for code like: export const MyAnimation = () => {...})
  compileTemplateStyle(code: string): CompileResult {
    if (!code?.trim()) {
      return { success: false, component: null, error: 'No code provided' };
    }

    try {
      const withoutReactDestructuring = stripReactDestructuring(code);
      const processedCode = convertPropsPlaceholders(withoutReactDestructuring);
      const componentBody = extractComponentBody(processedCode);
      const wrappedSource = `const DynamicAnimation = () => {\n${componentBody}\n};`;

      const transpiled = Babel.transform(wrappedSource, {
        presets: ['react', 'typescript'],
        filename: 'dynamic-animation.tsx',
      });

      if (!transpiled.code) {
        return { success: false, component: null, error: 'Transpilation failed' };
      }

      const sandboxKeys = Object.keys(this.scope);
      const sandboxValues = Object.values(this.scope);

      const wrappedCode = `
        var __props = {};
        ${transpiled.code}
        return function WrappedComponent(props) {
          __props = props || {};
          return React.createElement(DynamicAnimation, props || {});
        };
      `;

      const createComponent = new Function(
        ...sandboxKeys,
        wrappedCode,
      );

      const Component = createComponent(...sandboxValues);

      if (typeof Component !== 'function') {
        return {
          success: false,
          component: null,
          error: 'Code must be a function that returns a React component',
        };
      }

      return { success: true, component: Component as ComponentType<any> };
    } catch (error) {
      console.error('Template-style compilation error:', error);
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
