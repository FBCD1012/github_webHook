import { minimatch } from 'minimatch';
import type { FilePattern } from '../types/index.js';

export interface FileChanges {
  added: string[];
  modified: string[];
  removed: string[];
}

/**
 * Check if any file changes match the configured patterns
 */
export function matchFilePatterns(
  changes: FileChanges,
  patterns: FilePattern[]
): { matched: boolean; matchedPatterns: string[]; matchedFiles: FileChanges } {
  const matchedPatterns: string[] = [];
  const matchedFiles: FileChanges = {
    added: [],
    modified: [],
    removed: [],
  };

  if (!patterns || patterns.length === 0) {
    // No patterns configured, match all files
    return {
      matched: true,
      matchedPatterns: ['*'],
      matchedFiles: changes,
    };
  }

  const allFiles = [...changes.added, ...changes.modified, ...changes.removed];

  for (const { pattern } of patterns) {
    for (const file of allFiles) {
      if (minimatch(file, pattern)) {
        if (!matchedPatterns.includes(pattern)) {
          matchedPatterns.push(pattern);
        }

        if (changes.added.includes(file) && !matchedFiles.added.includes(file)) {
          matchedFiles.added.push(file);
        }
        if (changes.modified.includes(file) && !matchedFiles.modified.includes(file)) {
          matchedFiles.modified.push(file);
        }
        if (changes.removed.includes(file) && !matchedFiles.removed.includes(file)) {
          matchedFiles.removed.push(file);
        }
      }
    }
  }

  const matched =
    matchedFiles.added.length > 0 ||
    matchedFiles.modified.length > 0 ||
    matchedFiles.removed.length > 0;

  return { matched, matchedPatterns, matchedFiles };
}

/**
 * Aggregate file changes from multiple commits
 */
export function aggregateFileChanges(
  commits: Array<{ added: string[]; modified: string[]; removed: string[] }>
): FileChanges {
  const added = new Set<string>();
  const modified = new Set<string>();
  const removed = new Set<string>();

  for (const commit of commits) {
    commit.added.forEach((f) => added.add(f));
    commit.modified.forEach((f) => modified.add(f));
    commit.removed.forEach((f) => removed.add(f));
  }

  // Clean up: if a file is added and then modified, it's just added
  // if a file is added and then removed, it's neither
  modified.forEach((f) => {
    if (added.has(f)) {
      modified.delete(f);
    }
  });

  removed.forEach((f) => {
    if (added.has(f)) {
      added.delete(f);
      removed.delete(f);
    }
  });

  return {
    added: Array.from(added),
    modified: Array.from(modified),
    removed: Array.from(removed),
  };
}
