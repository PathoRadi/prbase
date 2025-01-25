const express = require('express');
const router = express.Router();
const { BlobServiceClient } = require('@azure/storage-blob');
const archiver = require('archiver');
const mysql = require('mysql');
const { Readable } = require('stream');

const dbConfig = require('../../../config/dbConfig');

router.get('/', async (req, res) => {
  const { username, project } = req.query;

  if (!username || !project) {
    console.error("Missing parameters:", { username, project });
    return res.status(400).send("Missing parameters");
  }

  // Create a MySQL connection
  const db = mysql.createConnection(dbConfig);

  try {
    const uploadImageProject = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM stainai_upload_info WHERE project = ?', [project], (err, results) => {
        if (err) return reject(err);
        resolve(results); // Resolve the results as an array
      });
    });

    if (!uploadImageProject) {
      return res.status(400).json({ message: 'Invalid Project' });
    }

    const result = await new Promise((resolve, reject) => {
      db.query('UPDATE stainai_upload_info SET status = "in processing" WHERE project = ?', [project], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

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
      console.log('blob.name:', blob.name);
      if (/\.[a-z0-9]+$/i.test(blob.name)) {
        const blobClient = containerClient.getBlobClient(blob.name);
        const downloadResponse = await blobClient.download(0);
        archive.append(downloadResponse.readableStreamBody, { name: blob.name });
      }
    }
    // Append a JSON file to the ZIP archive
    const jsonData = JSON.stringify(uploadImageProject);

    const jsonStream = Readable.from([jsonData]);
    archive.append(jsonStream, { name: 'stainai_upload_info.json' });

  
    // Finalize the archive
    await archive.finalize();

    archive.on('finish', () => {
      console.log(`Successfully created ZIP file for project: ${project} by user: ${username}`);
      // res.json({ message: `Successfully created ZIP file for project: ${project} by user: ${username}`, fiels: blobStructure });
      return res.status(200).send(`Successfully created ZIP file for project: ${project} by user: ${username}`);
    });


  } catch (error) {
    console.error('Error during signup:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

module.exports = router;