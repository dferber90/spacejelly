require('../data/globals');

module.exports = {

  // Make sure there is one player called 'Ada Lovelace'
  "Contains player Ada Lovelace": function (browser) {

    var baseurl = this.client.launch_url;

    // browser.globals contains data from /tests/spacejelly/data/dev.js
    // data.username
    // data.password, ..
    // var data = browser.globals;

    // you could also set them in /tests/spacejelly/data/*.js
    // and then require them like shown with the globals.

    browser
      .url(baseurl + paths.home)
      .waitForElementPresent('body', timing.timeout)
      .waitForElementVisible(selectors.leaderboard, timing.timeout)
      .assert.containsText(selectors.leaderboard, "Ada Lovelace")
  },

  "At least 5 players present": function (browser) {
    var data = browser.globals;

    browser
      .tagCount('li', function (result) {
        console.log(
          'NOTE: There are %s li elements on the page.\n',
          result.value
        );
      })
      .assert.tagCountGreaterThan(selectors.player, 5)
      .end();
  }
};