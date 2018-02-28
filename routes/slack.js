(() => {
  'use strict';

  const express = require('express');
  const router = express.Router();
  const config = require('nconf');
  const moment = require('moment');
  const slackClient = require('../slack');

  /**
   * Lists slack users
   */
  router.get('/users', async (req, res, next) => {
    try {
      const users = await slackClient.listUsers();
      res.send(users.members);
    } catch(err) {
      next(err);
    }
  });
  

  module.exports = router;

})();