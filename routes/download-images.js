// routes/download-images.js

const express = require('express');
const { BlobServiceClient } = require('@azure/storage-blob');
const archiver = require('archiver');
require('dotenv').config();

const router = express.Router();

const sasToken = process.env.AZURE_STORAGE_SAS_TOKEN;
const AZURE_STORAGE_CONNECTION_STRING = `https://pathoradi.blob.core.windows.net/?${sasToken}`;
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

router.get('/', async (req, res) => {
    const username = req.query.username;
    const project = req.query.project; // Make sure 'project' is passed as a query parameter
    const containerName = `uploaded/${username}/${project}`;

    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // List all blobs under the specified container path
        const blobs = containerClient.listBlobsFlat({ prefix: '' }); // Use an empty prefix to get all blobs

        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${project}.zip"`, // Use project name for the ZIP file
        });

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        // Add each blob to the ZIP archive
        for await (const blob of blobs) {
            const blobClient = containerClient.getBlobClient(blob.name);
            const downloadResponse = await blobClient.download(0);
            archive.append(downloadResponse.readableStreamBody, { name: blob.name.replace(`${containerName}/`, '') }); // Clean up the path in the ZIP
        }

        archive.finalize();
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while downloading the folder');
    }
});

module.exports = router;
