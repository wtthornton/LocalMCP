#!/usr/bin/env node

/**
 * Cleanup Test Artifacts Script
 * 
 * This script cleans up old test artifacts to keep the test-artifacts directory manageable.
 * It removes files older than the specified retention period and archives others.
 */

import fs from 'fs';
import path from 'path';

const RETENTION_DAYS = {
  results: 30,      // Keep JSON results for 30 days
  reports: 14,      // Keep HTML reports for 14 days
  logs: 7,          // Keep logs for 7 days
  screenshots: 7    // Keep screenshots for 7 days
};

const ARCHIVE_DAYS = {
  results: 90,      // Archive results after 90 days
  reports: 30,      // Archive reports after 30 days
  logs: 14,         // Archive logs after 14 days
  screenshots: 14   // Archive screenshots after 14 days
};

function cleanupDirectory(dirPath, retentionDays, archiveDays) {
  if (!fs.existsSync(dirPath)) {
    console.log(`📁 Directory ${dirPath} does not exist, skipping...`);
    return;
  }

  const now = Date.now();
  const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
  const archiveMs = archiveDays * 24 * 60 * 60 * 1000;

  const files = fs.readdirSync(dirPath);
  let deletedCount = 0;
  let archivedCount = 0;

  // Create archive directory if it doesn't exist
  const archiveDir = path.join(dirPath, 'archive');
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  for (const file of files) {
    if (file === 'archive') continue; // Skip archive directory

    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      const age = now - stats.mtime.getTime();

      if (age > archiveMs) {
        // Archive old files
        const archivePath = path.join(archiveDir, file);
        fs.renameSync(filePath, archivePath);
        archivedCount++;
        console.log(`📦 Archived: ${file}`);
      } else if (age > retentionMs) {
        // Delete old files
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`🗑️  Deleted: ${file}`);
      }
    }
  }

  return { deletedCount, archivedCount };
}

function main() {
  console.log('🧹 Starting test artifacts cleanup...\n');

  const baseDir = 'test-artifacts';
  let totalDeleted = 0;
  let totalArchived = 0;

  // Cleanup each type of artifact
  const artifactTypes = [
    { dir: 'results', retention: RETENTION_DAYS.results, archive: ARCHIVE_DAYS.results },
    { dir: 'reports', retention: RETENTION_DAYS.reports, archive: ARCHIVE_DAYS.reports },
    { dir: 'logs', retention: RETENTION_DAYS.logs, archive: ARCHIVE_DAYS.logs },
    { dir: 'screenshots', retention: RETENTION_DAYS.screenshots, archive: ARCHIVE_DAYS.screenshots }
  ];

  for (const type of artifactTypes) {
    console.log(`📂 Cleaning ${type.dir} directory...`);
    const { deletedCount, archivedCount } = cleanupDirectory(
      path.join(baseDir, type.dir),
      type.retention,
      type.archive
    );
    
    totalDeleted += deletedCount;
    totalArchived += archivedCount;
    console.log(`   Deleted: ${deletedCount}, Archived: ${archivedCount}\n`);
  }

  console.log('✅ Cleanup completed!');
  console.log(`📊 Total deleted: ${totalDeleted} files`);
  console.log(`📦 Total archived: ${totalArchived} files`);
}

// Run cleanup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { cleanupDirectory, RETENTION_DAYS, ARCHIVE_DAYS };
