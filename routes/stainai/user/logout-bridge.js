const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  const returnTo = req.query.return_to || 'https://imaging.howard.edu/stainai';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Logging out...</title>
</head>
<body>
  <script>
    try {
      localStorage.removeItem("STAINAI_USER_PROFILE");
      localStorage.removeItem("STAINAI_ACCESS_TOKEN");
    } catch (e) {}

    window.location.replace(${JSON.stringify(returnTo)});
  </script>
</body>
</html>
  `);
});

module.exports = router;