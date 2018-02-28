  /* jshint esversion: 6 */
/* global __dirname, Promise */
(() => {
  "use strict";
  
  const BaseModel = require('./base-model');
  const Sequelize = require('sequelize');
  
  /**
   * Database model for signature requests
   */
  class SignRequest extends BaseModel {
    
    /**
     * Constructor
     * 
     * @param {Object} sequelize initialized sequelize
     */
    constructor (sequelize) {
      super(sequelize);
    }
    
    /**
     * Initializes model
     * 
     * @returns {Promise} promise that resolves when database model has been defined
     */
    init() {
      return this.defineModel('SignRequest', {
        id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
        token: { type: Sequelize.STRING(191), allowNull: false },
        name: { type: Sequelize.STRING(191), allowNull: false },
        signature: { type: Sequelize.TEXT('long'), allowNull: true },
        signed: { type: Sequelize.BOOLEAN, allowNull: false }
      }, {
        indexes: [{
          name: 'UN_SIGN_REQUEST_TOKEN',
          unique: true,
          fields: ['token']
        }]
      });
    }
    
    /**
     * Creates new sign request token
     * 
     * @param {String} token sign request token
     * @param {String} name name of the person signature is requested from
     * @returns {Promise} promise that resolves into created signature request
     */
    create(token, name) {
      return this.SignRequest.create({
        token: token,
        name: name,
        signed: false
      });
    }
    
    /**
     * Finds signRequest by token
     * 
     * @param {String} token signRequest token
     * @returns {Promise} promise that resolves into signature request found with token
     */
    findByToken(token) {
      return this.SignRequest.findOne({ where: { token : token } });
    }
    
    /**
     * Updates signature request
     * 
     * @param {Object} signRequest signRequest to update
     * @param {String} signature Signature in SVG format
     * @param {Boolean} signed boolean indicating if signature is signed
     * @returns {Promise} promise that resolves into updated signRequest
     */
    update(signRequest, signature, signed) {
      signRequest.signature = signature;
      signRequest.signed = signed;
      return signRequest.save();
    }
  }
  
  module.exports = SignRequest;

})();