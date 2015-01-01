var defaultTimeout = 1000;

var selectors = {
  leaderboard: '.leaderboard',
  individualPlayer: '.player'
};


module.exports = {

  // Make sure there is one player called 'Ada Lovelace'
  "Contains player Ada Lovelace": function (browser) {

    var baseurl = this.client.launch_url;

    // browser.globals contains data from /tests/spacejelly/data/dev.js
    // data.username
    // data.password, ..
    var data = browser.globals;

    browser
      .url(baseurl + data.paths.home)
      .waitForElementPresent('body', defaultTimeout)
      .waitForElementVisible(selectors.leaderboard, defaultTimeout)
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
      .assert.tagCountGreaterThan(selectors.individualPlayer, 5)
      .end();
  }
};