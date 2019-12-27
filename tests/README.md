# Delite Tests

This directory contains the Delite unit and functional tests.

## Setup

```
$ npm install
```

Also, if you are going to run against Sauce Labs, then
setup your SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables as they are listed
on https://saucelabs.com/appium/tutorial/3.

## Running locally (from Node)

Run:

```
$ npx intern
```

It doesn't seem necessary to manually start selenium / chromedriver anymore.

## Running against SauceLabs

Set up a SauceLabs account and register user/password as
explained in https://theintern.io/docs.html#Intern/4/docs/docs%2Frunning.md/cloud-service.

```
$ npx intern config=@sauce
```

## Running unit tests from browser

Start local HTTP server in directory above delite:

```
$ http-server
```

Then in browser, navigate to:

http://localhost:8080/delite/node_modules/intern/?reporters=html

(Adjust port to whatever http-server started on.)
