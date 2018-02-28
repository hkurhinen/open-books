(() => {
  'use strict';

  const express = require('express');
  const router = express.Router();
  const octokit = require('@octokit/rest')();
  const config = require('nconf');
  const moment = require('moment');

  octokit.authenticate({
    type: 'token',
    token: config.get('github:token')
  });

  /**
   * Lists github issues
   */
  router.get('/issues', async (req, res, next) => {
    try {
      const response = await octokit.issues.getForRepo({
        owner: config.get('github:owner'),
        repo: config.get('github:repo')
      });
      
      res.send(response.data);
    } catch(err) {
      next(err);
    }
  });
  
  /**
   * Commits markdown file to github
   */
  router.post('/file', async (req, res, next) => {
    if (!req.body.message || !req.body.content || !req.body.filename) {
      const err = new Error('Missing commit message, content or filename');
      err.status = 400;
      next(err);
      return;
    }
    
    try {
      const response = await octokit.repos.createFile({
        owner: config.get('github:owner'),
        repo: config.get('github:repo'),
        path: `${moment().format('YYYY')}/${req.body.filename}`,
        message: req.body.message,
        content: Buffer.from(req.body.content).toString('base64')
      });
      
      res.send(response.data);
    } catch(err) {
      next(err);
    }
  });

  module.exports = router;

})();