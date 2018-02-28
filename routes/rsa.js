/* global __dirname */

(() => {
  'use strict';

  const express = require('express');
  const fs = require('fs');
  const path = require('path');
  const crypto = require('crypto');
  const router = express.Router();
  const uuidv4 = require('uuid/v4');
  const algorithm = 'aes-256-ctr';
  
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
   * Encrypts the data with rsa public key
   */
  router.post('/encrypt', async (req, res, next) => {
    if (!req.body.data || !req.body.data.text) {
      const err = new Error('Missing text to encrypt');
      err.status = 400;
      next(err);
      return;
    }
    
    try {
      const data = {};
      data.text = req.body.data.text;
      const key = uuidv4();

      const publicKey = await readFile(__dirname +'/../rsa/rsa_pub.pem');
      const toEncrypt = new Buffer(key);
      const encryptedKey = crypto.publicEncrypt(publicKey, toEncrypt);
      const cipher = crypto.createCipher(algorithm, key);
      let encryptedData = cipher.update(data.text, 'utf8', 'base64');
      encryptedData += cipher.final('base64');

      data.encrypted = `${encryptedKey.toString('base64')}_${encryptedData}`;
      res.send(data);
    } catch(err) {
      next(err);
    }
  });
  
  /**
   * Decrypts the data with rsa private key
   */
  router.post('/decrypt', async (req, res, next) => {
    if (!req.body.data || !req.body.data.encrypted) {
      const err = new Error('Missing encrypted text');
      err.status = 400;
      next(err);
      return;
    }
    
    try {
      const data = {};
      data.encrypted = req.body.data.encrypted;
      const encryptedParts = data.encrypted.split('_');
      const encryptedKey = encryptedParts[0];
      const encryptedData = encryptedParts[1];

      const privateKey = await readFile(__dirname + '/../rsa/rsa');
      const toDecrypt = new Buffer(encryptedKey, 'base64');
      const decryptedKey = crypto.privateDecrypt(privateKey, toDecrypt);

      const decipher = crypto.createDecipher(algorithm, decryptedKey);
      let dec = decipher.update(encryptedData, 'base64', 'utf8');
      dec += decipher.final('utf8');

      data.text = dec;
      res.send(data);
    } catch(err) {
      next(err);
    }
  });

  module.exports = router;

})();
