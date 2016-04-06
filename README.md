# CustomSelection::Rails

CustomSelection is a JavaScript library to replace the browser's built-in text-selection ability with custom behavior.

The main goal is to be able to provide a user-experience for selecting static text on mobile browsers that's
similar to the experience with a mouse.

Normally, selecting text on mobile involves a touch-and-hold gesture, which activates a selection range, followed by
a series of touch gestures that adjust the boundaries of the range. On a desktop, it's a simpler, click-and-drag, gesture.

This code allows text to be selected with a simple touch-and-drag gesture.

## Installation

Add this line to your application's Gemfile:

```ruby
gem 'custom_selection-rails', git: 'git://github.com/mercuryanalytics/custom_selection-rails.git'
```

And then execute:

    $ bundle

Or install it yourself as:

    $ gem install custom_selection-rails

## Usage

See the tests in test/custom-selection-test.js

## Development

After checking out the repo, run "python -m SimpleHTTPServer" and connect to http://localhost:8000/ to run the test suite.
Connecting to http://localhost:8000/sample.html will show a demo -- try selecting some text.

To install this gem onto your local machine, run `bundle exec rake install`. To release a new version, update the version number in `version.rb`, and then run `bundle exec rake release`, which will create a git tag for the version, push git commits and tags, and push the `.gem` file to [rubygems.org](https://rubygems.org).

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/mercuryanalytics/custom_selection-rails.

