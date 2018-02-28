(() => {
  'use strict';
  
  const config = require('nconf');
  const { WebClient } = require('@slack/client');
  
  class SlackClient {

    /**
     * Constructor
     */
    constructor () {
      this.client = new WebClient(config.get('slack:token'));
    }
    
    /**
     * Lists all users from slack
     * 
     * @returns {Promise} promise that resolves into list of users
     */
    listUsers() {
      return this.client.users.list();
    }
    
    /**
     * 
     * @param {String} userId ID of user
     * @param {String} message message to post
     * @returns {Promise} promise that resolves when message has been sent
     */
    postMessageToUser(userId, message) {
      return this.client.conversations.open({
        users: userId
      }).then((response) => {
        return this.client.chat.postMessage(response.channel.id, message);
      });
    }
    
  }

  const slackClient = new SlackClient();
  module.exports = slackClient;

})();