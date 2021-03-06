'use strict';

var async = require('async'),
  Chance = require('chance'),
  request = require('request'),
  auth = require('../auth'),
  catalog = require('../catalog'),
  notifications = require('../notifications'),
  _ = require('underscore');

var chance = new Chance();

function createOne(props, cb) {
  var label = [
    chance.pick(['Call', 'Email', 'Text', 'Yo', 'FaceTime']),
    chance.name({ prefix: true })
  ].join(' ');

  var selectedPlans = props.notifications || [];

  var notificationPlan = {
    label: label,
    critical_state: selectedPlans,
    warning_state: selectedPlans,
    ok_state: selectedPlans
  };

  auth.getAuthTokenAndServiceCatalog(function (err, tokenAndCatalog) {
    var endpoint;

    if (err) {
      return cb(err);
    }
    endpoint = catalog.getCloudMonitoringEndpoint(tokenAndCatalog);

    request({
      method: 'POST',
      uri: endpoint + '/notification_plans',
      json: true,
      headers: {
        'x-auth-token': tokenAndCatalog.access.token.id,
        'accept': 'application/json'
      },
      body: notificationPlan
    }, function (err, res, body) {
      if (err) {
        return cb(err);
      }
      notificationPlan.id = res.headers['x-object-id'];
      cb(null, notificationPlan);
    });
  });
}

function getNotificationsAsync(notificationIds, cb) {
  if (notificationIds) {
    process.nextTick(function () {
      cb(null, notificationIds);
    });
  } else {
    notifications.list(function (err, notifications) {
      if (err) {
        return cb(err);
      }
      cb(null, _.pluck(notifications, 'id'));
    });
  }
}

function create(props, cb) {
  var count = props.count || 1,
    notifications;

  getNotificationsAsync(props.notifications, function (err, nts) {
    if (err) {
      return cb(err);
    }

    async.eachLimit(new Array(count), 10, function (x, cb) {
      var notifications = [],
        ntsCount = chance.natural({
          min: 1,
          max: Math.max(10, nts.length)
        });

      if (props.notifications) {
        notifications = nts;
      } else {
        if (nts.length && ntsCount > 1) {
          notifications = chance.pick(nts, ntsCount);
        } else if (nts.length && ntsCount === 1) {
          notifications = [chance.pick(nts)];
        }
      }

      createOne({ notifications: notifications }, cb);
    }, function (err) {
      if (err) {
        return cb(err);
      }
      cb(null);
    });
  });
}

module.exports = {
  create: create
};
