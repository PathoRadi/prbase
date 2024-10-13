const express = require('express');
const router = express.Router();
const { BlobServiceClient } = require('@azure/storage-blob');
const archiver = require('archiver');

router.get('/', async (req, res) => {
    const username = req.query.username;
    const project = req.query.project;

    if (!username || !project) {
        return res.status(400).json({ error: 'Username and project are required.' });
    }

    try {
        const AZURE_CONNECTION_STRING = process.env.AZURE_CONNECTION_STRING;
        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);

        const containerClient = blobServiceClient.getContainerClient('uploaded');      
        const containerExists = await containerClient.exists();
        if (!containerExists) {
            console.log(`Container does not exist: ${containerName}`);
            return res.status(404).send(`Container not found: ${containerName}`);
        }


        // Create the folder path
        const listOptions = {
            includeMetadata: false,
            includeSnapshots: false,
            includeTags: false,
            includeVersions: false,
            prefix: `${username}/${project}/`,
          };


        // const blobs = containerClient.listBlobsFlat(listOptions);
        // const blobStructure = {
        //     files: [],
        // };

        // for await (const blob of blobs) {
        //     if (/\.[a-z0-9]+$/i.test(blob.name)) {
        //         blobStructure.files.push(`https://pathoradi.blob.core.windows.net/uploaded/${blob.name}`);
        //     }
        // }
        // res.json({ ...blobStructure });

         // Set response headers for the ZIP file
         res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${project}.zip"`,
        });

        // Create a ZIP archive
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        // List blobs in the specified folder
        const blobs = containerClient.listBlobsFlat(listOptions);

        // Append blobs to the ZIP archive
        for await (const blob of blobs) {
            if (/\.[a-z0-9]+$/i.test(blob.name)) {
                const blobClient = containerClient.getBlobClient(blob.name);
                const downloadResponse = await blobClient.download(0);
                archive.append(downloadResponse.readableStreamBody, { name: blob.name.replace(`${username}/${project}/`, '') });
            }
        }

        // Finalize the archive
        await archive.finalize();

        archive.on('finish', () => {
            console.log(`Successfully created ZIP file for project: ${project} by user: ${username}`);
            res.json({ message: `Successfully created ZIP file for project: ${project} by user: ${username}`, fiels: blobStructure });
        });
        

    } catch (error) {
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).send('An error occurred while downloading the folder: ' + error.message);
    }
});

module.exports = router;
