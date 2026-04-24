// ===================================
//   BRAINBALANCE — PDF REPORT ROUTES
//   Generate downloadable stress report
// ===================================

const express = require('express');
const PDFDocument = require('pdfkit');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const StressRecord = require('../models/StressRecord');
const User = require('../models/User');

const router = express.Router();

// ── POST /api/report/generate ──
// Generate a PDF stress report
router.post('/generate', optionalAuth, async (req, res) => {
  try {
    const { inputs, result, recommendations } = req.body;

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: 'BrainBalance Stress Report',
        Author: 'BrainBalance AI',
        Subject: 'Personal Stress Assessment Report'
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=BrainBalance_Report.pdf');
    doc.pipe(res);

    // ── HEADER ──
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .fillColor('#2d6a4f')
       .text('BrainBalance', { align: 'center' });
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#6b6b6b')
       .text('Stress & Burnout Assessment Report', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10)
       .fillColor('#999999')
       .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });

    // Divider
    doc.moveDown(1);
    doc.moveTo(50, doc.y)
       .lineTo(545, doc.y)
       .strokeColor('#e0ddd6')
       .lineWidth(1)
       .stroke();
    doc.moveDown(1);

    // ── RESULTS SECTION ──
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#1a1a1a')
       .text('Assessment Results');
    doc.moveDown(0.5);

    // Stress Level
    const stressColor = result.stress_level === 'Low' ? '#2d6a4f' :
                        result.stress_level === 'Medium' ? '#e67e22' : '#c0392b';
    doc.fontSize(14)
       .font('Helvetica')
       .fillColor('#6b6b6b')
       .text('Stress Level: ', { continued: true })
       .font('Helvetica-Bold')
       .fillColor(stressColor)
       .text(result.stress_level);

    // Burnout Risk
    const burnoutColor = result.burnout_risk.includes('Low') ? '#2d6a4f' :
                         result.burnout_risk.includes('Moderate') ? '#e67e22' : '#c0392b';
    doc.fontSize(14)
       .font('Helvetica')
       .fillColor('#6b6b6b')
       .text('Burnout Risk: ', { continued: true })
       .font('Helvetica-Bold')
       .fillColor(burnoutColor)
       .text(result.burnout_risk);
    doc.moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e0ddd6').lineWidth(1).stroke();
    doc.moveDown(1);

    // ── INPUT SUMMARY ──
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#1a1a1a')
       .text('Your Input Summary');
    doc.moveDown(0.5);

    const inputItems = [
      { label: 'Sleep Hours', value: `${inputs.sleep} hours`, icon: '🛌' },
      { label: 'Work Hours', value: `${inputs.work} hours`, icon: '💼' },
      { label: 'Screen Time', value: `${inputs.screen} hours`, icon: '📱' },
      { label: 'Mood', value: `${inputs.mood}/5`, icon: '😊' },
      { label: 'Exercise', value: inputs.exercise ? 'Yes' : 'No', icon: '🏃' },
      { label: 'Caffeine', value: `${inputs.caffeine || 0} cups`, icon: '☕' },
      { label: 'Deadline Pressure', value: `${inputs.deadlines || 5}/10`, icon: '📅' },
      { label: 'Social Time', value: `${inputs.social || 0} hours`, icon: '👥' },
      { label: 'Sleep Quality', value: `${inputs.sleepQuality || 3}/5`, icon: '🌙' },
    ];

    inputItems.forEach(item => {
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#6b6b6b')
         .text(`${item.icon}  ${item.label}: `, { continued: true })
         .font('Helvetica-Bold')
         .fillColor('#1a1a1a')
         .text(item.value);
    });
    doc.moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e0ddd6').lineWidth(1).stroke();
    doc.moveDown(1);

    // ── RECOMMENDATIONS ──
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#1a1a1a')
       .text('Personalized Recommendations');
    doc.moveDown(0.5);

    if (recommendations && recommendations.length > 0) {
      recommendations.forEach((tip, i) => {
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#333333')
           .text(`${i + 1}. ${tip}`, { width: 480 });
        doc.moveDown(0.3);
      });
    } else {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#6b6b6b')
         .text('Complete an assessment to get personalized recommendations.');
    }
    doc.moveDown(1);

    // ── WEEKLY SUMMARY (if logged in) ──
    if (req.user) {
      try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekRecords = await StressRecord.find({
          userId: req.user.id,
          createdAt: { $gte: weekAgo }
        });

        if (weekRecords.length > 0) {
          doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e0ddd6').lineWidth(1).stroke();
          doc.moveDown(1);

          doc.fontSize(18)
             .font('Helvetica-Bold')
             .fillColor('#1a1a1a')
             .text('7-Day Summary');
          doc.moveDown(0.5);

          const stressCounts = { Low: 0, Medium: 0, High: 0 };
          weekRecords.forEach(r => {
            if (stressCounts[r.result.stress_level] !== undefined) {
              stressCounts[r.result.stress_level]++;
            }
          });

          doc.fontSize(11)
             .font('Helvetica')
             .fillColor('#6b6b6b')
             .text(`Total Assessments: ${weekRecords.length}`)
             .text(`Low Stress Days: ${stressCounts.Low}`)
             .text(`Medium Stress Days: ${stressCounts.Medium}`)
             .text(`High Stress Days: ${stressCounts.High}`);
        }
      } catch (err) {
        // Skip weekly summary if DB error
      }
    }

    // ── FOOTER ──
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e0ddd6').lineWidth(1).stroke();
    doc.moveDown(0.5);

    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#999999')
       .text('DISCLAIMER: This report is generated by AI and is for informational purposes only.', { align: 'center' })
       .text('It is not a medical diagnosis. Please consult a healthcare professional for medical advice.', { align: 'center' });
    doc.moveDown(0.3);
    doc.text('BrainBalance © 2025 — Built with ❤️ for mental wellness', { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
