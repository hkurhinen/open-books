(() => {
  'use strict';

  const express = require('express');
  const router = express.Router();
  const models = require('../models');
  const randomstring = require('randomstring');
  const slackClient = require('../slack');

  /**
   * Renders signing screen
   */
  router.get('/sign/:token', async (req, res, next) => {
    const token = req.params.token;
    if (!token) {
      const err = new Error('Missing signature request token');
      err.status = 400;
      next(err);
      return;
    }
    
    const signRequest = await models.signRequest.findByToken(token); 
    if (!signRequest || signRequest.signed) {
      const err = new Error('Not found');
      err.status = 404;
      next(err);
      return;
    }
    
    res.render('sign', { name: signRequest.name, token: signRequest.token });
  });
  
  /**
   * Saves signature image and update signed status
   */
  router.post('/sign/:token', async (req, res, next) => {
    const token = req.params.token;
    const signature = req.body.signature;
    if (!token || !signature) {
      const err = new Error('Missing signature request token or signature image');
      err.status = 400;
      next(err);
      return;
    }
    
    const signRequest = await models.signRequest.findByToken(token);
    if (!signRequest || signRequest.signed) {
      const err = new Error('Not found');
      err.status = 404;
      next(err);
      return;
    }
    
    res.send(await models.signRequest.update(signRequest, signature, true));
  });
  
  /**
   * Gets signature request status
   */
  router.get('/status/:token', async (req, res, next) => {
    const token = req.params.token;
    console.log(token);
    if (!token) {
      const err = new Error('Missing signature request token');
      err.status = 400;
      next(err);
      return;
    }
    
    const signRequest = await models.signRequest.findByToken(token); 
    if (!signRequest) {
      const err = new Error('Not found');
      err.status = 404;
      next(err);
      return;
    }
    
    res.send(signRequest);
  });
  
  /**
   * Creates new signature request
   */
  router.post('/create', async (req, res, next) => {
    try {
      const name = req.body.name;
      const id = req.body.id;
      if (!name || !id) {
        const err = new Error('Missing users name or id');
        err.status = 400;
        next(err);
        return;
      }

      const token = randomstring.generate({
        length: 150
      });

      const signRequest = await models.signRequest.create(token, name);
      const messageDetails = await slackClient.postMessageToUser(id, `Käy allekirjoittamassa pöytäkirja osoitteessa: http://${req.headers.host}/signature/sign/${signRequest.token}`);
      console.log(messageDetails);
      res.send(signRequest);
    } catch (err) {
      next(err);
    }
  });

  module.exports = router;

})();