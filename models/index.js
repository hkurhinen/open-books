(() => {
  'use strict';
  
  const Sequelize = require('sequelize');
  const config = require('nconf');
  const SignRequest = require('./sign-request');
  
  class Models {

    /**
     * Constructor
     */
    constructor () {
      this.sequelize = new Sequelize(config.get('database:name'), config.get('database:username'), config.get('database:password'), {
        logging: false,
        host: config.get('database:host'),
        dialect: config.get('database:dialect'),
        pool: Object.assign({
          max: 5,
          min: 0,
          idle: 10000
        }, config.get('database:pool') || {})
      });

      this.signRequest = new SignRequest(this.sequelize);
    }
    
    /**
     * Initializes all database models
     * 
     * @returns {Promise} promise that resolves when all database models have been initialized
     */
    async init() {
      await this.sequelize.authenticate();
      await this.signRequest.init();
    }
    
  }

  const models = new Models();
  module.exports = models;

})();