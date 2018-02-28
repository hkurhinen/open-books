  /* jshint esversion: 6 */
/* global __dirname, Promise */
(() => {
  "use strict";
  
  /**
   * Base class for database models
   */
  class BaseModel {
    
    constructor (sequelize) {
      this.sequelize = sequelize;
    }
    
    /**
     * Defines database model
     * 
     * @param {String} name model name
     * @param {Object} attributes model attributes
     * @param {Object} options model options
     * @returns {Object} models synchronized to database;
     */
    defineModel(name, attributes, options) {
      this.modelName = name;
      this[name] = this.sequelize.define(name, attributes, Object.assign(options || {}, {
        charset: "utf8mb4",
        dialectOptions: {
          collate: "utf8mb4_unicode_ci"
        }
      }));
      
      return this[name].sync();
    }
    
    findById(id) {
      this[this.modelName].findOne({ where: { id : id } });
    }
  }
  
  module.exports = BaseModel;

})();