# Delite Unit Tests

This directory contains the Delite unit tests.

## Setup

Before starting, install Intern by running

```
$ npm install
```

Also, if you are going to run against Sauce Labs, then
setup your SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables as they are listed
on https://saucelabs.com/appium/tutorial/3.


## Running the unit tests in a browser

Navigate to:

```
http://localhost/delite/node_modules/intern/client.html?config=tests/intern
```

Note that this won't run the functional tests.


## Running the unit and functional tests in Sauce Labs

In the delite directory:

```
$ grunt test:remote
```

## Running the unit and functional tests locally

1) Download selenium server (http://www.seleniumhq.org/download/) and start it on the default port (4444):

```
$ java -jar selenium-server-standalone-2.37.0.jar
```

2) Edit intern.local.js to list which browsers to test

3) In the delite directory:

   ```
   $ grunt test:local
   ```


## Adjusting reports

Optional reports can be added via grunt flags e.g.

    $ grunt test:local:console // run the console reporter for a local test
    $ grunt test:remote:lcovhtml // run the console reporter for a remote (saucelabs) test with the lcovhtml coverage reporter
    $ grunt test:local:console:lcovhtml // multiple reporters can be specified

Currently only the reporters are provided as optional flags
   * lcovhtml
   * console





