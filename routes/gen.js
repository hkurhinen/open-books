/* global __dirname */

(() => {
  'use strict';

  const express = require('express');
  const router = express.Router();
  const config = require('nconf');
  const fs = require('fs');
  const moment = require('moment');
  const path = require('path');
  const mustache = require('mustache');

  /**
   * Wrapper to wrap fs.readFile into promise
   * 
   * @param {String} file relative or absolute path to file 
   * @returns {Promise} promise which will resolve into file contents 
   */
  const readFile = (file) => {
    return new Promise((resolve, reject) => {
      const filePath = path.resolve(file);
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  };

  /**
   * Generates markdown starting page according to selected issues
   */
  router.post('/page', async (req, res, next) => {
    try {
      const template = await readFile(__dirname +'/../mustache/page.mustache');
      const date = moment().format('DD.MM.YYYY');
      const time = moment().format('HH:mm');
      const issues = req.body.issues;
      res.send(mustache.render(template, {
        date: date,
        time: time,
        issues: issues
      }));
    } catch (err) {
      next(err);
    }
  });

  module.exports = router;

})();