import type { ComponentPart } from '../types';
// Import template examples with $PROPS support
import {
  examples as templateExamples,
  type RemotionExample,
} from './examples';

// Map template categories to our category system
const categoryMap: Record<string, ComponentPart['category']> = {
  'Text': 'text',
  'Animation': 'animation',
  'Charts': 'animation',
  '3D': 'animation',
  'Other': 'animation',
};

// Convert template example to ComponentPart format
export const convertTemplateExampleToComponent = (example: RemotionExample): ComponentPart => {
  // Generate tags based on category and code content
  const tags = [example.category.toLowerCase()];
  
  if (example.category === '3D') {
    tags.push('3d', '@remotion/three', 'three.js');
  }
  if (example.category === 'Charts') {
    tags.push('chart', 'data', 'visualization');
  }
  if (example.code.includes('@remotion/shapes')) {
    tags.push('@remotion/shapes', 'svg');
  }
  if (example.code.includes('@remotion/lottie')) {
    tags.push('@remotion/lottie', 'lottie');
  }
  if (example.code.includes('@remotion/three')) {
    tags.push('@remotion/three', 'three.js', '3d');
  }
  if (example.code.includes('spring')) {
    tags.push('spring', 'physics');
  }
  if (example.code.includes('interpolate')) {
    tags.push('interpolate', 'animation');
  }

  return {
    id: example.id,
    name: example.name,
    code: example.code,
    compiledComponent: null,
    category: categoryMap[example.category] || 'animation',
    tags,
    defaultProps: example.defaultProps,
  };
};

// Get all example components (from template)
export const getRemotionExampleComponents = (): ComponentPart[] => {
  return templateExamples.map(convertTemplateExampleToComponent);
};

// Legacy export for backwards compatibility
export const remotionExampleComponents = templateExamples.map(example => ({
  name: example.name,
  category: categoryMap[example.category] || 'animation',
  tags: [example.category.toLowerCase()],
  code: example.code,
}));

// Get all examples as ComponentPart array
export const getAllExampleComponents = (): ComponentPart[] => {
  return getRemotionExampleComponents();
};
