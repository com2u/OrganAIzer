// File: /home/com2u/src/OrganAIzer/backend/routes/reports.js
// Purpose: PDF report generation for assemblies with different export types

const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

/**
 * Generate PDF report for assembly
 * POST /api/reports/generate
 * Body: { assemblyId, exportType, entries, assemblyFilter, options }
 */
router.post('/generate', async (req, res) => {
  try {
    const { 
      assemblyId, 
      exportType, 
      entries = [], 
      assemblyFilter = {}, 
      options = {} 
    } = req.body;

    if (!assemblyId || !exportType) {
      return res.status(400).json({
        error: 'assemblyId and exportType are required'
      });
    }

    logger.info('Generating PDF report', {
      assemblyId,
      exportType,
      entriesCount: entries.length,
      user: req.user?.id
    });

    // Get assembly information
    const getAssemblyQuery = `
      query GetAssembly($assemblyId: String!) {
        assemblies(where: {id: {_eq: $assemblyId}}) {
          id
          name
          description
          createdAt
          updatedAt
        }
      }
    `;

    const assemblyResult = await req.hasura.query(getAssemblyQuery, { assemblyId });
    const assembly = assemblyResult.data.assemblies[0];

    if (!assembly) {
      return res.status(404).json({
        error: 'Assembly not found'
      });
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `${assembly.name} - ${exportType}`,
        Author: 'OrganAIzer',
        Subject: `${exportType} for ${assembly.name}`,
        Creator: 'OrganAIzer.App'
      }
    });

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${assembly.name.replace(/[^a-zA-Z0-9]/g, '_')}_${exportType}_${timestamp}.pdf`;
    const filepath = path.join(__dirname, '../temp', filename);

    // Ensure temp directory exists
    const tempDir = path.dirname(filepath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Pipe PDF to file
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Generate content based on export type
    switch (exportType.toLowerCase()) {
      case 'agenda':
        generateAgenda(doc, assembly, entries, options);
        break;
      case 'protocol':
      case 'minutes':
        generateProtocol(doc, assembly, entries, options);
        break;
      case 'todo':
        generateTodoList(doc, assembly, entries, options);
        break;
      case 'report':
        generateReport(doc, assembly, entries, options);
        break;
      default:
        generateReport(doc, assembly, entries, options);
    }

    // Finalize PDF
    doc.end();

    // Wait for file to be written
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    logger.info('PDF report generated successfully', {
      assemblyId,
      exportType,
      filename,
      fileSize: fs.statSync(filepath).size
    });

    // Return download information
    res.json({
      success: true,
      filename,
      downloadUrl: `/api/reports/download/${filename}`,
      fileSize: fs.statSync(filepath).size,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error generating PDF report:', error);
    res.status(500).json({
      error: 'Failed to generate PDF report',
      details: error.message
    });
  }
});

/**
 * Download generated PDF report
 * GET /api/reports/download/:filename
 */
router.get('/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(__dirname, '../temp', filename);

    // Security check - ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        error: 'Invalid filename'
      });
    }

    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        error: 'File not found'
      });
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Stream file to response
    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);

    // Clean up file after download (optional - could implement cleanup job)
    fileStream.on('end', () => {
      setTimeout(() => {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
          logger.info('Temporary PDF file cleaned up', { filename });
        }
      }, 60000); // Delete after 1 minute
    });

    logger.info('PDF report downloaded', {
      filename,
      user: req.user?.id
    });

  } catch (error) {
    logger.error('Error downloading PDF report:', error);
    res.status(500).json({
      error: 'Failed to download PDF report',
      details: error.message
    });
  }
});

// PDF Generation Functions

function generateAgenda(doc, assembly, entries, options = {}) {
  const { meetingDate, meetingTime, duration, location } = options;

  // Header
  doc.fontSize(20).font('Helvetica-Bold');
  doc.text('MEETING AGENDA', 50, 50);
  
  doc.fontSize(16).font('Helvetica');
  doc.text(assembly.name, 50, 80);
  
  // Meeting details
  doc.fontSize(12).font('Helvetica');
  let yPos = 120;
  
  if (meetingDate) {
    doc.text(`Date: ${meetingDate}`, 50, yPos);
    yPos += 20;
  }
  
  if (meetingTime) {
    doc.text(`Time: ${meetingTime}`, 50, yPos);
    yPos += 20;
  }
  
  if (duration) {
    doc.text(`Duration: ${duration}`, 50, yPos);
    yPos += 20;
  }
  
  if (location) {
    doc.text(`Location: ${location}`, 50, yPos);
    yPos += 20;
  }
  
  if (assembly.description) {
    doc.text(`Description: ${assembly.description}`, 50, yPos);
    yPos += 20;
  }
  
  yPos += 20;
  
  // Agenda items
  doc.fontSize(14).font('Helvetica-Bold');
  doc.text('AGENDA ITEMS', 50, yPos);
  yPos += 30;
  
  doc.fontSize(11).font('Helvetica');
  
  entries.forEach((entry, index) => {
    if (yPos > 700) {
      doc.addPage();
      yPos = 50;
    }
    
    // Item number and title
    doc.font('Helvetica-Bold');
    doc.text(`${index + 1}. ${entry.title}`, 50, yPos);
    yPos += 15;
    
    // Type and status
    doc.font('Helvetica');
    if (entry.type || entry.status) {
      doc.text(`   Type: ${entry.type || 'N/A'} | Status: ${entry.status || 'N/A'}`, 50, yPos);
      yPos += 12;
    }
    
    // Content preview
    if (entry.content) {
      const contentPreview = entry.content.substring(0, 200) + (entry.content.length > 200 ? '...' : '');
      doc.text(`   ${contentPreview}`, 50, yPos, { width: 500 });
      yPos += Math.ceil(contentPreview.length / 80) * 12 + 5;
    }
    
    // Time allocation if provided
    if (entry.timeAllocation) {
      doc.text(`   Time: ${entry.timeAllocation} minutes`, 50, yPos);
      yPos += 12;
    }
    
    yPos += 10;
  });
  
  // Footer
  doc.fontSize(10).font('Helvetica');
  doc.text(`Generated by OrganAIzer on ${new Date().toLocaleDateString()}`, 50, 750);
}

function generateProtocol(doc, assembly, entries, options = {}) {
  const { meetingDate, meetingTime, attendees, decisions } = options;

  // Header
  doc.fontSize(20).font('Helvetica-Bold');
  doc.text('MEETING PROTOCOL', 50, 50);
  
  doc.fontSize(16).font('Helvetica');
  doc.text(assembly.name, 50, 80);
  
  // Meeting details
  doc.fontSize(12).font('Helvetica');
  let yPos = 120;
  
  if (meetingDate) {
    doc.text(`Date: ${meetingDate}`, 50, yPos);
    yPos += 20;
  }
  
  if (meetingTime) {
    doc.text(`Time: ${meetingTime}`, 50, yPos);
    yPos += 20;
  }
  
  if (attendees && attendees.length > 0) {
    doc.text(`Attendees: ${attendees.join(', ')}`, 50, yPos);
    yPos += 20;
  }
  
  yPos += 20;
  
  // Discussion items
  doc.fontSize(14).font('Helvetica-Bold');
  doc.text('DISCUSSION ITEMS', 50, yPos);
  yPos += 30;
  
  doc.fontSize(11).font('Helvetica');
  
  entries.forEach((entry, index) => {
    if (yPos > 650) {
      doc.addPage();
      yPos = 50;
    }
    
    // Item title
    doc.font('Helvetica-Bold');
    doc.text(`${index + 1}. ${entry.title}`, 50, yPos);
    yPos += 15;
    
    // Content
    if (entry.content) {
      doc.font('Helvetica');
      doc.text(entry.content, 50, yPos, { width: 500 });
      yPos += Math.ceil(entry.content.length / 80) * 12 + 10;
    }
    
    // Voting results
    if (entry.totalVotes !== undefined) {
      doc.text(`   Votes: ${entry.totalVotes}`, 50, yPos);
      yPos += 12;
    }
    
    // Rating
    if (entry.stars) {
      doc.text(`   Rating: ${entry.stars}/5 stars`, 50, yPos);
      yPos += 12;
    }
    
    yPos += 15;
  });
  
  // Decisions section
  if (decisions && decisions.length > 0) {
    if (yPos > 600) {
      doc.addPage();
      yPos = 50;
    }
    
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('DECISIONS MADE', 50, yPos);
    yPos += 20;
    
    doc.fontSize(11).font('Helvetica');
    decisions.forEach((decision, index) => {
      doc.text(`${index + 1}. ${decision}`, 50, yPos);
      yPos += 15;
    });
  }
  
  // Footer
  doc.fontSize(10).font('Helvetica');
  doc.text(`Generated by OrganAIzer on ${new Date().toLocaleDateString()}`, 50, 750);
}

function generateTodoList(doc, assembly, entries, options = {}) {
  // Filter entries that are tasks/todos
  const todoEntries = entries.filter(entry => 
    entry.type === 'Task' || 
    entry.type === 'Todo' || 
    entry.status === 'Open' ||
    entry.status === 'In Progress'
  );

  // Header
  doc.fontSize(20).font('Helvetica-Bold');
  doc.text('TODO LIST', 50, 50);
  
  doc.fontSize(16).font('Helvetica');
  doc.text(assembly.name, 50, 80);
  
  doc.fontSize(12).font('Helvetica');
  let yPos = 120;
  
  if (assembly.description) {
    doc.text(assembly.description, 50, yPos);
    yPos += 30;
  }
  
  // Todo items
  doc.fontSize(14).font('Helvetica-Bold');
  doc.text('ACTION ITEMS', 50, yPos);
  yPos += 30;
  
  doc.fontSize(11).font('Helvetica');
  
  todoEntries.forEach((entry, index) => {
    if (yPos > 700) {
      doc.addPage();
      yPos = 50;
    }
    
    // Checkbox and title
    doc.font('Helvetica-Bold');
    doc.text('☐', 50, yPos);
    doc.text(`${entry.title}`, 70, yPos);
    yPos += 15;
    
    // Status and priority
    doc.font('Helvetica');
    doc.text(`   Status: ${entry.status || 'Open'}`, 70, yPos);
    if (entry.stars > 0) {
      doc.text(`   Priority: ${entry.stars}/5 stars`, 250, yPos);
    }
    yPos += 12;
    
    // Description
    if (entry.content) {
      const contentPreview = entry.content.substring(0, 300);
      doc.text(`   ${contentPreview}`, 70, yPos, { width: 450 });
      yPos += Math.ceil(contentPreview.length / 70) * 12 + 5;
    }
    
    // Due date if available
    if (entry.dueDate) {
      doc.text(`   Due: ${entry.dueDate}`, 70, yPos);
      yPos += 12;
    }
    
    yPos += 15;
  });
  
  // Summary
  doc.fontSize(12).font('Helvetica-Bold');
  doc.text(`Total Action Items: ${todoEntries.length}`, 50, yPos + 20);
  
  // Footer
  doc.fontSize(10).font('Helvetica');
  doc.text(`Generated by OrganAIzer on ${new Date().toLocaleDateString()}`, 50, 750);
}

function generateReport(doc, assembly, entries, options = {}) {
  // Header
  doc.fontSize(20).font('Helvetica-Bold');
  doc.text('ASSEMBLY REPORT', 50, 50);
  
  doc.fontSize(16).font('Helvetica');
  doc.text(assembly.name, 50, 80);
  
  // Summary statistics
  doc.fontSize(12).font('Helvetica');
  let yPos = 120;
  
  const stats = calculateStats(entries);
  
  doc.fontSize(14).font('Helvetica-Bold');
  doc.text('SUMMARY', 50, yPos);
  yPos += 25;
  
  doc.fontSize(11).font('Helvetica');
  doc.text(`Total Entries: ${entries.length}`, 50, yPos);
  yPos += 15;
  doc.text(`Average Rating: ${stats.avgRating.toFixed(1)}/5 stars`, 50, yPos);
  yPos += 15;
  doc.text(`Total Votes: ${stats.totalVotes}`, 50, yPos);
  yPos += 15;
  
  // Type breakdown
  if (stats.typeBreakdown.size > 0) {
    doc.text('Types:', 50, yPos);
    yPos += 12;
    stats.typeBreakdown.forEach((count, type) => {
      doc.text(`  ${type}: ${count}`, 70, yPos);
      yPos += 12;
    });
    yPos += 10;
  }
  
  // Status breakdown
  if (stats.statusBreakdown.size > 0) {
    doc.text('Status:', 50, yPos);
    yPos += 12;
    stats.statusBreakdown.forEach((count, status) => {
      doc.text(`  ${status}: ${count}`, 70, yPos);
      yPos += 12;
    });
    yPos += 20;
  }
  
  // Detailed entries
  doc.fontSize(14).font('Helvetica-Bold');
  doc.text('DETAILED ENTRIES', 50, yPos);
  yPos += 25;
  
  doc.fontSize(10).font('Helvetica');
  
  entries.forEach((entry, index) => {
    if (yPos > 650) {
      doc.addPage();
      yPos = 50;
    }
    
    // Entry header
    doc.font('Helvetica-Bold');
    doc.text(`${index + 1}. ${entry.title}`, 50, yPos);
    yPos += 12;
    
    // Metadata
    doc.font('Helvetica');
    doc.text(`Type: ${entry.type || 'N/A'} | Status: ${entry.status || 'N/A'} | Rating: ${entry.stars || 0}/5 | Votes: ${entry.totalVotes || 0}`, 50, yPos);
    yPos += 12;
    
    // Content
    if (entry.content) {
      const content = entry.content.substring(0, 400) + (entry.content.length > 400 ? '...' : '');
      doc.text(content, 50, yPos, { width: 500 });
      yPos += Math.ceil(content.length / 80) * 10 + 10;
    }
    
    yPos += 5;
  });
  
  // Footer
  doc.fontSize(10).font('Helvetica');
  doc.text(`Generated by OrganAIzer on ${new Date().toLocaleDateString()}`, 50, 750);
}

function calculateStats(entries) {
  const stats = {
    totalVotes: 0,
    avgRating: 0,
    typeBreakdown: new Map(),
    statusBreakdown: new Map()
  };
  
  let totalRating = 0;
  let ratedEntries = 0;
  
  entries.forEach(entry => {
    // Votes
    stats.totalVotes += entry.totalVotes || 0;
    
    // Ratings
    if (entry.stars > 0) {
      totalRating += entry.stars;
      ratedEntries++;
    }
    
    // Types
    if (entry.type) {
      stats.typeBreakdown.set(entry.type, (stats.typeBreakdown.get(entry.type) || 0) + 1);
    }
    
    // Status
    if (entry.status) {
      stats.statusBreakdown.set(entry.status, (stats.statusBreakdown.get(entry.status) || 0) + 1);
    }
  });
  
  stats.avgRating = ratedEntries > 0 ? totalRating / ratedEntries : 0;
  
  return stats;
}

module.exports = router;
