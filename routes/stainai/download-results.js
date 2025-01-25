const express = require('express');
const { BlobServiceClient } = require('@azure/storage-blob');
const router = express.Router();

router.get('/', async (req, res) => {
  const { username, project } = req.query;

  if (!username || !project) {
    return res.status(400).json({ message: 'Missing parameters', params: { username, project } });
  }

  try {
    // Initialize Azure Blob Service Client
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient('uploaded');
    const zipFileName = `${username}/${project}/results.zip`;
    const blobClient = containerClient.getBlobClient(zipFileName);

    // Check if the blob exists
    const blobExists = await blobClient.exists();
    if (!blobExists) {
      return res.status(404).json({ message: `Blob not found: ${zipFileName}` });
    }

    console.log(`Blob found: ${zipFileName}`);

    // Set headers to indicate file download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="results.zip"`);

    // Stream the file from Azure Blob Storage to the response
    const downloadResponse = await blobClient.download(0);

    if (!downloadResponse.readableStreamBody) {
      throw new Error('Failed to get readable stream body');
    }

    const fileStream = downloadResponse.readableStreamBody;
    fileStream.pipe(res);

    // Error handling for stream
    fileStream.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).json({ message: 'Failed to download the file due to stream error' });
    });

    // Log completion of the file stream
    fileStream.on('end', () => {
      console.log('File stream finished successfully');
    });

    // Log when the response finishes
    res.on('finish', () => {
      console.log('File download finished successfully');
    });

  } catch (error) {
    console.error('Error during download process:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

module.exports = router;