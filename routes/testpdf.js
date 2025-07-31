const express = require("express");
const router =  express.Router();
const Test = require('../models/Test');
const puppeteer = require('puppeteer');

router.get('/download-pdf/:id', async (req, res) => {
  const test = await Test.findById(req.params.id);
  const htmlContent = `
    <html>
    <head>
       <style>
        body {
      font-family: Arial, sans-serif;
    }

    h1 {
      text-align: center;
      margin-bottom: 30px;
    }

    .question-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;
      gap: 20px;
      margin-bottom: 30px;
    }

    .question {
      width: 45%;
      text-align: center;
    }

    .question img {
      max-width: 100%;
      height: auto;
    }

    .button-container {
      text-align: center;
      margin-top: 30px;
    }

    button {
      display: inline-block;
      width: 200px;
      padding: 10px 20px;
      background-color: #4CAF50;
      color: white;
      border: none;
      cursor: pointer;
      font-size: 16px;
      border-radius: 5px;
    }

    button:hover {
      background-color: #45a049;
    }

    /* Print-specific styles */
    @media print {
      /* Hide the print button when printing */
      .button-container {
        display: none;
      }

      /* Hide page title */
      h1 {
        display: none;
      }

      /* Hide the browser UI, such as the address bar, and page date/time (if possible) */
      body {
        margin: 0;
        padding: 0;
      }

      /* Prevent page breaks in unwanted places */
      .question-container {
        page-break-inside: avoid;
      }

      /* Optionally, remove any other UI elements that should not appear when printing */
      header, footer, nav {
        display: none !important;
      }
    }
       </style>
    </head>
    <body>
        <h1>Test: ${test.title}</h1>
        <div class="question-container">
            ${test.questions.map((question, index) => `
                <div class="question">
                    <p><strong>Question ${index + 1}:</strong></p>
                    <img src="${question.questionText}" alt="Question Image">
                </div>
            `).join('')}
        </div>
    </body>
    </html>
  `;

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  const pdfBuffer = await page.pdf();

  await browser.close();

  // Send the PDF as a download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="test-results.pdf"');
  res.send(pdfBuffer);
});

module.exports = router;